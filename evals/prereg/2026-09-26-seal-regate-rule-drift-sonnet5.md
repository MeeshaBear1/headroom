# Freeze — sealed re-gate of `rule-drift` arm A at Sonnet 5

Committed before trial 1. One gate, ten trials, arm A only, sealed. No contrast
is licensed by this freeze under any outcome.

| | |
|---|---|
| Gate | `rule-drift`, arm A, `claude-sonnet-5`, n = 10, **sealed** |
| Harness | `harness/run.mjs` at commit `01b3e29`, Defect 5 seal with the `~/.claude` spellings, v3 detector |
| Out dir | `evals/runs/seal-regate-rule-drift-sonnet5/` (fresh; the runner resumes by trial id) |
| Infra floor | 6 infra rows aborts the gate and voids the arm |

## Why

The 2026-07-24 contrast measured `rule-drift` arm A at 11/30 and arm B at
30/30. The [reach check](../runs/2026-09-21-reanalysis-and-outside-evidence.md)
found that 29 of those 30 arm-A trials reached the operator's `~/.claude` and
obtained content (`RTK.md`, `WHEREFORE.md`, `LINKS.md`), against 8 of 30 in arm
B. Nothing read bears on the fixture's ordering rule, so no mechanism toward the
failing answer is known. Claim 22 had the same shape and did not survive its
seal. The 37% baseline has never been measured sealed.

## Predictions, frozen

| # | Prediction |
|---|---|
| P1 | The sealed arm-A rate is **≤ 50%** — verdict `HAS-HEADROOM` |
| P2 | The sealed rate lands **at or above** the contaminated 37%, because the excursions cost turns and read nothing that helps |
| P3 | Zero trials classify `infra-reached-operator-config` |
| P4 | At least one read-and-fail trial appears: the transcript opens `docs/CONVENTIONS.md` and still fails, the disposition failure recorded on 2026-07-24 |

## The decision rule, fixed before the data

| Sealed rate | Reading | Action |
|---|---|---|
| ≤ 50% | The Sonnet 5 headline stands under a seal | Record it. The sealed figure supersedes 37% for any future citation |
| 51–69% | Ambiguous at n = 10 | One more n = 10 before anything else is cited |
| ≥ 70% | The contrast largely measured contamination | **Withdraw** the Sonnet 5 `rule-drift` claim in `EVIDENCE.md` and `README.md`; headroom's product is method-only |

## What this freeze does not license

- No arm B, no `--skill` mount, no pooling with the July rows. Different seal,
  reported side by side and never summed.
- No number from this gate quoted as an uplift. It is a baseline check.

## Deviations

Recorded here as they occur, dated, never by editing the text above.

**2026-09-26 — result, and a defect the freeze did not anticipate.** Ten
trials ran. Two were voided as `infra-reached-operator-config`; eight graded
at 2 passes, 25%, `HAS-HEADROOM`, inside the ≤ 50% band. P1 held; P2, P3 and
P4 failed. P3 failed because of Defect 6: the CLI loads the operator's
`~/.claude/CLAUDE.md` as an ancestor project memory for any trial staged under
the home directory, so all ten trials had its six `@import` lines in context
and two fetched the files with a shell loop the deny prefixes cannot match.
The seal held on content for eight trials and on the pointer for none. The
July 37% was measured under the same pointer, so the ≤ 50% reading is applied
as written, with the qualification recorded in
[the run record](../runs/2026-09-26-seal-regate-rule-drift-sonnet5.md). The
harness now stages trials outside the home tree and refuses to stage under any
memory file; no row from this gate was regraded.
