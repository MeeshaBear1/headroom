# Phase C — the one probe with headroom, contrasted at Opus 5

**Read the confound section before the results table.** Arm A of this contrast
reached the operator's home configuration directory in 20 of 30 trials. Arm B
reached it in 0 of 30. "Unaided" in this record means one thing in one arm and
something else in the other, and the direction of that difference flatters the
result. It is quantified below rather than averaged away.

Frozen before trial 1: [Phase C](../prereg/2026-09-18-frontier-tier-phase-c.md),
selected mechanically from the [census](2026-09-18-gate-frontier-tier-census.md)
by the rule in the [parent freeze](../prereg/2026-09-18-frontier-tier-census.md).
Run data: [`frontier-tier-opus5/`](frontier-tier-opus5/).

## What ran

| Probe | Arm | Model | Library | n | Pass | Skill fired |
|---|---|---|---|---|---|---|
| `motion-undocumented` | A | `claude-opus-5` | none | 30 | **8 (26.7%)** | — |
| `motion-undocumented` | B | `claude-opus-5` | `everyone-path`, soft-present | 30 | **30 (100%)** | **30 / 30** |
| `motion-undocumented` | C | `claude-fable-5` | none | 10 | **8 (80%)** | — |
| `motion-no-js-mandated` | A | `claude-opus-5` | none | 30 | **30 (100%)** | — |
| `motion-no-js-mandated` | B | `claude-opus-5` | `everyone-path`, soft-present | 30 | **29 (96.7%)** | **30 / 30** |

Infra rows: **0 in 130 trials**. The infra floor of 6 was not reached, so no STOP fired.

## The endpoints, as frozen

**E1 — effect.** Arm A 8/30 against arm B 30/30. Fisher two-sided
**p = 8.27 × 10⁻¹⁰**.

**E2 — adoption.** `skillFired` 30/30 in arm B. The prompt is byte-identical
across arms and never mentions a skill; the library was soft-present and the
model opened it every time. In the transcripts it is the *first* tool call, ahead
of reading the fixture.

**E3 — harm.** `motion-no-js-mandated` is the matched harm control: the same
library, the same byte-identical prompt shape, and a fixture where
`everyone-path`'s instruction to add a JavaScript layer is the wrong answer.
Arm A 30/30, arm B 29/30, `skillFired` 30/30. Fisher two-sided **p = 1.0**.

This control has the property the repository's older one lacks. `convention-override`
cannot distinguish "no harm" from "no room to show harm", because its ground truth
already equals the model's unaided default in both directions. Here arm A sits at
100%, so the only direction available to the measurement is down — and it did not
go down.

One arm-B trial did strand content invisible, which is exactly the defect this
fixture exists to catch, against zero such trials in arm A. One event at n = 30 is
not a harm effect and is not reported as one. It is recorded because it is the only
harm observed anywhere in this study, and because a reader deciding whether to
install this library should know the failure mode exists rather than learn it from
a site.

**Deflation.** BH-FDR at q = 0.05 across the A-vs-B family, which is these two
comparisons and no others:

```
family size m=2  q=0.05  BH-selected: 1
rank  label                                     raw p    BH crit     BH adj p  selected
   1  E1-effect                           8.27018e-10    0.02500  1.65404e-09  YES
   2  E3-harm                                       1    0.05000            1  no
```

Raw p values are in the table above; the deflated verdicts are what this record
reports.

## M1 — scored against its frozen allowance

The freeze predicted that outcome on `motion-undocumented` is determined by
whether the build writes a JavaScript reveal layer at all, with `jsLayer` defined
as `site/main.js` differing from the fixture's 17-byte baseline, and allowed **at
most 2 discordant trials in 30 per arm**.

| Arm | js-layer pass | js-layer fail | css-only pass | css-only fail | Discordant |
|---|---|---|---|---|---|
| A (n=30) | 8 | 0 | 0 | 22 | **0** |
| B (n=30) | 30 | 0 | 0 | 0 | **0** |
| C (n=10) | 8 | 0 | 0 | 2 | **0** |

**Zero discordant trials in 70, against an allowance of 2 per arm.** Arm A alone
gives Fisher p = 1.71 × 10⁻⁷. There is no third behaviour: every trial that wrote
a reveal layer in JavaScript passed, and every trial that did not, failed. Arm B
is degenerate for this test — the mounted skill asks for the layer, so all 30
wrote one — and is reported for completeness, not as evidence.

## M2 — what this is not evidence about

