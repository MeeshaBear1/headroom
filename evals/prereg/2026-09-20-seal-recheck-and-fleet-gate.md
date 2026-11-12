# Freeze — seal re-gate at Opus 5, and a second fleet skill at Sonnet 5

Committed before trial 1. Two gates, 20 trials, arm A only. No contrast is
licensed by this freeze under any outcome.

| | |
|---|---|
| Gate 1 | `motion-undocumented`, arm A, `claude-opus-5`, n = 10, **sealed** |
| Gate 4 | `null-census`, arm A, `claude-sonnet-5`, n = 10 |
| Harness | `harness/run.mjs` at commit `5c23018`, with the Defect 5 seal and the per-trial void rule |
| Out dirs | `evals/runs/seal-recheck-opus5/`, `evals/runs/gate-nullcensus-sonnet5/` |
| Infra floor | 6 infra rows in either gate aborts that gate and voids its arm |

Gate 1 runs in a **fresh** output directory. The runner resumes by trial id, so
reusing `frontier-tier-opus5/` would return the contaminated rows rather than
run anything.

## Why these two

Gate 1 is the only cheap test of whether this repository's single frontier-tier
uplift survives its own disclosed confound. Arm A of the
[contrast](../runs/2026-09-18-contrast-motion-undocumented-opus5.md) obtained
operator content in 20 of 30 trials and read house doctrine that satisfies a
weaker rule than the oracle grades. The
[doctrine comparison](../runs/2026-09-20-doctrine-comparison.md) then found that
the stricter rule is absent from the fleet entirely. So arm A has never been
measured under a seal, and the result rests on trials whose alternative source
of guidance pointed at the failing answer.

Gate 4 costs almost nothing and adds the second fleet-installed skill ever put
through this harness. `null-census` names `provenance-print-houses`, which is
installed in the operator's library. It gated 10/10 at Opus 5 and has never been
gated at Sonnet 5, the tier where this repository has actually found headroom.

## Predictions, frozen

| # | Prediction |
|---|---|
| P1 | Gate 1 returns **`HAS-HEADROOM`** — the sealed arm-A rate stays at or below 50% |
| P2 | Gate 1's sealed rate lands **above** the contaminated 8/30 (26.7%), because the doctrine that steered 8 of 9 readers to the failing answer is now out of reach |
| P3 | Gate 4 returns **`VOID-FOR-TIER`** at 9/10 or better |
| P4 | Zero trials classify `infra-reached-operator-config` in gate 1 |

P2 and P1 can both hold; they are not the same claim. P1 is about the verdict,
P2 about the direction of the rate.

## The decision rule, fixed before the data

Written now so no outcome can be read favourably afterwards.

| Gate 1 sealed rate | Reading | Action |
|---|---|---|
| ≤ 50% | The uplift survives the seal | Fund the full re-run of the census and contrast |
| 51–69% | Ambiguous at n = 10 | One more n = 10 before any contrast spend |
| ≥ 70% | The contrast largely measured contamination | **Cancel the re-run.** Publish the correction against claim 22 |

| Gate 4 | Action |
|---|---|
| ≥ 9/10 | Second fleet skill void. Combined with the Opus 5 census, stop building frontier probes for installed skills |
| ≤ 8/10 | A fleet skill has a measurable gap at Sonnet 5. A contrast becomes worth pricing, under its own later freeze |

## What this freeze does not license

- No contrast, no arm B, no `--skill` mount, in either gate.
- No claim about `everyone-path` as a library to install. The
  [doctrine comparison](../runs/2026-09-20-doctrine-comparison.md) settled that
  it teaches a rule the fleet does not hold, and no gate here revisits it.
- No pooling of gate 1's rows with the 2026-09-18 arm A. Different seal, different
  instrument, reported side by side and never summed.
- No number from either gate quoted as a result. **Both are gates.** This
  repository has withdrawn a claim for breaking that rule once.

## Deviations

Recorded here as they occur, dated, never by editing the text above.

**2026-09-20 — gate 1 voided by the instrument, and re-run.** The first gate 1
attempt returned 8 of 10 rows as `infra-reached-operator-config`, over the infra
floor of 6, which voids the arm. The cause was our own detector, not the seal.
`obtainedOperatorContent` counted any tool result whose text contained the config
path, and a directory listing prints the path it listed. Pairing every call that
named the config with its result across those ten transcripts:

```
REFUSED  : { Read: 19 }
RETURNED : { Bash: 9, Glob: 2 }
calls whose result carried a line of house doctrine: 0
```

All nine Bash calls were `ls`. The seal held for file content and the detector
called that a breach. Fixed in `370bd8a`: the call is paired with its result and
classified by what the tool returns, with four cases in the self-check — a
refusal, a real read, a listing, and a `cat` through Bash.

Gate 1 re-runs from scratch into `evals/runs/seal-recheck-opus5-r2/`, as the
529-outage rows did. **No number from the voided arm is quoted anywhere**, and P4
is already falsified: trials did classify `infra-reached-operator-config`, for a
reason that turned out to be ours.

**2026-09-20 - the detector was wrong a second time, and the tenth row came
back.** The re-run graded 9 rows and voided one more, `A-007`, on the same
class. That row was refused too, in the CLI's other voice: `Permission to use
Bash with command ... has been denied`, which the v2 detector did not know.
A third case then turned up in the voided v1 run - a malformed command whose
result was `bash: unexpected EOF`, which is not a refusal at all.

The fault is structural. v1 and v2 both inferred that content was obtained
from the ABSENCE of a known failure string, so every failure mode not yet met
read as a breach. v3 requires positive evidence instead: a tool result must
carry a line that is literally in one of the operator's own docs. Under v3,
**0 of 20 sealed trials obtained operator content**, across both gate-1
attempts.

`A-007` was then graded by `run.mjs regrade` from its saved transcript and
trial directory. `regrade` was changed to re-examine rows voided by the seal
detector - that detector is an instrument, and correcting one is what a
regrade is for - while every other infra class stays voided. The regrade is
legal here because no arm B exists for this probe. Its validity check is that
the nine live-graded rows regraded to the class they already had, 9 for 9;
only the false void moved.

One number computed today is withdrawn before publication: that 52 of the 102
historically contaminated trials obtained content. It was a v2 figure. The
conservative mention count, 102 of 250, stands.

Result: **gate 1 sealed arm A 10/10, `VOID-FOR-TIER`**, which is inside the
frozen >= 70% band. Gate 4 10/10, `VOID-FOR-TIER`. Both recorded in
[the run record](../runs/2026-09-20-gates-seal-recheck-and-nullcensus.md).
