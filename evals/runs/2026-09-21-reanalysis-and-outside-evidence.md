# Reanalysis of the sealed re-gate, and what the outside evidence says

**No trials. No API spend.** Two questions, answered from the repository's own
rows and from a sweep of published evidence dated 2026-09-21.

1. Does the 2026-09-20 withdrawal of claim 22 survive a second reading?
2. Has anyone else shown that a skill, rules file or agent library improves a
   frontier model — and by what standard?

## Part 1 — the withdrawal, re-read

### It stands on two grounds, and they are separable

The [run record](2026-09-20-gates-seal-recheck-and-nullcensus.md) ran the two
grounds together. Read apart, each is sufficient and one is stronger than the
decision rule that was actually applied.

**Ground A — the seal.** Sealed arm A passed 10/10. The frozen band was on the
observed rate, and 100% sits inside ≥ 70%. The exact 95% interval on 10/10 has a
lower bound of **69.2%** (Clopper–Pearson, `0.025^(1/10)`), so the data refute
the 26.7% baseline claim 22 rested on and are consistent with a true sealed rate
anywhere from 69% to 100%. What Ground A does *not* establish is that no effect
exists at all: a sealed contrast at n = 30 could still find a residual lift from
a 70–90% baseline. It only establishes that the 8/30 → 30/30 figure measured
something other than the library.

**Ground B — the oracle grades a rule the house rejects.** This is the one that
makes any sealed contrast on this probe pointless, and the record understated it.
`probes/motion-undocumented/oracle.mjs` says so in its own comment:

> the negative engine must show a reveal HAPPENING: concealed before it is
> scrolled to, visible after. Both halves, or it is not a reveal.

`slipway:motion` §1 says the opposite, as a rule: *"Base state must be fully
legible — never `opacity: 0` here"*, and §"Reduced motion": *"Nothing depends on
animation to become visible."* A page built exactly to house style — legible at
rest in every engine, reveal layered on under `@supports` — is classed
`fail-chromium-only-reveal` by construction, because Firefox never conceals.

The 2026-09-18 arm A shows this in its failure classes, with no reference to who
read what:

| arm A (n = 30), 2026-09-18 unsealed | trials |
|---|---|
| `pass` | 8 |
| `fail-chromium-only-reveal` — legible base, reveal only where the API exists | **17** |
| `fail-no-reveal` | 5 |

Seventeen of twenty-two failures are the house's own pattern. So a positive
sealed contrast would measure whether a mounted skill makes the model prefer
`everyone-path`'s pattern over the house's — true by construction, and not a
fleet improvement. **Ground B retires the probe; Ground A only retired the
number.** Cancelling the $145 re-run was right for a reason stronger than the
band.

### The seal is not a neutral intervention

Every sealed trial went looking and was refused (27 of 29 attempts). The
population that a seal measures is therefore *hunting trials, forcibly kept
inside* — not the same population as the 10 unsealed trials that never hunted.

| arm A subset | pass | n |
|---|---|---|
| unsealed, never left the fixture (2026-09-18) | 5 | 10 |
| sealed, tried and was refused (2026-09-20) | 10 | 10 |

`python harness/fisher.py 10 0 5 5` → **p = 0.033**, post-hoc. Two readings and
n = 10 cannot separate them: trials that go hunting are the more thorough ones,
or a visible refusal changes what the model does next. Under either reading the
withdrawal holds, because the contrast's arm A contained twenty contaminated
trials whichever way the other ten are read. For future sealed runs it argues
for a sandbox with an empty home over a deny rule, so the model is never shown a
refusal to react to. Not built; recorded as the upgrade path.

### Where prediction P1 went wrong

P1 said the sealed rate would stay at or below 50%, on the strength of the
"uncontaminated" 5/10. That subset was the non-hunting population, not a clean
arm. **A subset of a contaminated arm is not a sealed arm**, and it was read as
one. The rule now written into the seal doctrine: a contamination split inside a
run licenses a caution, never a baseline.

### "Two fleet skills, two voids" is a prior, not a finding