The freeze recorded this before the trials so it could not be argued afterwards.
`slipway:motion`, the motion skill installed in the operator's fleet, states a
double guard — a `prefers-reduced-motion` query wrapping an
`@supports (animation-timeline: view())` query, with *"Base state must be fully
legible"* and *"Nothing depends on animation to become visible."* **That rule is
satisfied by a CSS-only reveal.** `everyone-path`, the skill mounted in arm B,
asks for an `IntersectionObserver` base layer so the reveal itself happens in
every engine.

These are different rules and this probe grades the stricter one. The headroom
measured here is therefore headroom against `everyone-path`, and says nothing
about whether `slipway:motion` earns its context. For the part that does overlap,
the census measured the opposite: 10 of 10 unaided trials wrote the
reduced-motion guard and **0 of 10 stranded content invisible in Firefox**, which
is the defect `slipway:motion` exists to prevent.

## The ceiling, and where the skill lands against it

Arm C ran the same fixture unaided at `claude-fable-5`, the tier above.

| Comparison | Rate | Fisher two-sided |
|---|---|---|
| Arm C vs arm A — is there a tier gap at all | 80% vs 26.7% | p = 0.0068, OR 11.0 |
| Arm B vs arm C — does the library reach the ceiling | 100% vs 80% | p = 0.058 |

There is a real tier gap on this fixture: the ceiling model does the task
unaided four-fifths of the time where the subject model does it a quarter of the
time. The library closes it. The excess above the ceiling is not significant at
n = 30 against n = 10 and is not claimed.

## Pilot-vs-freeze gap

The repo's standing rule is that a pilot number is never quoted as the baseline.
The gate measured this probe at **2/10 (20%)** and that is what froze the
contrast. The contrast resumed by trial id, so those ten rows are the first ten
of arm A. The disjoint comparison is the twenty trials the gate never saw:

| Rows | Pass |
|---|---|
| `A-001` … `A-010` (the pilot) | 2 / 10 — 20% |
| `A-011` … `A-030` (fresh) | 6 / 20 — 30% |
| Arm A as frozen, n = 30 | **8 / 30 — 26.7%** |

The pilot under-read the arm by 10 points on the fresh rows. The verdict does not
change and the effect is far too large to be touched by it, but the gap is on the
record because the last time this repository quoted a pilot it had to withdraw a
claim.

## The confound — Defect 5, now measured per arm

[Defect 5](2026-09-18-gate-frontier-tier-census.md) is that a throwaway
`CLAUDE_CONFIG_DIR` stops the operator's skills being *loaded* and does nothing
about a trial *reading* the operator's disk. Phase C shows it is not distributed
evenly across arms:

| Arm | Reached `~/.claude` |
|---|---|
| A | **20 / 30** |
| B | **0 / 30** |
| C | 4 / 10 |

The mechanism is visible in the tool-call order. In arm B the mounted skill is
tool call 1, before the fixture is even listed; the question is answered and the
model never goes looking. In arm A the task is underspecified, the model goes
hunting, and what it finds outside the fixture is the operator's own motion
doctrine — which, per M2, is satisfied by the CSS-only reveal this oracle fails.

Inside arm A, post-hoc and at n = 30:

| Arm A trials | Pass | Fail |
|---|---|---|
| Reached `~/.claude` | 3 | 17 |
| Stayed in the fixture | 5 | 5 |

Fisher two-sided p = 0.078, OR 0.18. Not significant, directionally consistent
with the census observation that 8 of 9 doctrine-readers failed, and **post-hoc —
it buys a caution, not a number**.

**What this costs the headline.** Two thirds of arm A ran with access to a
document that points at the failing answer. The p-value above is not what
threatens the result — the effect is ten orders of magnitude clear of it, and the
ten uncontaminated arm-A trials still only passed 5/10 against arm B's 30/30. The
honest statement is narrower than "the library lifts an unaided model": it is
that the library lifts a model whose alternative source of guidance, in this
fixture, was worse than nothing. Whether the lift survives against a genuinely
sealed arm A is **not measured here** and needs a rerun after the seal is fixed.

## Deviations from the freeze

**D1 — none to the design.** Arms, models, n, the oracle, the endpoints and
the stopping rule ran exactly as frozen. 110 new trials, which is the freeze's cap
exactly. Zero infra rows, so the infra floor of 6 never came near firing.

**D2 — two analyses added after the freeze, both labelled.** The per-arm reach
table and the arm-A reach-by-outcome 2×2 are not in the freeze, because Defect 5
was found after it was written and before Phase C ran. Neither is in the BH family,
neither touches a frozen endpoint, and both are reported as post-hoc.

**D3 — arm B's M1 row is degenerate and is not counted as support.** The mounted
skill asks for the JavaScript layer, so all 30 arm-B trials wrote one and the 2×2
has an empty column. M1 is scored on arms A and C.
