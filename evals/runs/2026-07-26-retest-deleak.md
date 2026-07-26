# Run record — de-leaked skill retest (rule-drift / convention-override)

Pre-registration: [`evals/prereg/2026-07-26-retest-deleak.md`](../prereg/2026-07-26-retest-deleak.md)
(frozen before trial 1 of this phase, in its own commit).
Date run: 2026-07-26. Trials: 60 (arm B only, both probes). Actual spend: **$16.58**.
Infra rows: **0**.

## Verdict

**The effect survives de-leaking, but almost entirely as a routing story, not
a content story — and that split is itself the finding.**

| probe | arm | model | n | pass | rate | skill fired |
|---|---|---|---|---|---|---|
| `rule-drift` (original, reused) | A | `claude-sonnet-5` | 30 | 11 | 37% | — |
| `rule-drift-deleak` | B | `claude-sonnet-5` | 30 | 21 | 70% | 11/30 |
| `convention-override` (original, reused) | A | `claude-sonnet-5` | 30 | 30 | 100% | — |
| `convention-override-deleak` | B | `claude-sonnet-5` | 30 | 30 | 100% | 23/30 |

`rule-drift-deleak` B vs. reused A, raw: `python harness/fisher.py 21 9 11 19`
→ **p = 0.019**, odds ratio 4.0. Real, but nowhere near the original skill's
p = 5.34×10⁻⁸, and this raw number is confounded by adoption — see below.

## The number that actually answers the external review's question

Adoption collapsed. The original `rule-consistency` fired in 30/30 arm-B
trials; this de-leaked version fired in **11/30 (37%)**. Splitting the 30
trials by whether the skill was actually opened:

| subset | n | pass | rate |
|---|---|---|---|
| skill fired | 11 | 11 | **100%** |
| skill not fired | 19 | 10 | 53% |

**When the de-leaked skill is opened, it produces exactly the effect the
original skill produced — 100%, the same number, on independent trials.**
`python harness/fisher.py 10 9 11 19` (not-fired subset vs. the reused arm A)
→ p = 0.376 — indistinguishable from the unaided baseline. There is no
detectable effect from the skill merely sitting on disk unread; the entire
lift comes from the trials where it was actually consulted, and in every one
of those it worked.

This means the external review's central question — *is this a general
disposition or a domain-matched hint dressed as one* — has a clean answer on
the **content** axis: it is not a hint that only works because it names the
fixture. The revised text, with the quoted rationale sentence, the literal
"force the failure" phrase, and the frontmatter's explicit domain name all
removed, still lifts a reader from the 37% baseline to 100%, matching the
original skill's conditional effect exactly.

What did not survive is **discoverability**. Generalizing the frontmatter's
domain list from `audit logging, ordering` to `call ordering, retry and
idempotency behavior, error handling, naming` cut the chance Sonnet 5 opens
the skill for a task that says *"add audit logging"* from 100% to 37%. That
is a real, separate cost, not a rounding error — see `uplift-eval-core`'s
routing-vs-uplift split, which exists for exactly this case: a skill that
fires reliably and changes nothing is a routing success and a content
failure; the mirror case observed here is a skill whose content works
perfectly and whose routing failed most of the time. Both halves are
publishable, and neither one alone describes what happened.

## What the transcripts show

Fired and passed (`rule-drift-deleak-B-004`):

> "I added `audit(actor, action, target)` as the first statement in each of
> the 6 `src/ops/*.js` functions... so the call happens before the mutation
> runs and the audit trail captures attempted operations even if the
> mutation throws... per `docs/CONVENTIONS.md`, and no shared helper/wrapper
> was introduced."

Not fired and failed (`rule-drift-deleak-B-001`):

> "All six files in `src/ops/` now call `audit()` right after their mutation
> succeeds, so a failed mutation... throws before any log entry is
> written."

The failing trial reasons from the same generic "log on confirmed success"
instinct the original arm A transcripts showed, with no reference to
`docs/CONVENTIONS.md` — the model never opened the skill and never looked at
the doc it would have pointed to.

## The harm control retest

`convention-override-deleak` stayed at 30/30, same as its reused arm A,
consistent with the pre-registration's stated limitation: this fixture's
ground truth already equals `claude-sonnet-5`'s unaided default, so 30/30 in
both arms is exactly what "no room to show harm" predicts, not evidence the
skill is harmless under pressure. Adoption here was higher (23/30, 77%) than
on the primary probe — plausibly because "log only after success" reads as
the less surprising instruction to follow through on once read, though with
n=30 and no variation in outcome either way this is not a claim, just a
noted asymmetry.

## Relationship to the original contrast

This does not change the original result. `probes/rule-drift` and
`probes/convention-override` are untouched; their frozen
`rule-consistency` (sha256:`07550bba3d88fdfb`) is exactly what produced the
2026-07-24 contrast's 37%→100% (p = 5.34×10⁻⁸), and that number still means
what it meant. What this phase adds is a decomposition: **that original
100% was real content plus near-total adoption. The content half
replicates independently on a differently-worded skill; the adoption half
was inflated by the frontmatter naming the fixture's exact domain**, which
this repository did not previously have the data to separate.

## What this does and does not show

**Shows:** the general judgement in `rule-consistency` — read the rationale,
verify the protected scenario, apply per-instance, resist instinct over
documented convention — transfers to a rewording that no longer names the
fixture's domain or quotes its rationale, with a perfect conditional effect
(11/11) on independent trials. Also shows that a skill's discoverability and
its content are separable failure/success modes that can point in opposite
directions in the same experiment.

**Does not show:** that 37% adoption is "enough" in any practical sense — a
skill three trials in ten actually reads is a real deployment problem even
with perfect content, and this repository is not claiming otherwise. Does
not show anything new about the harm control beyond confirming its known
structural limitation. One retest, one model, one fixture pair, n=30/arm on
the new probes.

## Environment

`claude` CLI 2.1.206 · Node v24.16.0 · Windows 11 win32 · `acceptEdits` ·
allowed tools `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` · max turns 80 ·
timeout 900 s · concurrency 6 · throwaway `CLAUDE_CONFIG_DIR` per trial ·
model `claude-sonnet-5` · runner sha256:`bdaf65b12c4cbc1d` · oracle hashes as
frozen in the retest pre-registration.

## Deviations from the pre-registration

None. The arm-B rates and the fired/not-fired split were computed exactly as
specified; the fired/not-fired decomposition was pre-specified as the
mechanism to check ("Also report, always: Adoption" — `uplift-statistics`)
even though it was not named as the primary metric in the freeze. The
primary metric (raw arm B vs. reused arm A, p = 0.019) is reported first and
in full, per the freeze, before the decomposition that explains it.
