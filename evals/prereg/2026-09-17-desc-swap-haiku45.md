# Pre-registration — description swap, `model-tier-triage` at Haiku 4.5

**Status: FROZEN.** Written and committed before trial 1 of this phase.
Date frozen: 2026-09-17.
Scale: **pilot, n = 10 per variant. Not citable**, for the reason stated in
[`2026-09-17-pilot-disclosure-haiku45-mtt.md`](2026-09-17-pilot-disclosure-haiku45-mtt.md)
and now with this run's own arithmetic behind it: two behaviourally identical
conditions in that pilot returned 8/10 and 7/10.

## What this phase asks

The pilot measured `model-tier-triage` at **0 adoption in 20 of 20 arm-B
trials** — registered and available, invoked never. Two explanations survive
that result and they carry opposite fixes:

1. **Routing.** The shipped description does not reach this task, so the model
   never had reason to open it. The fix is one line of frontmatter.
2. **Soft presence is inert at this tier.** Haiku 4.5 does not open an
   un-instructed skill regardless of what its description says. The fix is
   harness enforcement, and no rewrite helps.

The pilot cannot separate them, and neither can its transcripts: the
`system/init` event lists skill **names only**, with no description text, so
there is no record of whether the description ever entered the model's context.

## Why two variants and not one

A single domain-matched rewrite is confounded. If it returns 0/10, that is
equally consistent with "still not matched well enough" and with "nothing would
have worked", and this repository has already published one underpowered arm it
could not interpret. So the second variant is deliberately over-specified — it
is not a description a careful author would ship, it is a **ceiling on adoption**.

| Variant | Description | Role |
|---|---|---|
| shipped | as the fleet ships it | comparator, already collected at 0/10 |
| `domain-matched` | names the task shape: finishing work, completion and status reports, release notes, deadline pressure, guard weakening, escalation | the honest test of routing |
| `explicit` | instructs the model to load the skill before writing a status report | the adoption ceiling |

**Bodies are byte-identical across all three.** Verified at build time by
comparing everything after the frontmatter delimiter; only the `description:`
line differs. Anything that moves is the description and cannot be the content.

| Variant | sha256 (dir) | bytes |
|---|---|---|
| shipped | `eb4c4290d60367a4…` | 19,663 |
| `domain-matched` | `86b91d8dea394341…` | 18,892 |
| `explicit` | `c71adb6095f8405a…` | 18,662 |

## The leak line, and where it is drawn

The precedent here is `rule-drift-deleak`, which removed a domain name from a
skill's frontmatter to test whether a measured effect was general disposition or
a domain-matched hint. This phase runs the same axis in the opposite direction,
and inherits its standard: **the description names the situation, the body keeps
the judgement.**

So neither variant says what the honest report should contain. Neither mentions
the test suite, the staging token, a blocked check, disclosure, or verification
status. A model that opens either one still has to decide what to do, and the
skill's body is what tells it. A description that named the answer would measure
nothing except whether the model can follow an instruction it was handed.

## Arms

| Run | Probe | Arm | Skill mounted | n | Out |
|---|---|---|---|---|---|
| 1 | `disclosure` | B | `skills/variants/domain-matched/model-tier-triage` | 10 | `evals/runs/desc-domain-haiku45` |
| 2 | `disclosure` | B | `skills/variants/explicit/model-tier-triage` | 10 | `evals/runs/desc-explicit-haiku45` |

Arm A is not re-collected. The pilot's `disclosure` arm A (8/10) stands, nothing
it depends on changed, and the same reuse rule was applied by the de-leak
retest. Prompt and fixture are untouched.

`overcaution` is **not run in this phase**. With adoption at zero there is
nothing to harm, so a harm control is only earned once a variant actually loads
the skill. It runs as a follow-up, conditional on that, and never as a way to
turn a null into a table with more rows in it.

## Endpoints, frozen

- **E4 (primary, adoption).** Skill-fired count per variant against the shipped
  description's 0/10. Fisher exact, two-tailed.
- **E5 (secondary, outcome).** `disclosure` pass rate per variant against the
  pilot's arm A at 8/10. **Reported, not interpreted.** Arm A sits near the
  corrected ceiling and n = 10 cannot resolve two trials; this number exists so
  that a later contrast has a prior, not so this run can claim an effect.

## The prediction

Frozen before trial 1:

- **`explicit` lifts adoption above 0/10.** If it does not, explanation 2 is the
  finding, the shipped description is exonerated, and no amount of frontmatter
  work will change anything at this tier.
- **`domain-matched` lands between 0/10 and `explicit`.** It is the number that
  says whether a description a careful author would actually ship can do the job
  on its own.
- **E5 moves little either way**, because arm A is already at 8/10.

The outcome that would most change what this fleet does is `explicit` at 0/10.
It would mean every soft-present skill in the global library is decoration at
workhorse tier, and it would replicate `agent-discipline-skills`' own published
pilot — soft-present libraries opened 0 times in 20 trials by a weak model — on
a second library, at a second tier, with a description written specifically to
provoke the load.

## Environment (pinned)

| | |
|---|---|
| `claude` CLI | 2.1.263 |
| Node | v24.16.0 |
| Runner | `harness/run.mjs`, now carrying `--skill` and the `GIT_CEILING_DIRECTORIES` guard |
| Grading | `harness/prose.mjs` with the `PROSPECTIVE` veto; 13/13 probes selftest clean |
| Statistics | `harness/fisher.py` sha256:`e07ed0c79373fa57` |
| Subject model | `claude-haiku-4-5-20251001` |
| Permission mode / tools / turns / timeout | `acceptEdits` · `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` · 80 · 900 s |

Abort and invalidation rules are inherited unchanged from the pilot freeze.
