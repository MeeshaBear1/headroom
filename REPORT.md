# headroom — findings report

*A plain-language and technical account of what this repository's skill suite
is, what it has actually proven, and where the evidence lives. Written for two
readers: someone who has never run an eval, and someone who's about to grade
one.*

Every number below traces to a command in [EVIDENCE.md](EVIDENCE.md) or a run
record under [`evals/runs/`](evals/runs/) that a stranger can re-run and get
the same answer. Nothing here is asserted on our word alone — that rule is the
whole point of the project.

---

## Executive summary

`headroom` is a method, packaged as six Claude Code skills, for answering one
question honestly: **does this coding-agent skill library actually change
model behaviour, or does it just feel like it should?** Most skill libraries
and prompt packs never get measured. The rare ones that do get measured wrong
— against a model too weak to show whether the library was the reason, with
graders never checked against a wrong answer, with no matched control for the
case where the library's advice is bad advice.

We built the method, then used it on ourselves. The gate voided our own first
three probes against Opus 5 and Sonnet 5 — both models already did, unaided,
everything the probes existed to check, in 60 of 60 trials, for $12.46. Rather
than call that a wash, we went looking for real headroom, found it, built the
matched harm control the method requires before any claim is allowed, and ran
the full contrast: **Sonnet 5 followed a documented, non-obvious ordering rule
37% of the time unaided, and 100% of the time with a purpose-built skill
present — closing the entire gap to an unaided Opus 5 ceiling, at
p = 5.34×10⁻⁸ — with zero measurable change on a matched fixture where that
same rule is inverted (p = 1.0).**

That is one honestly-earned uplift claim, with its cost (the harm control)
published in the same table. The six methodology skills are what made it
possible to trust the number instead of just wanting to.

An external review then checked that claim the same way it checks anything
else: line by line, against the actual data. It found a real gap (an
unenforced fixture-integrity assumption, now fixed) and a fair question (did
the skill just quote the answer?). We reran the experiment with the wording
that made that question askable removed. **The effect's content held exactly
— 100%, unchanged — every time the revised skill was actually opened; what
dropped was how often Sonnet 5 opened it at all.** See *An external review,
and what it changed* below.

We then built a second, independent harm control specifically to close a gap
the review had flagged in the first one — a different mechanism, the
opposite valence, and a real pilot showing genuine headroom before any
contrast was frozen. It still came back underpowered, for an honest reason
disclosed in full rather than hidden: the frozen sample landed much closer
to ceiling than the pilot predicted. No harm appeared in 70 trials. See
*A second harm-control attempt* below.

---

## Part 1 — For neophytes: what this is and why it's hard

### The problem in one analogy

Imagine someone hands a very good student a cheat sheet and says "this will
help." The student gets a better grade. Did the cheat sheet help — or was the
student already going to get that grade, cheat sheet or not? You can't tell
from one before-and-after test on one student. You need: a student who takes
the test *without* the sheet, the same student *with* it, and — ideally — an
even stronger student without it, so you know what "as good as it gets" looks
like. And you need a *second* test, one where the cheat sheet's advice is
wrong, to make sure it isn't just making the student blindly follow the sheet
even when the sheet is bad.

That's the whole method. The "student" is an AI model (Claude Sonnet 5, or
whichever model is being evaluated). The "cheat sheet" is a skill — a written
piece of guidance dropped into the model's available tools. The "test" is a
small coding task with one exactly-correct answer. Doing this rigorously,
instead of by feel, is what the six skills in this repository automate.

### Why "it seemed to help" is not evidence

Almost every skill library and prompt-engineering pack on the internet is sold
on a demo: someone tried it, the output looked better, they shipped it. That
tells you almost nothing, for two reasons this project measured directly:

- **The model might not have needed the help.** In our own first attempt,
  three probes we'd built to demonstrate a library's value turned out to be
  things Opus 5 and Sonnet 5 already did correctly 100% of the time with no
  help at all. If you ran the "before/after" test on those three probes
  against a frontier model, you'd see no change — not because the library
  doesn't work, but because there was nothing to fix. Skipping the "does this
  model even need help" check first is the single most common way a real
  effect gets misreported as "no effect," or an effect measured on a weak
  model gets misreported as universal.
