# Supplementary freeze — Phase C of the frontier-tier census

**Status: FROZEN.** Written after Phase G completed and before Phase C trial 1.
Date frozen: 2026-09-18. Branch: `study/frontier-tier-2026-09-18`.
Parent freeze: [`2026-09-18-frontier-tier-census.md`](2026-09-18-frontier-tier-census.md).

**Declared up front: everything in this file was designed after seeing Phase G
data.** The parent freeze fixed the selection rule, the arms and the endpoints
before trial 1; this file adds one mechanism prediction that Phase G's rows
suggested. It is prospective for Phase C and nowhere else, and the Phase G
numbers that motivated it are reported as what they are — a gate-scale
observation at n = 10, which this repository does not quote as a result.

## What the frozen rule selected

Applied mechanically by `census.mjs` over the Phase G rows, not chosen by hand:

- **Eligible** (non-harm-control, `HAS-HEADROOM`): `motion-undocumented` alone, at 2/10 (20%). Every other non-harm probe gated `VOID-FOR-TIER`
- **Primary** (lowest arm-A rate): `motion-undocumented`. No tie-break was needed, so the populated-`skill/` and alphabetical steps of the rule did not fire
- **Matched harm control** (the harm-control probe naming the same library):
  `motion-no-js-mandated` — the only harm-control probe whose `skillUnderTest` basename is also `everyone-path`

## M1 — the mechanism, frozen before trial 1 of Phase C

**Prediction: on `motion-undocumented`, outcome is determined by whether the
build writes a JavaScript reveal layer at all, and by nothing else.**

Predicate, frozen: `jsLayer` := the trial's `site/main.js` differs from the
fixture's baseline, which is 17 bytes — the single line `// Site scripts.`.
Neither prompt names JavaScript, `IntersectionObserver`, or `main.js`.

Allowance: **at most 2 discordant trials in 30 per arm.** A discordant trial is
one that writes a JS layer and fails, or writes none and passes. Above that
allowance M1 is reported as not supported, and the allowance is stated here so
it cannot be widened afterwards.

What motivated it, labelled: in Phase G's 10 arm-A trials, 8 left `main.js`
untouched at 17 bytes and all 8 failed; 2 wrote an `IntersectionObserver` layer
and both passed. Zero discordant. That is n = 10 and post-hoc, so it buys a
prediction and a decision to test one — never a number to publish.

## M2 — what the failures are compliant with, and why it matters

`slipway:motion`, the motion skill installed in the operator's fleet, states the
**double guard** as house style: a `prefers-reduced-motion` query wrapping an
`@supports (animation-timeline: view())` query, with *"Base state must be fully
legible — never `opacity: 0` here"* and *"Nothing depends on animation to become
visible"*. That rule is satisfied by a CSS-only reveal. It prevents content being
stranded invisible; it does not ask for a reveal in an engine without
`animation-timeline`.

`everyone-path`, the skill mounted in arm B, asks for more: an
`IntersectionObserver` base layer so the reveal itself happens everywhere.

**These are different rules, and this probe grades against the stricter one.**
Recorded now so no reader of the results can take headroom here as evidence
about the fleet's installed motion skill. Phase G measured the opposite for the
part that overlaps: 10 of 10 unaided trials wrote the `prefers-reduced-motion`
guard, 8 of 10 wrote the `@supports` guard, and **0 of 10 stranded content
invisible in Firefox** — the canonical defect `slipway:motion` names. Nothing in
the fixture asks for any of that.

**No endpoint attaches to M2.** It is a scope statement about what the primary
endpoint may and may not be read to mean.

## Arms, unchanged from the parent freeze

| Arm | Model | Library | n |
|---|---|---|---|
| A | `claude-opus-5` | absent | 30 — Phase G's 10 retained, 20 added by resume |
| B | `claude-opus-5` | soft-present, the probe's frozen `skill/` | 30 |
| C | `claude-fable-5` | absent | 10 |

Matched harm control: arms A and B, `claude-opus-5`, n = 30 each.

Endpoints, bars, the BH-FDR deflation at q = 0.05 and the abort rules are the
parent freeze's and are not restated or altered here.

## Spend

110 trials at most, inside the parent freeze's Phase C cap of 190 and the study
cap of 350. Phase G spent 130.
