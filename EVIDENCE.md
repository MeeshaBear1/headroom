# Evidence ledger

One rule: **a claim enters this file only with evidence a third party can
re-derive without trusting us.** Absence of evidence is UNVERIFIABLE, never a
pass. Unsubstantiated claims are listed PENDING and stay listed.

Last updated: 2026-07-27 (post-hoc token accounting added).

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
| 9 | Any **uplift** of Opus 5 or Sonnet 5 from any of the three *original* shipped probes | none. The gate voided all three at both tiers, so no contrast was run on them — per the pre-registered rule, not as a choice made afterwards | **NOT MEASURED** |
| 10 | `claude-sonnet-5` complies with a documented, non-obvious ordering convention 37% of the time unaided (11/30), and 100% of the time (30/30) with a purpose-built skill present — closing the entire gap to an unaided `claude-opus-5` ceiling (also 100%, 10/10) | pre-registered A/B/C contrast, n=30/arm (A,B), n=10 (C), 0 infra rows. Fisher exact A vs B: p = 5.34×10⁻⁸. Rows in `evals/runs/contrast-rule-drift-{sonnet5,opus5}/rows/`; record: [`evals/runs/2026-07-24-contrast-rule-drift.md`](evals/runs/2026-07-24-contrast-rule-drift.md) | **VERIFIED** |
| 11 | The same skill, applied to a matched fixture where the documented convention is inverted, produces no measurable change — evidence against a harm mode, not just absence of evidence for one | same contrast, `convention-override` A vs B: 30/30 both arms. Fisher exact p = 1.0 | **VERIFIED** |
| 12 | A version of `rule-consistency` with the fixture's domain name and quoted rationale removed still lifts `claude-sonnet-5` to 100% pass **whenever it is actually opened** (11/11 fired trials) — but generalizing the description cut adoption from 100% to 37% (11/30 fired), so the raw, adoption-confounded rate is a more modest 70% (21/30), and trials where the skill was never opened (19/30) show no measurable lift over the unaided baseline (10/19, p = 0.376 vs. arm A) | pre-registered retest, n=30 (arm B only, reusing frozen arm A), 0 infra rows. Raw B vs A: p = 0.019. Fired-subset vs not-fired-subset breakdown in the run record. Rows in `evals/runs/retest-deleak-sonnet5/rows/`; record: [`evals/runs/2026-07-26-retest-deleak.md`](evals/runs/2026-07-26-retest-deleak.md) | **VERIFIED** |
| 13 | A second, independent harm-control fixture for `rule-consistency` (`retry-discipline` — opposite valence from `convention-override`: the documented rule requires *less* defensive code, not more) shows no measurable harm across 70 real trials, and zero occurrences of the specific hypothesized failure mode (swallow-on-failure, retry-on-failure) in any trial, aided or unaided — but the test is underpowered: a pre-registered n=10 pilot showed 80% unaided pass (HAS-HEADROOM, licensing a full contrast), while the frozen n=30 arm A came in at 97%, leaving almost no room below ceiling to detect harm even if present | pre-registered pilot (n=10) then contrast (n=30/arm), 0 infra rows. Frozen arm A 29/30, arm B 30/30, skill fired 18/30. Fisher exact 30/0 vs 29/1: p = 1.0. Rows in `evals/runs/{pilot,contrast}-retry-discipline-sonnet5/rows/`; records: [`evals/prereg/2026-07-26-pilot-retry-discipline.md`](evals/prereg/2026-07-26-pilot-retry-discipline.md), [`evals/runs/2026-07-26-contrast-retry-discipline.md`](evals/runs/2026-07-26-contrast-retry-discipline.md) | **VERIFIED (underpowered null)** |
| 14 | On the one fixture where the skill changed outcomes (`rule-drift`), the skill arm was also ~7% cheaper per session ($0.222 vs $0.239 mean all-in cost) and **2.9× cheaper per correct result** ($0.22 vs $0.65) — while on a fixture the model already passed unaided (`retry-discipline`), the same skill added ~16% per-session cost ($0.284 vs $0.244) for no outcome change. Skills cost tokens to read; they pay for themselves only where the model has headroom | **post-hoc observational analysis, not pre-registered** — computed from the 240 existing Sonnet 5 trial transcripts by `harness/tokens.py` (sha256:`d0eb98dfe67aa76e`); no cost delta is claimed as statistically significant, and the cost-per-pass deltas inherit their strength from the pre-registered pass-rate deltas (claims 10, 13). Record: [`evals/runs/2026-07-27-token-accounting.md`](evals/runs/2026-07-27-token-accounting.md) | **OBSERVED (post-hoc)** |

