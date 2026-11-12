"""Stream-mode metrics over a finished run directory.

Usage: python harness/stream_metrics.py <run-dir> --cap <tokens>
           [--learner carried] [--reference reset] [--seed 0] [--resamples 2000] [--json]

Reads rows/*.json (verdicts) and transcripts/*.jsonl (the final result line's
usage) written by stream.mjs. Spends nothing and re-runs nothing.

The charge for a visit is its additive usage tokens (tokens.usage_total). A
visit the oracle failed, or one that ran past the cap, is charged the full cap
and counted unsolved. u = 100 * charge / cap.

  U   mean u over an arm's visits            P   share of visits solved under the cap
  L   (U0 - U) / (U0 - U*) on the stream     share of the removable cost removed
        U0  the reference arm, which starts every visit from the same setup
        U*  perfect memory: the reference arm's charge on a task's first
            exposure, zero on every return
  S   (U0(E) - U(E)) / U0(E) on a test E     the seen test and the held-out test

Instances are paired across the two arms. An instance voided in either arm
(infra, or no result line) is dropped from both; a task whose first exposure is
dropped leaves L altogether, because U* cannot be formed for it. Intervals are
percentile intervals from paired resamples of tasks, drawn from random.Random
seeded with a string, so the output is the same bytes for the same rows under
any PYTHONHASHSEED.

A second reference run under another name (stream.mjs --name reset-b) gives the
null band: --learner reset-b --reference reset is L and S between two runs
that differ only in sampling.
"""

import argparse
import json
import random
import sys
from pathlib import Path

from tokens import result_line, usage_total


def load(run_dir, cap):
    """arm name -> {(phase, slot, play): visit}, each visit charged."""
    arms = {}
    for f in sorted((run_dir / "rows").glob("*.json")):
        r = json.loads(f.read_text(encoding="utf-8"))
        t = run_dir / "transcripts" / f"{r['tid']}.jsonl"
        res = result_line(t) if t.exists() and not r["infra"] else None
        if res is None:
            r.update(tokens=None, u=None, ok=None, cost=0.0)   # voided; what it cost is not in a result line
        else:
            r["cost"] = res.get("total_cost_usd", 0.0)
            tok = usage_total(res)
            ok = bool(r["solved"]) and tok <= cap
            r.update(tokens=tok, ok=ok, u=100.0 * (tok if ok else cap) / cap)
        arms.setdefault(r["arm"], {})[(r["phase"], r["slot"], r["play"])] = r
    return arms


def paired(a, b, phase):
    """task -> [(exposure, u learner, u reference)] for instances both arms hold."""
    out = {}
    for key in sorted(k for k in a if k[0] == phase and k in b):
        x, y = a[key], b[key]
        if x["u"] is None or y["u"] is None:
            continue
        out.setdefault(x["task"], []).append((x["exposure"], x["u"], y["u"]))
    return out


def mean(xs):
    xs = list(xs)
    return sum(xs) / len(xs) if xs else None


def parts(groups):
    v = [x for g in groups for x in g]
    if not v:
        return None
    return (mean(u for _, u, _ in v), mean(r for _, _, r in v),
            mean(r if e == 0 else 0.0 for e, _, r in v))


def learned(groups):
    p = parts(groups)
    if p is None or p[1] == p[2]:
        return None                     # nothing removable: L is undefined, not zero
    return (p[1] - p[0]) / (p[1] - p[2])


def saved(groups):
    p = parts(groups)
    return (p[1] - p[0]) / p[1] if p and p[1] else None


def interval(groups, stat, seed, n):
    """95% percentile interval of stat over n resamples of the task groups."""
    if not groups:
        return None
    rng, k, vals = random.Random(seed), len(groups), []
    for _ in range(n):
        s = stat([groups[int(rng.random() * k)] for _ in range(k)])
        if s is not None:
            vals.append(s)
    if not vals:
        return None
    vals.sort()
    return [vals[int(0.025 * len(vals))], vals[min(len(vals) - 1, int(0.975 * len(vals)))], len(vals)]


