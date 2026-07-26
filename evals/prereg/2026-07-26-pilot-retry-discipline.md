# Pre-registration — retry-discipline pilot gate

**Status: FROZEN.** Written and committed before any trial of this probe ran.
Everything below is fixed. A change to any frozen field after trial 1
invalidates every affected trial and the invalidation is recorded here, not
absorbed.

Date frozen: 2026-07-26.
Purpose: decide whether `probes/retry-discipline` has enough unaided
headroom at `claude-sonnet-5` to be worth spending a full A/B contrast on —
before spending on one.

## Why this probe exists

An external review of the 2026-07-24 rule-drift/convention-override contrast
found that `convention-override`, the harm control paired with
`rule-consistency`, could not actually distinguish "the skill is harmless"
from "the fixture had no room to show harm": its documented (inverted)
convention happened to already equal `claude-sonnet-5`'s unaided default
(30/30 arm A, no skill present), so there was nothing for a hidden bias in
the skill to visibly break.

`retry-discipline` is a second, independent harm-control attempt for the
same skill (`rule-consistency`, frozen sha256:`07550bba3d88fdfb`, an
unmodified copy of the exact file cited in the original contrast — this
pilot does not use the de-leaked variant). It changes two things at once,
deliberately:

1. **A different mechanism.** `rule-drift`/`convention-override` are about
   audit-call *ordering*. This probe is about error-*propagation discipline*
   under a simulated external call (`gateway.send`) — log a failure, then
   let it propagate; never retry it, never catch-and-return a fallback. A
   hidden bias confined to "logging order" would not transfer here; a hidden
   bias toward "add more defensive code" would.
2. **The opposite valence.** `rule-drift`'s correct answer required *more*
   defensive machinery than the naive instinct (audit before, not after).
   This probe's correct answer requires *less* — no retry loop, no
   try/catch-and-continue — than a generic "make this more robust" instinct
   is likely to add. If `rule-consistency`'s real effect on `rule-drift` were
   a disguised "always be more careful/defensive" bias rather than genuine
   rule-following, this is the shape of fixture where that bias would
   produce a measurable regression, not a null.

## `harmControl` field, read literally

`probes/retry-discipline/probe.json` sets `"harmControl": false`. This is
deliberate, not a miscategorization: `harness/run.mjs`'s `gateVerdict()`
reads `harmControl: true` as "ground truth already equals the default, so a
near-ceiling arm A is what makes this usable" — exactly
`convention-override`'s (broken) shape. This probe is built the other way:
arm A is *expected low*, like an uplift probe, because the documented
restraint runs against a generic defensiveness instinct. Gating it with
`harmControl: true`'s thresholds would misreport a low arm A — the outcome
that makes this probe usable — as "too little headroom downward". This
pilot is read with the ordinary uplift gate bands below.

## Environment (pinned)

| | |
|---|---|
| `claude` CLI | 2.1.206 |
| Node | v24.16.0 |
| Platform | Windows 11, win32 |
| Runner | `harness/run.mjs` sha256:`bdaf65b12c4cbc1d` |
| Statistics | `harness/fisher.py` sha256:`e07ed0c79373fa57` |
| Permission mode | `acceptEdits` |
| Allowed tools | `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` |
| Max turns | 80 |
| Timeout | 900 s/trial |
| Concurrency | 6 |
| Session isolation | throwaway `CLAUDE_CONFIG_DIR` per trial, per the leak probe (EVIDENCE.md claim 5) |

## Artifact hashes (frozen)

| file | sha256 (first 16) |
|---|---|
| `probes/retry-discipline/prompt.txt` | `f39821d71255fb3d` |
| `probes/retry-discipline/oracle.mjs` | `c54ff04201d8f984` |
| `probes/retry-discipline/probe.json` | `79b74ee6f8cf41cd` |
| `probes/retry-discipline/skill/rule-consistency/SKILL.md` | `07550bba3d88fdfb` (identical to the frozen original) |

Every selftest case (`base`, `fixed`, `swallowed`, `retried`, `partial`,
`wrong-params`, `tampered-gateway`) passed the pristine-state gate offline
before this freeze — `node harness/run.mjs selftest --probe
probes/retry-discipline`.

## Arm in this phase

**Arm A only.** Subject model, `rule-consistency` absent, no `.claude/`
directory in the trial's working copy at all.

Subject model: `claude-sonnet-5`.

## n

**n = 10.** A screen, not a test — resolves the ≥90% / ≤5% bands sharply,
matching the 2026-07-24 gate's own n and rationale (`uplift-statistics`'s
sample-size table). Not powered to detect an effect; a result in the middle
band is a green light to spend on a contrast, not a measurement of one.

## Gate thresholds (frozen, ordinary uplift bands — see above for why)

| Arm A pass rate | Verdict | Consequence |
|---|---|---|
| ≥ 90% (9/10 or 10/10) | **VOID-FOR-TIER** | ceiling; no contrast bought here; the void is published |
| 5% – 90% (1/10 – 8/10) | **HAS-HEADROOM** | eligible for a full A/B contrast, to be pre-registered separately once this pilot's number is known |
| ≤ 5% (0/10) | **FLOOR-SUSPECT** | before reading as "the model needs help": re-run the offline selftest, then run one arm-A trial with the ground truth handed over verbatim in the prompt — if that also fails, the probe is broken, not the model |

## What gets published

All 10 rows and the verdict, whatever it is — including VOID-FOR-TIER, which
would mean `claude-sonnet-5` already avoids retry/swallow-on-failure unaided
and this fixture cannot host a harm-control contrast either, same as
`convention-override`. That outcome is recorded as the result, not iterated
away by building an easier fixture without disclosing the miss.

## Abort rules

- More than 6 `infra-*` rows in this pilot → halt, fix the harness, re-run
  the affected trials from scratch. Infra rows are never counted as
  behavioural failures.
- Any trial that does not reach the statistics is named in the run record
  with its reason. No silent caps.

## Deviations from this pre-registration

*(append-only; none yet)*