Claim 9 stands as originally published: none of the three *original* probes had
headroom at either tier. Claims 10 and 11 are new. The skill they measure,
`rule-consistency`, is a **new skill authored in this repository** to close the
gap a fourth probe (`rule-drift`) found after the original gate voided
everything — it is not one of the fleet's pre-existing skill suites. Read
claims 10 and 11 as: *the framework can find real frontier-tier headroom and
validate a real, judgment-preserving uplift against a matched harm control.*
Do not read them as a claim about any library that predates this run. Full
detail, including two transcript quotes showing the same skill produce
opposite correct behavior on the two fixtures: the run record's
*What the skill actually did*.

Claim 12 answers a specific external-review question about claim 10: was the
37%→100% effect general judgement, or a hint that happened to name the
fixture's own domain and quote its rationale? The answer is split cleanly by
adoption — the content transfers perfectly (11/11) when read, but the
generalized description is opened far less often than the original's, which
named the task's exact domain. Both halves are load-bearing; neither alone
describes what happened. The same review also confirmed, by checking the row
data directly, that claim 10's `rule-drift` probe never actually observed the
"compounding" failure mode its spec hypothesizes — zero of 70 real trials were
partial failures — so that framing is an untested hypothesis, not a second
finding; see the correction added to
[`evals/runs/2026-07-24-contrast-rule-drift.md`](evals/runs/2026-07-24-contrast-rule-drift.md).
It also identified that `docs/CONVENTIONS.md`'s ban on editing `src/db.js` and
`src/audit.js` was undocumented in the oracle, not enforced by it — fixed by a
fixture-integrity guard, with all 130 of claims 10/11's original trials
regraded against it and zero classifications changed (disclosed in the
contrast pre-registration's deviation log). And it noted that `convention-override`'s
ground truth already equals `claude-sonnet-5`'s unaided default, so claim 11's
30/30-both-arms result cannot distinguish "no harm" from "no room to show
harm" — a real structural limitation of that harm control, stated plainly
rather than left implicit.

Claim 13 is a follow-on attempt to fix exactly that limitation with a
purpose-built second harm control (`retry-discipline`), avoiding
`convention-override`'s specific flaw by construction: a different
mechanism (error-propagation restraint, not audit ordering), the opposite
valence (the documented rule requires *less* defensive code, which a
generically cautious skill would be biased against), and a real,
headroom-showing n=10 pilot (80% unaided pass) before any contrast was
frozen. It still ended up underpowered, for a different and more mundane
reason: the frozen n=30 arm A came in at 97%, far above the pilot's 80% —
disclosed in full in the run record as a real pilot-vs-freeze gap, not
smoothed over. No harm appeared in 70 trials, and the specific hypothesized
failure mode (swallow-on-failure, retry-on-failure) appeared zero times in
either arm — real, if statistically underpowered, evidence against a hidden
defensiveness bias in `rule-consistency`. A well-powered downward harm
control for this skill remains an open task.

### The graders were wrong first, and it mattered

The first grading pass mis-scored **9 of 60 rows**, from two separate bugs in
transcript regex matching, both undercounting compliant answers as failures. One
made `disclosure` look like it had headroom at Sonnet 5 (5/10 instead of the true
rate); the other made Opus 5 look like it hedges results it had verified (7/10
instead of the true rate). Both were false. Corrections were made on arm-A pilot
data with no arm-B trial in existence — the one point at which `oracle-contract`
allows it — and both moved arm A **upward**, i.e. **away** from a claimable
finding, never toward one.

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