def summarise(arm):
    out = {}
    for phase in sorted({k[0] for k in arm}):
        rows = [arm[k] for k in sorted(arm) if k[0] == phase]
        live = [r for r in rows if r["u"] is not None]
        out[phase] = {
            "visits": len(rows), "voided": len(rows) - len(live),
            "U": mean(r["u"] for r in live), "P": mean(1.0 if r["ok"] else 0.0 for r in live),
            "over_cap": sum(1 for r in live if r["solved"] and not r["ok"]),
            "oracle_errors": sum(1 for r in live if r["cls"].startswith("fail-oracle")),
            "mean_tokens": mean(r["tokens"] for r in live),
            "max_solved_tokens": max((r["tokens"] for r in live if r["solved"]), default=None),
            "cost_usd": sum(r["cost"] for r in live),
        }
    stream = [arm[k] for k in sorted(arm) if k[0] == "stream" and arm[k]["u"] is not None]
    out["curve"] = [mean(r["u"] for r in stream if r["exposure"] == e)
                    for e in sorted({r["exposure"] for r in stream})]
    return out


def measure(run_dir, cap, learner, reference, seed, resamples):
    arms = load(Path(run_dir), cap)
    for name in (learner, reference):
        if name not in arms:
            sys.exit(f"ERROR: no rows for arm '{name}' in {run_dir} (found: {', '.join(sorted(arms)) or 'none'})")
    a, b = arms[learner], arms[reference]
    out = {"cap": cap, "unit": "additive usage tokens", "learner": learner, "reference": reference,
           "seed": seed, "resamples": resamples,
           "arms": {name: summarise(arms[name]) for name in sorted(arms)}}

    stream = paired(a, b, "stream")
    kept = {t: v for t, v in stream.items() if any(e == 0 for e, _, _ in v)}
    groups = [kept[t] for t in sorted(kept)]
    p = parts(groups)
    out["L"] = {"value": learned(groups), "ci95": interval(groups, learned, f"{seed}:L", resamples),
                "U": p and p[0], "U0": p and p[1], "U_star": p and p[2],
                "tasks": len(groups), "visits": sum(len(g) for g in groups),
                "tasks_dropped": sorted(set(stream) - set(kept))}
    for phase in ("seen", "heldout"):
        by = paired(a, b, phase)
        groups = [by[t] for t in sorted(by)]
        p = parts(groups)
        out[f"S_{phase}"] = {"value": saved(groups), "ci95": interval(groups, saved, f"{seed}:S:{phase}", resamples),
                             "U": p and p[0], "U0": p and p[1],
                             "tasks": len(groups), "instances": sum(len(g) for g in groups)}
    return json.loads(json.dumps(out), parse_float=lambda s: round(float(s), 6))


def show(m):
    f = lambda x: "undefined" if x is None else f"{x:.3f}"
    ci = lambda c: "" if c is None else f"  [{c[0]:.3f}, {c[1]:.3f}] over {c[2]} resamples"
    print(f"cap {m['cap']:,} {m['unit']}   learner {m['learner']}   reference {m['reference']}")
    for name, arm in m["arms"].items():
        for phase, s in arm.items():
            if phase != "curve":
                print(f"  {name:10} {phase:8} visits {s['visits']:4}  voided {s['voided']:3}  U {f(s['U'])}  P {f(s['P'])}"
                      f"  over cap {s['over_cap']}  oracle errors {s['oracle_errors']}  ${s['cost_usd']:.2f}")
        print(f"  {name:10} U by exposure  {' '.join(f(u) for u in arm['curve'])}")
    L = m["L"]
    print(f"L        {f(L['value'])}{ci(L['ci95'])}   U {f(L['U'])}  U0 {f(L['U0'])}  U* {f(L['U_star'])}"
          f"   {L['tasks']} tasks, {L['visits']} visits" + (f", dropped {L['tasks_dropped']}" if L["tasks_dropped"] else ""))
    for phase in ("seen", "heldout"):
        S = m[f"S_{phase}"]
        print(f"S {phase:7}{f(S['value'])}{ci(S['ci95'])}   {S['tasks']} tasks, {S['instances']} instances")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("run_dir")
    ap.add_argument("--cap", type=int, required=True, help="the pre-registered cap, in additive usage tokens")
    ap.add_argument("--learner", default="carried")
    ap.add_argument("--reference", default="reset")
    ap.add_argument("--seed", default="0")
    ap.add_argument("--resamples", type=int, default=2000)
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    m = measure(a.run_dir, a.cap, a.learner, a.reference, a.seed, a.resamples)
    if a.json:
        print(json.dumps(m, indent=1, sort_keys=True))
    else:
        show(m)


if __name__ == "__main__":
    main()
