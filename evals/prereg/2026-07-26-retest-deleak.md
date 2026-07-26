# Pre-registration — de-leaked skill retest (rule-drift / convention-override)

**Status: FROZEN.** Written and committed before trial 1 of this phase.

Date frozen: 2026-07-26

## Why this phase exists

An external review of the 2026-07-24 contrast
([`../runs/2026-07-24-contrast-rule-drift.md`](../runs/2026-07-24-contrast-rule-drift.md))
found that `probes/rule-drift/skill/rule-consistency` — the skill that produced
that run's 37%→100% (p = 5.34×10⁻⁸) result — named the fixture's exact domain
in its own frontmatter (*"audit logging, ordering"*) and paraphrased
`docs/CONVENTIONS.md`'s rationale sentence and its "do not factor into a shared
wrapper" line closely enough that a reader cannot tell whether the measured
effect was a general, transferable disposition or a domain-matched hint dressed
as one. That review also noted the harm control, `convention-override`, cannot
by itself distinguish "the skill did nothing" from "the skill actively resisted
doing harm," because `claude-sonnet-5`'s unaided default already equals that
fixture's ground truth (30/30 arm A, both runs).

This phase does not retract the original result. It asks a narrower, harder
question of the same skill family: **does a version of the skill with the
fixture-specific wording removed — same four-part judgement, different
sentences — still produce the effect?**

## What changed and what didn't

- **Unchanged:** `probes/rule-drift` and `probes/convention-override` are
  untouched — their frozen `skill/rule-consistency` (sha256:`07550bba3d88fdfb`)
  is exactly what the 2026-07-24 contrast measured, and remains the artifact
  that result is about.
- **New:** `probes/rule-drift-deleak` and `probes/convention-override-deleak`
  are byte-identical clones of the two originals (`diff -rq` verified at
  freeze time) except for `skill/rule-consistency/SKILL.md`, which is revised
  to remove the fixture-specific wording. Both clones carry the same
  fixture-integrity guard added to the originals on this date (see the
  2026-07-24 prereg's deviation log) — the guard is a hardening fix, not part
  of what this phase is testing.
- **What was removed from the skill:** the frontmatter's explicit domain list
  (`audit logging, ordering` → generalized to `call ordering, retry and
  idempotency behavior, error handling, naming`); the quoted rationale
  sentence (*"log before the mutation, not after, because the trail must
  survive a failure"*); the literal phrase `force the failure, force the
  retry` (generalized to `interrupt the operation partway, repeat it, run it
  twice, starve it of whatever it assumes will be available`); and the
  structural echo of `docs/CONVENTIONS.md`'s `"Do not factor this into a
  shared wrapper"` line (reworded to a general point about abstraction needing
  its own justification). The four section headers and the overall argument
  are unchanged. Full diff: both versions are committed in this repository —
  `probes/rule-drift/skill/rule-consistency/SKILL.md` (original) vs.
  `probes/rule-drift-deleak/skill/rule-consistency/SKILL.md` (revised).

## Relationship to prior data

Arm A for both probes is **not re-collected.** Nothing arm A depends on
(model, prompt, fixture, oracle behaviour on unmodified input) has changed —
the clones are byte-identical to the originals in every respect except the
skill, and the skill is absent in arm A by definition. This phase reuses:

- `rule-drift` arm A: 11/30 (`evals/runs/contrast-rule-drift-sonnet5`)
- `convention-override` arm A: 30/30 (`evals/runs/contrast-rule-drift-sonnet5`)

Both were regraded against the hardened oracle on this date with zero
classification changes (see the 2026-07-24 prereg's deviation log) before this
freeze, so reusing them is not reusing pre-hardening numbers.

## Environment (pinned)

Identical to the 2026-07-24 contrast, except the oracle hashes (hardened, see
that prereg's deviation log) and this phase's own artifact table below.

| | |
|---|---|
| `claude` CLI | 2.1.206 |
| Node | v24.16.0 |
| Platform | Windows 11, win32 |
| Runner | `harness/run.mjs` sha256:`bdaf65b12c4cbc1d` |
| Permission mode | `acceptEdits` |
| Allowed tools | `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` |
| Max turns | 80 |
| Timeout | 900 s/trial |
| Concurrency | 6 |

## Arms in this phase

- **Arm B only**, both probes. Subject model `claude-sonnet-5`. The de-leaked
  skill soft-present at `skill/rule-consistency`; prompt byte-identical to the
  original arm A/B (sha256:`422d913a9b721837`, verified equal to the original).
- Arm A: reused from the original contrast, per above. No new arm C — the
  ceiling comparison already exists for the original skill and this phase is
  not claiming a new gap-closure figure, only a same-vs-different-skill
  comparison against the same arm A.

## Probes and artifact hashes (frozen)

| probe | role | prompt sha256 | oracle sha256 | probe.json sha256 | skill sha256 |
|---|---|---|---|---|---|
| `rule-drift-deleak` | primary retest | `422d913a9b721837` | `a3734dbf252666f6` | `3914177ed07cb9ab` | `87f6137f25003d6e` |
| `convention-override-deleak` | matched harm control retest | `422d913a9b721837` | `289f2c033688b163` | `55d9461985c09b2a` | `87f6137f25003d6e` |

The skill hash is identical across both probes by design, same as the
original pair.

## n

**n = 30 per probe, arm B only.** 60 trials total. Matches the original
contrast's arm-B sizing so the two arm-B rates are directly comparable by the
same Fisher-exact convention.

## Primary metric and bar

Primary: `rule-drift-deleak` arm B pass rate vs. the reused `rule-drift` arm A
(11/30), Fisher exact two-sided.

- **p < 0.01 and pass rate materially above 37%**: the de-leaked skill still
  lifts compliance — evidence the original effect was (at least partly)
  general-disposition transfer, not merely a domain-matched hint.
- **Pass rate statistically indistinguishable from the 37% baseline, or from
  what a no-skill re-run of arm A would show**: the effect did not survive
  de-leaking — the honest reading is that the original result was closer to
  "an explicit, domain-matched hint closes the gap" than "a general
  disposition transfers." This is a publishable, useful outcome, not a
  failed retest.
- **Pass rate between the two**: report the exact number and the p-value
  against both the original 37% and the original 100%; do not force it into
  either bucket.

Secondary, directional only: `convention-override-deleak` arm B vs. its reused
30/30 arm A. Per the external review, this comparison structurally cannot
distinguish "no harm" from "no room to show harm" (arm A is already at
ceiling) — it is reported as a floor-suspect check on the de-leaked skill, not
as an independent harm-control claim. `skill fired` is reported for both
probes regardless of outcome.

## Abort rules

Same as the original contrast: >6 `infra-*` rows in a single invocation halts
the run; a `STOP` file is checked each iteration; every trial that does not
reach the statistics is named with its reason.

## Exclusions declared in advance

`infra-*` rows only, reported separately. Nothing else.

## What gets published

Both arm-B rates, whatever they are, compared against the reused arm A for
each probe, with the exact `fisher.py` command. If the effect does not
survive de-leaking, that is the headline of this phase's run record, not a
result to explain away.

## Deviations from this pre-registration

*(append-only)* — none yet.
