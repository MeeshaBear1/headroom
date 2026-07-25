---
name: uplift-statistics
description: Turning trial rows into a defensible number — Fisher exact on 2x2 outcome counts, the sample-size action table, why n=10 pilots are directional only, odds ratios that must report null instead of infinity, multiple-probe discipline, and the reporting format. Use when deciding how many trials to run, when interpreting a p-value from an A/B arm pair, when a pilot looks promising, or before quoting any uplift figure. Not for probe or oracle design — use probe-design and oracle-contract. Not for tier scoping — use headroom-calibration.
---

# Uplift statistics

Outcomes are binary and counts are small, so the whole toolkit is one test plus
the discipline not to over-read it.

## Fisher exact, two-sided

Build the 2×2 from pass/fail counts per arm and run a two-sided Fisher exact test.
Small-n exact beats chi-square with its approximations, and it needs no
distributional assumption.

    python harness/fisher.py <B_pass> <B_fail> <A_pass> <A_fail>

Ship the test with a self-test that asserts a known value, and fail closed on bad
input. A statistics helper that silently returns a wrong number is worse than none.

**Odds ratio reports null when a cell is zero**, never infinity and never a
made-up substitute. A zero cell is a real, reportable state of the data.

## How many trials

| Pilot p-value (n≈10/arm) | Read it as | Do |
|---|---|---|
| p < 0.01 | strong | claimable; still confirm the harm control |
| 0.01 ≤ p < 0.2 | directional only | scale the **one** primary probe to n ≈ 30/arm |
| p ≥ 0.2 | no signal | do not buy more trials; route the failure first (uplift-eval-core) |

**A pilot at n=10 cannot settle anything.** A single effect of roughly +40
percentage points has been observed to read p ≈ 0.18 at n=10/arm and
p ≈ 5 × 10⁻⁵ at n=30/arm — same effect, same direction, one unpublishable and one
decisive. Treat every n=10 result as directional, in both directions: a null at
n=10 is not a null.

Concentrate power. One primary probe at n=30/arm beats five probes at n=10/arm,
because the five produce nothing you can claim and cost more.

## Pre-register the bar, not the found threshold

The α, the primary metric, the primary probe, and the claimable range are frozen
before trial 1. Given data, a threshold that the data clears can always be found;
the freeze is the only thing that makes the number mean anything.

**One primary.** Secondaries are labelled directional and never carry the claim. If
you genuinely test several probes as primary, correct for it and say which
correction — but the better move is to pick one.

## Report the whole table

Every probe you ran appears, including nulls, voids, and the harm control. A
results table showing only the probes that worked is a selection effect with a
p-value attached.

```markdown
| probe | arm | model | n | pass | rate | skill fired | p (vs A) | verdict |
|---|---|---|---|---|---|---|---|---|
| repo-truth   | A | <subject> | 30 | 8  | 27% | —     |        |        |
| repo-truth   | B | <subject> | 30 | 22 | 73% | 26/30 | <x>    | UPLIFT |
| repo-truth   | C | <ceiling> | 10 | 9  | 90% | —     |        |        |
| overcaution  | A | <subject> | 30 | 28 | 93% | —     |        | harm control |
| overcaution  | B | <subject> | 30 | 19 | 63% | 25/30 | <x>    | COST   |
```

Each row carries the exact command that produced its p-value. If a figure in the
prose cannot be traced to a row, it does not go in the prose.

## Also report, always

- **Adoption** — in how many arm-B trials did the library actually get opened. A
  large effect with 3/30 adoption is a different finding from one with 29/30.
- **Failure-class breakdown** — which named wrong behaviour dominated (oracle-contract).
- **Variance across identical runs** — instability is itself a result.
- **Excluded rows** — how many, and why (trial-harness-ops).

## What the number does not say

A significant p-value on one probe, one tier, one fixture set says exactly that. It
does not say the library helps in general, at other tiers, on other tasks, or in
production. Scope every sentence (headroom-calibration) and let the harm control
stand next to the win.

## Siblings

- **uplift-eval-core** — verdicts, pre-registration, failure routing.
- **headroom-calibration** — tier scoping and gap closure.
- **oracle-contract** — where the outcome classes come from.
