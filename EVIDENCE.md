# Evidence ledger

One rule: **a claim enters this file only with evidence a third party can
re-derive without trusting us.** Absence of evidence is UNVERIFIABLE, never a
pass. Unsubstantiated claims are listed PENDING and stay listed.

Last updated: 2026-07-24.

## What this repository currently proves

| # | Claim | Evidence | Status |
|---|---|---|---|
| 1 | The three shipped oracles discriminate: each FAILS at its fixture's base state and PASSES at its pristine fixed state | `node harness/run.mjs selftest --probe probes/<id>` for `repo-truth`, `disclosure`, `overcaution` — offline, no API key, exits non-zero on any mismatch | **VERIFIED** |
| 2 | Each oracle also rejects the specific plausible wrong answers, not just "nothing done" | the same selftests run named counterfactual overlays: `subtotal-tax`, `float-money`, `silenced`, and fabricated / hedged / silent transcripts | **VERIFIED** |
| 3 | `repo-truth`'s discriminator cannot be passed by luck | two orders with identical subtotal (3891) and different required tax (339 vs 340); the conventional subtotal-rounding answer yields 340 for both. Asserted in `probes/repo-truth/oracle.mjs` and exercised by overlay `subtotal-tax` | **VERIFIED** |
| 4 | Fisher exact implementation is correct on known values | `python harness/fisher.py --self-test` — asserts `[[8,2],[1,5]] → 0.034965034965…` to 1e-9 and brackets a second table; exits 2 on failure | **VERIFIED** |
| 5 | A trial session is sealed from the operator's global agent configuration | leak probe: a session spawned with a throwaway `CLAUDE_CONFIG_DIR`, in the shape `harness/run.mjs` uses, answered **no / no / no** to "is a custom mode active", "do you have skill X", "do you have memory of prior conversations". Reproduce with the command in README → *What the harness guarantees* | **VERIFIED** (single probe, 2026-07-24, `claude` CLI 2.1.206, `claude-sonnet-5`) |
| 6 | The fixtures are self-contained: zero dependencies, tests runnable offline | `cd probes/repo-truth/fixture && npm test` → 5/5 pass; `cd probes/overcaution/fixture && npm test` → 3/3 pass after the fix | **VERIFIED** |
| 7 | The three shipped probes have **no headroom** at Opus 5 or Sonnet 5 tier: both models pass all three unaided | 60/60 arm-A trials, n=10 per probe per model, 0 infra rows, pre-registered thresholds. Rows in `evals/runs/gate-{sonnet5,opus5}/rows-regraded/`; record: [`evals/runs/2026-07-24-gate.md`](evals/runs/2026-07-24-gate.md) | **VERIFIED** |
| 8 | The graders are frozen against real model output, not just synthetic cases | 40 real arm-A transcripts from both models shipped in `probes/{disclosure,overcaution}/transcripts/` and asserted by `selftest` — 51 cases across the three probes | **VERIFIED** |
| 9 | Any **uplift** of Opus 5 or Sonnet 5 from any skill library | none. The gate voided all three probes at both tiers, so no contrast was run — per the pre-registered rule, not as a choice made afterwards | **NOT MEASURED** |

Claim 9 is the one people will want and it is not made. The gate result (claim 7)
is why: a contrast against a 100% unaided baseline measures the ceiling, not the
library. See the run record's *Honest reading* for what that does and does not say.

### The graders were wrong first, and it mattered

The first grading pass mis-scored **9 of 60 rows**, in both directions, from two
bugs in transcript regex matching. One of them made `disclosure` look like it had
headroom at Sonnet 5 (5/10); the other made Opus 5 look like it hedges results it
had verified (7/10). Both were false. Corrections were made on arm-A pilot data
with no arm-B trial in existence — the one point at which `oracle-contract` allows
it — and both moved the numbers **away** from a claimable finding.

This is disclosed prominently rather than buried because it is the most useful
thing in the run: a transcript oracle that has never been checked against real
model output should be assumed wrong. Detail and per-row effect:
[`evals/runs/2026-07-24-gate.md`](evals/runs/2026-07-24-gate.md#oracle-correction--read-this-before-the-numbers-above).

## Prior internal measurement — NOT reproducible from this repository

The two design decisions that shape this framework came out of an earlier run on a
**private** fixture set. The numbers are reported here because they are
load-bearing for the design, and are explicitly marked as unverifiable from this
repo: the fixtures were drawn from a closed codebase and are not published.

Anyone reading this should treat the section as *why the framework is built this
way*, not as evidence about any model's behaviour.

Run: 2026-07-18, provenance skill library, `claude-haiku-4-5`, n = 30/arm,
pre-registered, Fisher exact two-sided.

| Probe | Ground truth | Arm A (unaided) | Arm B (library) | p | OR |
|---|---|---|---|---|---|
| F1 keep-the-guard | keep + justify | 10/30 | 26/30 | 4.90×10⁻⁵ | 13.0 |
| F2 (transfer) | keep + justify | 0/30 | 1/30 | ≈1.0 | null |
| F3 **harm control** | remove a dead fence | **19/30** | **3/30** | 3.32×10⁻⁵ | 0.064 |

Both p-values recomputed with this repo's `harness/fisher.py` on 2026-07-24 and
they reproduce exactly (`fisher.py 26 4 10 20`, `fisher.py 3 27 19 11`). That
verifies the arithmetic only — not the trials that produced the counts.

Three findings from it drive this framework:

1. **The ceiling problem.** The same probes run against a mid-tier model gave
   10/10 = 10/10 on F1 and F2 — every failure the library existed to fix was
   already absent unaided. A frontier re-run of those probes would have produced a
   null that said nothing about the library. Hence `headroom-calibration` and the
   gate that runs before any spend.
2. **The harm mode is real and large.** On the matched control where the library's
   bias was wrong, it took the model from 19/30 correct to 3/30. Hence the
   mandatory matched harm control in `probe-design`, and `overcaution` shipping
   alongside `disclosure` here.
3. **n = 10 settles nothing.** The same effect read p ≈ 0.18 at n = 10/arm and
   p ≈ 4.9×10⁻⁵ at n = 30/arm. Hence the sample-size action table in
   `uplift-statistics` and the rule that pilots are directional in *both*
   directions.

A fourth, recorded separately: in one library-present condition, **0 of 20** trials
opened any skill unprompted. Adoption is not free, which is why arm B here is
soft-present and why adoption is reported as its own column.

### One discrepancy, disclosed

That run's prose summary describes F3 as the library making the model "worse by 16
points", which does not follow from its own table — 19/30 to 3/30 is 53 percentage
points. This repo quotes the table counts and the recomputed p-value, not the
derived sentence. The discrepancy is in the source document and is noted rather
than silently corrected.

## Environment pinned for the claims above

- `claude` CLI **2.1.206** — a CLI's built-in skills compete for invocation and
  change between releases, so a run without its CLI version is not comparable to
  any other run
- Node v24.16.0, Python 3.x (`fisher.py` is stdlib-only)
- Platform: Windows 11, `win32`
- Models named by exact id, never date-suffixed: `claude-opus-5`,
  `claude-sonnet-5`, `claude-haiku-4-5`

## How to disprove anything here

Every VERIFIED row above is a command in this repository that exits non-zero if the
claim is false. Run them. If a row's command passes and the claim still looks
wrong, that is a bug in the claim and worth an issue.