n = 2 skills. The instruction that followed — stop building frontier probes for
installed skills — is too broad, and Part 2 says why: outside this repository,
curated skills *do* lift frontier models, on tasks that need procedural
knowledge the model does not have. Both fleet skills gated here restate
conventions Opus 5 already holds. The corrected doctrine is narrower: **at the
frontier, headroom is a knowledge gap, not a convention gap.** It agrees with
this repository's own Fable 5 result on `log-redaction` and with the Vercel
result below.

## Part 2 — has anyone else proven uplift?

Swept 2026-09-21. Every number is from the source linked, most from abstracts
and vendor posts; the limits are listed at the end.

### Harness and scaffold — proven, and large

| source | what moved | by how much |
|---|---|---|
| [Anthropic, Oct 2024](https://www.anthropic.com/news/swe-bench-sonnet) | SWE-bench Verified, Claude 3.5 Sonnet, new scaffold | **33% → 49%**. *"The performance of an agent on SWE-bench can vary significantly based on this scaffolding, even when using the same underlying AI model."* |
| [Voyager, 2023](https://arxiv.org/abs/2305.16291) | Minecraft, GPT-4 with an executable skill library | 3.3× unique items, 15.3× faster to the first tech-tree milestone; ablating the library made zero-shot transfer impossible and the agent plateaued |

This is the strongest category and it is not about skill *files*. The lift comes
from the loop the model runs in and from a library of *executable, verified*
routines the model built for itself against environment feedback.

### Curated domain skills on knowledge-gap tasks — proven, in one benchmark

[SkillsBench](https://arxiv.org/abs/2602.12670) (Feb 2026, 43 authors, 84 tasks
across 11 domains — clinical data harmonisation, manufacturing constraints,
cybersecurity, energy):

| configuration | no skills | with curated skills | gain |
|---|---|---|---|
| Claude Code + Opus 4.5 | 22.0% | 45.3% | **+23.3 pp** |
| Gemini CLI + Gemini 3 Flash | 31.3% | 48.7% | +17.4 pp |
| Codex + GPT-5.2 | 30.6% | 44.7% | +14.1 pp |
| mean of 7 configurations | 24.3% | 40.6% | **+16.2 pp** |

Two findings matter more than the headline. **Self-generated skills averaged
−1.3 pp** against no skills at all (GPT-5.2: −5.6 pp) — *"effective Skills
require human-curated domain expertise that models cannot reliably
self-generate."* And the public ecosystem of 47,150 skills scores **6.2 / 12**
on their quality rubric against **10.1 / 12** for the benchmark's own, so the
+16 pp is an optimistic ceiling. Codex *"frequently acknowledges Skills content
but proceeds without invoking them."*

### Repository context files on correctness — null, at a cost

| source | design | result |
|---|---|---|
| [Gloaguen et al., ETH, Feb 2026](https://arxiv.org/abs/2602.11988) | SWE-bench with LLM-written context files, plus new issues from repos with developer-committed ones; several LLMs and agents | *"providing context files does not generally improve task success rates, while increasing inference cost by over 20% on average."* Instructions were followed; overviews did not help |
| [Khatri, Jul 2026](https://arxiv.org/abs/2607.27250) | Claude Code and Codex, 17 real tasks, 3 repos, 288 runs, gold tests, equivalence testing | correctness *"bounded to ≤ 10–15 pp"*; *"the real AGENTS.md never converts a near-miss to a pass on either agent"* |
| [McMillan, May 2026](https://arxiv.org/abs/2605.10039) | 1,650 Claude Code sessions, 16,050 function-level observations, Sonnet 4.6 / Opus 4.6, four structural variables (size, position, architecture, contradictions) | none of the four detectable after correction; size and conflict nulls carry Bayes factors 0.05–0.10. Largest effect is **within-session decay: ~5.6% lower odds of compliance per additional function** (OR 0.944) |
| [Lulla et al., ICSE JAWs, Jan 2026](https://arxiv.org/abs/2601.20404) | 10 repos, 124 pull requests, with and without `AGENTS.md` | efficiency only: median runtime **−28.6%** (98.6 s → 70.3 s), output tokens −16.6%, *"comparable task completion"* |
| [Jiang & Nam, MSR '26](https://arxiv.org/abs/2512.18925) | 401 repositories with Cursor rules | a taxonomy of what rules contain; no behavioural effect measured |

Four independent groups, three of them with real-repository tasks, and none
finds a correctness effect from the file every vendor tells developers to
write. One finds it makes the agent faster and cheaper. That is consistent with
this repository's `VOID-FOR-TIER` census and with its token-accounting result
that a skill the model did not need cost ~16% per session for nothing.

### Version-gap documentation — a large effect, thinly reported

[Vercel, Jan 2026](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals),
Next.js 16 API tasks — knowledge that post-dates every model's training:

| configuration | pass |
|---|---|
| baseline, no docs | 53% |
| skill, default behaviour | 53% — **never invoked in 56% of cases** |
| skill, with an explicit "use it" instruction | 79% |
| 8 KB compressed docs index in `AGENTS.md` | **100%** |

No model named, no task count, and the authors call the skill route *"brittle
for production use"* because *"small wording tweaks produce large behavioral
swings."* It is the cleanest outside example of the adoption failure this
repository measured twice: 100% → 37% fired when the description lost its domain
match, and 0 of 40 at Haiku 4.5 under three descriptions.

### Self-evolving memory and playbooks — measured, and not libraries

| source | result |
|---|---|
| [Agent Workflow Memory, ICML 2025](https://arxiv.org/abs/2409.07429) | +24.6% and +51.1% relative success on Mind2Web and WebArena, fewer steps |
| [Dynamic Cheatsheet, EACL 2026](https://arxiv.org/abs/2504.07952) | Claude 3.5 Sonnet's AIME accuracy more than doubled; GPT-4o on Game of 24 from 10% to 99% after it stored a Python solution |
| [Agentic Context Engineering, Oct 2025](https://arxiv.org/abs/2510.04618) | +10.6% on agent benchmarks, +8.6% finance, up to +17.1% on AppWorld, from execution feedback with no labels |

These are the closest cousins of the one pattern that has produced uplift inside
this repository: a context written *against a measured failure*, on the task it
failed, and verified by feedback. `rule-consistency` and `everyone-path` were
authored that way. None of these is a general-purpose library installed in
advance.

### The bar for "proven" — human productivity

[METR, Jul 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/):
16 experienced developers, 246 tasks in their own repositories, randomised —
**19% slower** with AI (CI +2% to +39% slower) while estimating themselves 20%
faster. [METR, Feb 2026](https://metr.org/blog/2026-02-24-uplift-update/): 57
developers, 143 repos, 800+ tasks — original cohort **−18%** (CI −38% to +9%),
new recruits **−4%** (CI −15% to +9%), with 30–50% of developers declining tasks
they could not use AI on, which biases the estimate downward by an unknown
amount. METR is changing the design. The tool-level number the whole industry
sells against remains, as of this sweep, not significantly different from zero.

### Policy documents at the frontier

[τ-bench](https://github.com/sierra-research/tau-bench): following a written
domain policy while using tools is unsolved at the frontier — the frozen
leaderboard tops out at 69.2% retail / 46.0% airline pass^1 (Claude 3.5 Sonnet),
and consistency is worse (gpt-4o pass^8 below 25% on retail). House rules are
policy documents. The gap is real; the question is only whether a *skill* is the
instrument that closes it.

### The vendor's own instrument

[Anthropic's skill-creator update, Mar 2026](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
ships evals, benchmarks and blind A/B *"comparator agents"* that *"judge outputs
without knowing which is which."* The one published number is description tuning
improving triggering on 5 of 6 skills. No pass-rate deltas are given, and the
grader is a model — the design this repository rules out of every pass/fail path.

## What is proven, by the standard this repository holds

The standard: pre-registered, sealed from outside guidance, matched harm control,
no model in the oracle. Nothing in the sweep meets all four. Against a looser
standard — controlled, replicated, real tasks — the ledger reads:

| claim | verdict | evidence |
|---|---|---|
| A better harness lifts the same frontier model | **proven** | Anthropic 33 → 49%; Voyager ablation |
| A curated skill lifts a frontier model on tasks needing knowledge it lacks | **proven once**, no harm control | SkillsBench +16.2 pp mean, +23.3 pp Claude Code |
| A repo context file lifts correctness | **null**, four groups | Gloaguen; Khatri; McMillan; Lulla (efficiency only) |
| A model-written skill lifts anything | **null to harmful** | SkillsBench −1.3 pp mean, −5.6 pp GPT-5.2 |
| A skill is used because it is present | **false** | Vercel 56% never invoked; Codex acknowledges and skips; this repo 0/40 at Haiku |
| AI tooling speeds experienced developers on their own code | **not shown** | METR −19%, then −18% / −4% with wide intervals |
| A library can make a model worse | shown here, and in SkillsBench's self-generated arm | `3/30` on the matched control; −5.6 pp |

Two things the outside record does not contain at all: a matched harm control
on a skill that helped, and a sealed baseline. This repository's methods are
ahead of the field on both, and its *results* are behind it on the one thing
that matters commercially — a measured, replicated lift at Opus or Sonnet.

## What it changes for the fleet

1. **Retarget the probes.** The two fleet skills gated here restate conventions
   the model holds. SkillsBench and Vercel found lift where the model lacked the
   knowledge — clinical procedures, a post-cutoff API. The fleet's equivalent is
   its own instruments: `gangway`, `beam`, `articles`, ShipSafe, `census.mjs`,
   their flags and exit codes. No model has that in pretraining. A probe whose
   task needs a house instrument run correctly is a knowledge-gap probe, and it
   is the first one here with an outside precedent for `HAS-HEADROOM` at the
   frontier.
2. **Adoption is the product, not a detail.** Three independent measurements
   (Vercel, SkillsBench, this repo) show presence ≠ use, and the one intervention
   that moved it — an explicit instruction, or a domain-matched description —
   moved it a lot. Item 4 (routing for Fable and above) has outside support.
3. **Enforcement below Fable, and possibly above it.** McMillan's 5.6%
   per-function compliance decay is a mechanism for prose rules failing on long
   builds even when the model read them. Item 5 (hooks and gates with exit codes,
   not doctrine) has outside support and is already how the fleet's site work is
   held.
4. **Sandbox, not deny rules.** The seal works; it also shows the model 27
   refusals. An empty home in a container measures the same thing without the
   intervention.
5. **Stop citing the field's numbers as if they were ours.** SkillsBench's
   +23.3 pp is Opus 4.5 on medical and manufacturing tasks with human-curated
   skills scoring 10/12. It says nothing about a 60-skill convention library at
   Opus 5. The fleet's claim, today, is a method — the gate, the seal, the harm
   control, the withdrawn-claims ledger — not a lift.

## Limits

- One session's web sweep. Abstracts and vendor posts were read; the bodies of
  McMillan and Jiang & Nam were not, and Raschka's synthesis was paywalled.
- Vercel reports no model and no n. SkillsBench is a single benchmark from the
  group that built it, with no harm control and no sealed baseline.
- The Fisher test in Part 1 is post-hoc at n = 10 per cell; it motivates a
  design change, not a claim.
- No number here is this repository's. Every fleet-facing statement above is a
  hypothesis for a freeze, not a result.

## Re-verification

```
sed -n '96,110p' /c/Users/nileh/github/headroom/probes/motion-undocumented/oracle.mjs     # "Both halves, or it is not a reveal"
sed -n '42p;114p' /c/Users/nileh/github/slipway-marketplace/plugins/slipway/skills/motion/SKILL.md  # never opacity:0; nothing depends on animation
python /c/Users/nileh/github/headroom/harness/fisher.py 10 0 5 5                         # p = 0.033, sealed-hunters vs unsealed-stayers
python -c "print(0.025**0.1)"                                                            # 0.692, exact lower bound on 10/10
```
