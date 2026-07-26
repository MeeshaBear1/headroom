# Pre-registration — retry-discipline contrast (Sonnet 5)

**Status: FROZEN.** Written and committed before any arm-A or arm-B trial of
this phase ran. Everything below is fixed. A change to any frozen field
after trial 1 invalidates every affected trial and the invalidation is
recorded here, not absorbed.

Date frozen: 2026-07-26.
Purpose: measure whether `rule-consistency` helps, harms, or has no effect
on `retry-discipline` — a fixture built specifically so that a plausible
hidden bias in the skill (toward more defensive code, never less) would show
up as a measurable regression rather than a null, unlike `convention-override`.

Pre-registered pilot: [`2026-07-26-pilot-retry-discipline.md`](2026-07-26-pilot-retry-discipline.md),
n=10 arm A, result **8/10 (80%) pass → HAS-HEADROOM**. Per the same logic as
the original rule-drift contrast's own pilot-vs-freeze note: the pilot number
is directional only and is not used in any statistic below. A fresh arm A is
collected at n=30 for this contrast.

## What is and is not being retested

This is a new probe, not a re-run of `rule-drift`/`convention-override`.
Nothing about the original 2026-07-24 contrast or the 2026-07-26 de-leak
retest changes because of this phase, regardless of outcome.

## Skill under test

`rule-consistency`, sha256:`07550bba3d88fdfb` — the exact frozen file from
the original contrast, byte-identical, copied unmodified into
`probes/retry-discipline/skill/rule-consistency/SKILL.md`. Not the de-leaked
variant: this phase asks whether the *original* skill generalizes to an
opposite-valence mechanism, the same question convention-override was meant
to answer and couldn't.

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
| `probes/retry-discipline/skill/rule-consistency/SKILL.md` | `07550bba3d88fdfb` |

Unchanged since the pilot froze — no deviation to log here.

## Arms and n (frozen)

| probe | arm | model | n | skill present |
|---|---|---|---|---|
| `retry-discipline` | A | `claude-sonnet-5` | 30 | no |
| `retry-discipline` | B | `claude-sonnet-5` | 30 | yes (`rule-consistency`) |

n=30/arm, matching the original contrast's power (Fisher exact resolves a
37%→100%-sized effect at p≈5×10⁻⁸ at this n; see `uplift-statistics`).
No arm C: this phase asks about a specific skill's behavior, not about
where a ceiling model lands unaided on a brand-new fixture.

## Primary metric (frozen)

Fisher exact, two-sided, arm A vs arm B pass rate. `python harness/fisher.py
<passB> <failB> <passA> <failA>`.

## Secondary, always reported (frozen)

1. **Adoption**: `skillFired` rate in arm B, and the fired-vs-not-fired
   pass-rate split — the same decomposition the de-leak retest used, because
   a raw B-vs-A rate confounds "the skill changed the answer" with "the
   skill was never opened."
2. **Direction of effect**: arm B pass rate is reported whether it is above,
   below, or equal to arm A. A drop is the harm signal this probe exists to
   be able to show; a rise replicates rule-drift's uplift on an
   opposite-valence mechanism; no change is a null, reported as one.
3. **Failure-mode breakdown**: `no-log` vs `swallowed` vs `retried` vs
   `wrong-args`/`wrong-shape` counts in both arms, by dominant class per
   failing row. The pilot's two arm-A failures were both clean
   `fail-no-log` (0/6, not partial) — whether arm B's failures, if any, are
   the same shape or shift toward `swallowed`/`retried` is itself evidence
   about whether the skill's influence (if a regression appears) is a
   defensiveness bias specifically.

## What counts as the finding, decided in advance

- **Arm B pass rate statistically above arm A** (Fisher p < 0.05, direction
  matching): read as a second, independent replication of `rule-consistency`
  generalizing correctly — now on a mechanism where the "obviously careful"
  answer is wrong, ruling out "the skill always pushes toward more
  verification/retries" as the operative mechanism, since that bias would
  have hurt here, not helped.
- **Arm B pass rate statistically below arm A**: the harm-control result
  this framework has not yet produced. Reported exactly as measured, with
  the failure-mode breakdown, whether or not it is convenient.
- **No statistically detectable difference**: reported as a null. Not
  reframed as "no room to show harm" — arm A is pre-registered in the
  HAS-HEADROOM band specifically so a null here is a real null, not
  `convention-override`'s degenerate one.
- The fired/not-fired split is reported regardless of which of the above
  holds, exactly as it was in the de-leak retest.

## Abort rules

- More than 6 `infra-*` rows total across both arms → halt, fix the harness,
  re-run the affected trials from scratch. Infra rows are never counted as
  behavioural failures.
- Any trial that does not reach the statistics is named in the run record
  with its reason. No silent caps.

## Cost estimate

60 short agentic sessions (30/arm). Order of magnitude $15–25 at
`claude-sonnet-5` list prices, comparable to the 2026-07-26 de-leak retest's
$16.58 for the same trial count; the exact figure goes in the run record
from actual usage.

## Deviations from this pre-registration

*(append-only; none yet)*
