# Supplementary freeze — Phase R, a routing eval for one installed fleet skill

**Status: FROZEN.** Written after Phase G completed and before Phase R trial 1.
Date frozen: 2026-09-18. Branch: `study/frontier-tier-2026-09-18`.
Parent freeze: [`2026-09-18-frontier-tier-census.md`](2026-09-18-frontier-tier-census.md).

**This is a routing eval, not an uplift eval, and it is designed after seeing
Phase G.** Both are declared here so neither can be discovered later. It reports
one number — adoption — and it is barred from reporting an effect.

## Why it exists

The study's delete-list question is about 107 installed skills. Exactly one of
them is named by any probe in this repository: `null-census` declares
`skillUnderTest: skill/provenance-print-houses`, and
`~/.claude/skills/provenance-print-houses` is installed in the operator's fleet.

Phase G gated `null-census` at **10/10 unaided at `claude-opus-5`** —
`VOID-FOR-TIER`. Under the parent freeze that ends the matter: arm B is not run,
because an arm-B number against a ceiling is arithmetic, not a measurement.

So the uplift question about this skill is closed as **cannot be measured at this
tier**. That is not the same as "does nothing", and the parent freeze says so.

But half of measured uplift in this repository has never been about content. It
is about **adoption** — a skill nothing opens has zero effect whatever it holds,
measured at 0/40 at Haiku 4.5 across three descriptions, 18/30 and 23/30 at
Sonnet 5, 30/30 at Fable 5. Adoption is answerable on a void probe, because it
does not depend on the outcome changing. That is the whole of what Phase R asks.

## The question, and the one endpoint

**R1, and the only endpoint: does `claude-opus-5` open
`provenance-print-houses` when the task sits squarely in its domain?**

`skillFired` on arm B, n = 10, `null-census`, library mounted with
`--skill C:/Users/nileh/.claude/skills/provenance-print-houses` so no probe
record is edited and the mounted sha256 lands in `meta.json`.

`skillFired` is the detector corrected earlier today in commit `faf15ae` — before
this freeze, and before any arm-B trial of this study existed. Its predicate is
guarded by a case in `selftest()` that fails if it misses a real load or fires on
an unmounted name.

## What this freeze forbids

- **No effect is reported.** Arm B's pass rate on `null-census` will be recorded
  in the row files and is **barred from the results record's findings**, because
  arm A is 10/10 and a comparison against a ceiling cannot separate a working
  skill from an idle one. It is not a co-primary, a secondary, or a directional
  band.
- **No Fisher test is run on this probe**, so Phase R adds nothing to the BH-FDR
  family and cannot dilute the deflation applied to Phase C.
- **The result generalises to one skill on one fixture at one tier.** A skill
  that fires here may not fire on a task its description matches less well, and
  a skill that does not fire here is not thereby shown to be worthless.

## Prediction, frozen

Adoption exceeds zero — at least 1 of 10. The Haiku 4.5 zero is a cheap-tier
result and Sonnet 5 and Fable 5 both cleared it comfortably.

## Spend

10 trials. `null-census` ran 10 gate trials in 1.5 minutes wall-clock at
concurrency 6, so this is the cheapest measurement in the study. It sits inside
the parent freeze's study cap of 350.
