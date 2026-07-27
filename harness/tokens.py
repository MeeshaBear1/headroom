"""Post-hoc token accounting over already-collected trial transcripts.

Usage: python harness/tokens.py <run-dir> [<run-dir> ...]

Reads rows/*.json (verdicts) and transcripts/*.jsonl (final result line
usage) from each run directory and prints per-(probe, arm) token/cost
aggregates as markdown. Observational only: transcripts are the ones the
pre-registered runs already produced; nothing here re-runs a trial.
"""

import json
import re
import statistics
import sys
from pathlib import Path

TID_RE = re.compile(r"(.+)-([ABC])-\d+$")


def result_line(path):
    # ponytail: last line is the result in every observed transcript; scan
    # backwards anyway so a truncated file degrades to "skipped", not a crash
    for line in reversed(path.read_text(encoding="utf-8").splitlines()):
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        if d.get("type") == "result":
            return d
    return None


def collect(run_dir):
    run_dir = Path(run_dir)
    rows = {}
    for f in (run_dir / "rows").glob("*.json"):
        r = json.loads(f.read_text(encoding="utf-8"))
        rows[r["tid"]] = r
    trials = []
    for f in sorted((run_dir / "transcripts").glob("*.jsonl")):
        tid = f.stem
        m = TID_RE.match(tid)
        res = result_line(f)
        if not m or res is None:
            print(f"  skipped (no result line or bad tid): {f.name}", file=sys.stderr)
            continue
        u = res.get("usage", {})
        trials.append({
            "probe": m.group(1),
            "arm": m.group(2),
            "tid": tid,
            "row": rows.get(tid),
            "cost": res.get("total_cost_usd", 0.0),
            "turns": res.get("num_turns", 0),
            "secs": res.get("duration_ms", 0) / 1000,
            "out_tok": u.get("output_tokens", 0),
            "total_tok": sum(u.get(k, 0) for k in (
                "input_tokens", "output_tokens",
                "cache_creation_input_tokens", "cache_read_input_tokens")),
        })
    return trials


def agg(trials):
    n = len(trials)
    passes = sum(1 for t in trials if t["row"] and t["row"]["cls"] == "pass")
    tot_cost = sum(t["cost"] for t in trials)
    mean = lambda k: statistics.mean(t[k] for t in trials)
    return {
        "n": n, "passes": passes,
        "mean_cost": mean("cost"), "total_cost": tot_cost,
        "cost_per_pass": tot_cost / passes if passes else float("nan"),
        "mean_out": mean("out_tok"), "mean_total": mean("total_tok"),
        "mean_turns": mean("turns"), "mean_secs": mean("secs"),
    }


def table(header, groups):
    print(f"\n### {header}\n")
    print("| group | n | pass | mean cost | mean output tok | mean total tok "
          "(incl. cache) | mean turns | mean secs | total cost | cost per pass |")
    print("|---|---|---|---|---|---|---|---|---|---|")
    for name, trials in groups:
        a = agg(trials)
        print(f"| {name} | {a['n']} | {a['passes']} | ${a['mean_cost']:.3f} | "
              f"{a['mean_out']:,.0f} | {a['mean_total']:,.0f} | "
              f"{a['mean_turns']:.1f} | {a['mean_secs']:.0f} | "
              f"${a['total_cost']:.2f} | ${a['cost_per_pass']:.2f} |")


def main():
    for run_dir in sys.argv[1:]:
        trials = collect(run_dir)
        print(f"\n## {Path(run_dir).name}  ({len(trials)} trials)")
        keys = sorted({(t["probe"], t["arm"]) for t in trials})
        table("By probe and arm", [
            (f"{p} arm {a}", [t for t in trials if t["probe"] == p and t["arm"] == a])
            for p, a in keys])
        fired = [t for t in trials if t["row"] and t["row"].get("skillFired") is True]
        not_fired = [t for t in trials if t["row"] and t["row"].get("skillFired") is False]
        if fired and not_fired:
            by_probe = sorted({t["probe"] for t in fired + not_fired})
            table("Arm B, skill fired vs not fired", [
                (f"{p} {label}", sub)
                for p in by_probe
                for label, pool in (("fired", fired), ("not fired", not_fired))
                if (sub := [t for t in pool if t["probe"] == p])])


if __name__ == "__main__":
    main()