- **The help might be quietly making things worse elsewhere.** A separate,
  earlier measurement (see EVIDENCE.md's "prior internal measurement" section)
  found a library that took a model from 10/30 correct to 26/30 correct on its
  target task — a real win — while taking the *same model* from 19/30 correct
  to 3/30 correct on a matched task where the library's advice happened to be
  wrong for that case. Reporting only the win would have been a lie by
  omission.

### What we actually found, in plain terms

We wrote a small coding task: "add logging to these six functions." Buried
one file away — the way a real repo's conventions actually work — was a
written rule that the logging has to happen *before* the risky operation, not
after, specifically so the log survives if the operation fails partway.
Claude Sonnet 5, working alone, read the code and wrote logging that looked
completely reasonable — and put it in the wrong place, ignoring the documented
rule, about six times out of ten. It wasn't that the model couldn't find the
rule. It read it. It just trusted its own generic instinct over what the repo
actually said.

A short written skill — five paragraphs, no magic, just "read the reason the
rule exists, then check your work against the specific situation the rule is
protecting, for every instance, not just the first one" — fixed this
completely, every single time, in a controlled test of 30 separate attempts.
And critically: when we flipped the task so the documented rule was the
*opposite* rule, the same skill didn't break anything — the model (correctly)
followed the new rule instead of blindly repeating the old habit. That's the
difference between a skill that teaches a fact and one that teaches a
judgment — and only the second kind survives being tested on a case it wasn't
written for.

### Why this matters if you're not an engineer

If you use any AI coding assistant with "custom instructions," a "skills"
folder, or a prompt pack someone sold you as a productivity multiplier: almost
none of those have been tested this way. Most are tested the way the cheat
sheet was tested in the analogy above — once, on whichever model happened to
be around, with nobody checking whether the model needed the help or whether
the advice back-fires elsewhere. This repository is a working example of what
it looks like to actually check.

---

## Part 2 — For engineers: the method and the six skills

### The core insight

An uplift claim about a skill library is a two-by-two experiment
(model-with-library × model-without-library, compared against a
stronger-model-without-library ceiling) with a graded outcome, and almost
nobody runs it as one. `headroom` is that experiment, formalized into a
protocol tight enough that a third party can catch you cheating at any step —
which is also what stops you from cheating yourself.

Everything is expressed as six independent Claude Code skills
(`skills/*/SKILL.md`), each owning one failure mode with zero content overlap,
plus a harness (`harness/run.mjs`) and a stats helper (`harness/fisher.py`)
that implement them mechanically.

### The six methodology skills

| Skill | Forces you to | The specific mistake it stops |
|---|---|---|
| [`uplift-eval-core`](skills/uplift-eval-core/SKILL.md) | Define arms A (unaided) / B (library soft-present) / C (stronger ceiling, unaided); freeze a pre-registration before trial 1; publish UPLIFT, NO EFFECT, or INCONCLUSIVE — all three, always | Presenting a routing success ("the skill gets invoked") as an uplift result, or quietly shelving a null |
| [`headroom-calibration`](skills/headroom-calibration/SKILL.md) | Run a cheap, small-n, arm-A-only gate before paying for B and C; verdict is `VOID-FOR-TIER`, `HAS-HEADROOM`, or `FLOOR-SUSPECT` | Spending on ~400 contrast trials to discover the frontier model already aced the task unaided — this is the check that saved $12.46 vs. the ~$400+ this repo's own first attempt would otherwise have spent on a guaranteed null |
| [`probe-design`](skills/probe-design/SKILL.md) | Target a real knowledge/discipline/house-fact gap; write a fairness contract (the rule is stated verbatim, discoverable, never named in the prompt); build a discriminator two cases can't pass by luck; build a matched harm control for every probe | Building a task the model would pass from general competence alone, which measures the model, not the library |
| [`oracle-contract`](skills/oracle-contract/SKILL.md) | Grade every trial with a deterministic script; prove it FAILS on the untouched fixture and PASSES on the known-correct fix, before trial 1; ship counterfactual test cases for the specific wrong answers | Trusting a grader that has never been shown a wrong answer — this exact failure hit us twice (see below) and both times the fix moved the number *down* |
| [`trial-harness-ops`](skills/trial-harness-ops/SKILL.md) | Run every trial in a fresh session with a throwaway agent-config directory, scrub secret-shaped environment variables, classify infra failures separately from behavioral ones, verify session isolation with a leak probe | A global instruction file, memory plugin, or hook silently leaking into every arm and contaminating the whole comparison |
| [`uplift-statistics`](skills/uplift-statistics/SKILL.md) | Use two-sided Fisher exact on 2×2 pass/fail counts; treat n=10 pilots as directional only; scale the one pre-registered primary probe to n≈30/arm; report the full table including nulls | Reading a pilot's p≈0.18 as a finding — the same real effect in this repo's own data read p≈0.18 at n=10 and p≈5×10⁻⁵ at n=30 |

Each skill's own frontmatter states what it is *not* for and points to its
siblings — there is no ambiguity about which skill owns a given judgment call,
which matters because a skill suite that overlaps its own guidance is exactly
the kind of unmeasured claim this project exists to avoid making.

### The one skill actually under test

[`rule-consistency`](probes/rule-drift/skill/rule-consistency/SKILL.md) is
different in kind from the six above: it is not methodology, it is the
*subject* of this repository's one uplift measurement. It is a short,
generalizable skill — "read the rule's rationale, verify against the specific
case it protects, apply it per-instance, don't let a generic instinct
override a documented decision" — authored specifically to close the gap the
`rule-drift` probe found. It is usable in any project's `.claude/skills/`
independent of this framework, and it is the only line item in this repo with
a validated, non-null effect behind it. It is **not** one of "the fleet's"
pre-existing skill libraries; treat it as a fresh, narrowly-scoped result, not
a retroactive endorsement of anything that predates this run.

### How the pieces run together

```
probe-design         →  write the fixture + oracle + fairness contract
oracle-contract       →  prove the oracle discriminates before spending anything
headroom-calibration  →  cheap gate (n≈6-10, arm A only) — stop here if void
uplift-eval-core      →  freeze the pre-registration
trial-harness-ops     →  run arms A/B/C in sealed, cold-context sessions
uplift-statistics     →  Fisher exact, full table, one primary metric
```

`harness/run.mjs` implements the middle four mechanically: `selftest` proves
the oracle, `gate` runs the cheap screen, `run` executes a registered arm,
`report` prints the results table with the exact `fisher.py` command for each
comparison, and `regrade` re-scores retained transcripts against a corrected
oracle at zero re-spend.

---

## What's actually been proven

Every VERIFIED row below is a command that exits non-zero if the claim is
false — see [EVIDENCE.md](EVIDENCE.md) for the full ledger and exact commands.
Nothing is claimed here beyond what that ledger marks VERIFIED.

| # | Claim | Status |
|---|---|---|
| 1–2 | The three original oracles discriminate: fail at base, pass at the fix, reject the specific plausible wrong answers | VERIFIED |
| 3 | `repo-truth`'s discriminator (two orders, same subtotal, different correct tax) can't be passed by luck | VERIFIED |
| 4 | The Fisher-exact implementation is correct against known values | VERIFIED |
| 5 | A trial session is sealed from the operator's own config, memory, and skills | VERIFIED |
| 6 | Every fixture is offline-runnable with zero external dependencies | VERIFIED |
| 7 | **The three original probes have no headroom at Opus 5 or Sonnet 5 tier** — both models pass all three unaided, 60/60 trials, $12.46 | VERIFIED |
| 8 | The graders are frozen against 40 real model transcripts, not just synthetic cases | VERIFIED |
| 9 | Uplift from any of the three *original* probes | **NOT MEASURED** — the gate voided all three, so no contrast was run, per the pre-registered rule |
| 10 | **Sonnet 5 follows a documented ordering convention 37% of the time unaided (11/30) and 100% of the time with `rule-consistency` present (30/30)** — closing the full gap to an unaided Opus 5 ceiling (10/10) | VERIFIED, p = 5.34×10⁻⁸ |
| 11 | **The same skill, on a matched fixture with the rule inverted, produces zero measurable change** (30/30 both arms) — though this control cannot distinguish "no harm" from "no room to show harm" (arm A is already at ceiling) | VERIFIED, p = 1.0, no harm; structurally limited |
| 12 | **A de-leaked version of the skill (fixture domain and quoted rationale removed) still hits 100% whenever actually opened (11/11)** — but generalizing the description cut adoption from 100% to 37% | VERIFIED, raw p = 0.019; not-fired subset indistinguishable from baseline (p = 0.376) |
| 13 | **A second harm control (`retry-discipline`, opposite valence: the documented rule requires *less* defensive code) shows no measurable harm across 70 trials**, and zero occurrences of the specific hypothesized failure mode in either arm — but the test is underpowered: a pilot showed real headroom (80% unaided), the frozen contrast's arm A came in at 97% | VERIFIED, p = 1.0; underpowered null, pilot-vs-freeze gap disclosed in full |

Claim 9 is listed as a **null result, published on purpose** — it is exactly
the kind of finding `uplift-eval-core` says must be reported, not buried,
because a pre-registered void is more useful to the next person than a
missing row.

### The graders were wrong on the first try — twice

This is disclosed prominently because it is the most operationally useful
fact in the whole run, not an embarrassing footnote:

- The original gate's first grading pass mis-scored 9 of 60 rows from two
  regex bugs — one made a probe look like it had headroom that wasn't real,
  the other made Opus 5 look like it hedges verified results. Both were false,
  caught by reading actual transcripts, and both moved the numbers *away*
  from a claimable finding.
- The harm-control pilot for this contrast first read 4/6 (67% — unusably
  low for a control), traced to Sonnet 5 writing the correct action in a
  different text format (`ban_account` vs. the documented `banAccount`) — a
  real but unrelated naming issue. The oracle's string comparison was loosened
  to tolerate formatting, symmetrically, on both matched probes, before any
  arm-B trial existed for either — exactly what `oracle-contract` permits and
  no later — and the harm control then read a clean 6/6.

**Assume any transcript-grading oracle that has never been checked against
real model output is wrong.** Building the check is `oracle-contract`'s job;
running it before you trust a number is the discipline this project is
selling.

---

## The headline finding, in detail

**Probe:** [`rule-drift`](probes/rule-drift/) — six near-identical functions
need audit logging added; a one-file-away doc says logging must happen
*before* the risky operation, with a worked example, so the audit trail
survives a failure partway through.

**Result:**

| probe | arm | model | n | pass | rate |
|---|---|---|---|---|---|
| `rule-drift` | A (unaided) | Sonnet 5 | 30 | 11 | 37% |
| `rule-drift` | B (`rule-consistency` present) | Sonnet 5 | 30 | 30 | 100% |
| `rule-drift` | C (ceiling) | Opus 5 | 10 | 10 | 100% |
| `convention-override` (harm control) | A | Sonnet 5 | 30 | 30 | 100% |
| `convention-override` | B | Sonnet 5 | 30 | 30 | 100% |

Fisher exact, `rule-drift` A vs. B: **p = 5.34×10⁻⁸**. Gap closure
`(B−A)/(C−A)` = **100%** — arm B matches the unaided Opus 5 ceiling exactly.
Harm control A vs. B: **p = 1.0**, zero change, skill opened in all 30 trials.

Full detail, including quotes from the actual model transcripts showing the
same skill producing opposite-but-correct behaviour on the two fixtures, is
in [`evals/runs/2026-07-24-contrast-rule-drift.md`](evals/runs/2026-07-24-contrast-rule-drift.md).

---

## An external review, and what it changed

An outside audit of this repository found two real gaps and one genuinely
hard question, and rather than argue with it, we tested it.

1. **Nothing checked that a trial hadn't disabled the failure-injection
   mechanism the oracle depends on.** `docs/CONVENTIONS.md` forbids editing
   `src/db.js`; nothing enforced that. Fixed with a fixture-integrity guard —
   the same pattern `probes/disclosure` already used — and all 130 of the
   original contrast's trials were regraded against it. **Zero
   classifications changed:** no trial in that run touched the file, so the
   fix is confirmed inert on the real data, not just assumed to be.
2. **The skill named its own fixture's domain and quoted its rationale
   closely enough to raise a fair question**: was 37%→100% general judgement,
   or a hint dressed as one? We built a revised skill — same reasoning, the
   fixture-specific wording and the domain name removed from its own
   description — and reran arm B (n=30, fresh trials, the original arm A
   reused since nothing about it could have changed). **Result: when the
   de-leaked skill is actually opened, it hits 100% — the same number,
   independently — but generalizing its description cut how often Sonnet 5
   opens it at all, from 100% down to 37%.** The content transfers; the
   discoverability took a real hit from being made less domain-specific. Full
   breakdown, including the transcripts, in
   [`evals/runs/2026-07-26-retest-deleak.md`](evals/runs/2026-07-26-retest-deleak.md).
3. **The harm control can't distinguish "no harm" from "no room to show
   harm,"** because `claude-sonnet-5`'s unaided default already equals
   `convention-override`'s correct answer (30/30 arm A). This is a genuine
   limitation, stated plainly rather than glossed over — see the next
   section for what came of trying to fix it directly.

None of this reverses claim 10 or 11. It replaces "we measured an effect" with
a more precise, harder-to-attack version of the same claim, plus an honest
flag on what remains open.

---

## A second harm-control attempt, and what it taught us

Point 3 above is a real design flaw, not a rhetorical one, so we built a
second harm control specifically to fix it: [`retry-discipline`](probes/retry-discipline/).
Same skill under test (`rule-consistency`, byte-identical to the original),
deliberately different in two ways from `convention-override`:

- **A different mechanism** — error-propagation discipline under a simulated
  external call, not audit-call ordering, so a bias confined to "logging
  order" couldn't hide by not applying.
- **The opposite valence** — the documented rule here requires *less*
  defensive code than instinct suggests (log the failure, then let it
  propagate; never retry, never catch-and-return a fallback), the mirror
  image of `rule-drift`'s "log *before*, which needs more discipline, not
  less." If `rule-consistency`'s real effect were a disguised "always be more
  careful" bias rather than genuine rule-following, this is exactly the shape
  of fixture where that bias would show up as a regression.

We did this properly: a pre-registered pilot first (n=10, unaided), which
came back 80% pass — comfortably inside the "worth a real contrast" range,
not near either ceiling or floor. Only then did we freeze a full
pre-registered contrast (n=30/arm) and run it.

**The frozen contrast's arm A came back at 97% (29/30) — far higher than the
pilot's 80%.** We report this exactly as it happened rather than quietly
using the friendlier pilot number: the pre-registration's own rule is that a
pilot is directional only, and the frozen n=30 sample is what the statistics
are computed from. At 97%, there was only one point of room below ceiling —
nowhere near enough to power a real test for harm, even though the pilot had
looked like it would be. Arm B (skill present) came back 30/30 (100%): no
drop, no harm. And across all 70 real trials this probe ever ran — the
pilot and both arms of the frozen contrast — the specific failure mode this
fixture was built to catch (retrying a failed call, or catching it and
returning a fallback instead of raising it) **occurred zero times**, aided
or unaided.

That is a real result, just a modest one: no harm showed up, and the
specific bias we were checking for never appeared at all in 70 attempts —
weak evidence, because the test ended up underpowered, but evidence, and it
points the same direction the rest of this repository's data does. A
harm control that lands solidly in the middle of the range once measured
at full sample size — not just at its own pilot — remains a genuinely open
design problem. Full numbers, including the pilot-vs-freeze gap:
[`evals/runs/2026-07-26-contrast-retry-discipline.md`](evals/runs/2026-07-26-contrast-retry-discipline.md).

---

## Scope and limits — read this before citing any number above

- **`rule-consistency` is a new skill**, authored in this repository to close
  this specific gap. It is not a validation of any pre-existing skill suite,
  the fleet's or anyone else's.
- **One fixture, one domain (audit-logging ordering), one model tier
  (Sonnet 5), one skill wording family.** The result does not establish that
  this generalizes to other conventions, other domains, or other models.
- **`rule-drift`'s "compounding across six sites" framing is an untested
  hypothesis, not a confirmed mechanism.** Zero of 70 real trials showed a
  partial failure — every trial applied one judgement uniformly to all six
  functions. The AND-of-six gate is real and doesn't weaken the headline
  numbers, but nothing here shows compliance decaying *within* a session.
- **The harm control's null (claim 11) is weaker than "no room to show
  harm" would suggest** — see above. Read it as "the skill did not override
  the model's own correct default," not as "the skill was tested under
  conditions where it could have caused harm and didn't."
- **The second harm control's null (claim 13) is also underpowered**, for a
  different reason: its frozen arm A landed at 97%, not the 80% its own
  pre-registered pilot showed, leaving almost no room below ceiling to
  detect a real drop. Read it as "no harm appeared in 70 trials, and the
  specific failure mode never occurred," not as "harm was ruled out with
  adequate statistical power."
- **The three original probes remain void at both tiers measured.** That is a
  real, separately-useful finding — it says frontier models already handle
  those three failure modes unaided — and it is not overturned or diminished
  by the `rule-drift` result found afterward.
- **The cheap-tier numbers in EVIDENCE.md's "prior internal measurement"
  section are explicitly not reproducible from this repository** — private
  fixtures, included only because they shaped this project's design
  decisions, not as evidence about any frontier model.

---

## Try it yourself

No API key needed for the part that matters most — proving the graders
actually discriminate:

```bash
python harness/fisher.py --self-test
node harness/run.mjs selftest --probe probes/repo-truth
node harness/run.mjs selftest --probe probes/disclosure
node harness/run.mjs selftest --probe probes/overcaution
node harness/run.mjs selftest --probe probes/rule-drift
node harness/run.mjs selftest --probe probes/convention-override
node harness/run.mjs selftest --probe probes/retry-discipline
```

With an API key, the cheap gate (a few dollars, a few minutes) and the full
contrast recipe are both in [README.md](README.md#reproduce).

---

## Repository map

| Path | What's there |
|---|---|
| [`skills/`](skills/) | The six methodology skills — drop into any agent's skills folder |
| [`probes/`](probes/) | Eight probes: fixture, oracle, prompt, spec, counterfactual overlays |
| [`probes/rule-drift/skill/rule-consistency/`](probes/rule-drift/skill/rule-consistency/) | The one skill this repo has validated uplift for |
| [`harness/`](harness/) | `run.mjs` (trial runner) and `fisher.py` (stats) |
| [`evals/prereg/`](evals/prereg/) | Frozen pre-registrations, written before any trial they govern |
| [`evals/runs/`](evals/runs/) | Run records — every trial, every number, every deviation logged |
| [`EVIDENCE.md`](EVIDENCE.md) | The claims ledger — the one rule and the only source of truth for "what's proven" |

GitHub: `https://github.com/MeeshaBear1/headroom`

---

## Contributing

The bar for a new probe is that it clears the gate (`headroom-calibration`),
not that it confirms a hunch. A probe that voids at frontier tier is a
publishable result under this method, not a failed attempt. See "Adding your
own probe" in [README.md](README.md) for the exact layout.

## Licence

MIT — see [LICENSE](LICENSE).
