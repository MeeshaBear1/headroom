# Do Claude Code skills actually pay for themselves? We measured.

*Every number on this page comes from a pre-registered experiment or a
published analysis of its transcripts — sources linked at the bottom. Nothing
here is a vibe.*

---

## The 30-second version

A **skill** is a one-page markdown file of your team's rules that Claude Code
reads before working. We ran the same real coding task 30 times without one
and 30 times with one, graded every attempt with an automated checker, and
locked the rules of the experiment in writing *before* running it.

**Without the skill: Claude Sonnet 5 got it right 37% of the time.
With it: 100%.** (p = 5.34×10⁻⁸ — that's a one-in-nineteen-million chance
of luck.)

And the token bill? The skill sessions were **~7% cheaper**, not more
expensive — and because failures stopped happening, the cost of getting a
*correct result* dropped from **$0.65 to $0.22. Nearly 3× cheaper per
outcome.**

A failed session is 100% wasted tokens. The cheapest token is the one you
don't spend redoing the work.

## The part most marketing wouldn't tell you

We kept testing, and the picture got more interesting:

- **Skills aren't free.** On a task the model already aced unaided (97%
  correct), adding the same skill cost **16% more per session** and changed
  nothing. Reading rules you didn't need is pure overhead.
- **Skills only work if the model opens them.** The exact same skill file
  was opened 100% of the time on one task, 60% on another, and 37% on a
  third — and when it wasn't opened, it showed no measurable benefit.
  Discoverability is half the game.
- **We tried twice to make the skill cause harm, and couldn't** — 130 trials
  across two purpose-built trap fixtures, zero measurable damage. (Honest
  caveat: both traps turned out to have little room to show harm, so this
  is reassurance, not proof.)

## What this means for you

1. **Write skills for the rules your model actually gets wrong** — your
   house conventions, the tribal knowledge that isn't in any training set.
   That's where 37% becomes 100%.
2. **Don't write skills for things the model already does well.** You'll
   pay ~16% more per session for nothing.
3. **Name your domain in the skill's description.** The single biggest
   adoption lever we measured: a skill that names the task's domain was
   opened 100% of the time; the same content with a generic description,
   37%.
4. **Measure outcomes, not sessions.** Cost per correct result is the
   number that matters, and it's where skills win big.

## Why you can trust these numbers

Everything was **pre-registered**: sample sizes, pass criteria, and
statistics were committed to git *before* the first trial ran, so we
couldn't move the goalposts. The grader is a behavioral test suite that
can't be sweet-talked, with tamper guards on the files it reads. The
graders, the fixtures, and the per-trial verdict for every one of the 280
real trials are public — including the experiments that found *nothing*,
published with the same prominence as the one that found the headline.

Run it yourself:

```
git clone https://github.com/MeeshaBear1/headroom
node harness/run.mjs selftest          # offline, no API key needed
```

---

### Sources

| claim | source |
|---|---|
| 37% → 100%, p = 5.34×10⁻⁸ | [`evals/runs/2026-07-24-contrast-rule-drift.md`](evals/runs/2026-07-24-contrast-rule-drift.md) (pre-registered, n=30/arm) |
| −7% per session, $0.65 → $0.22 per correct result | [`evals/runs/2026-07-27-token-accounting.md`](evals/runs/2026-07-27-token-accounting.md) (post-hoc analysis of the same transcripts) |
| +16% per session where the model didn't need the skill | same token-accounting record; outcomes in [`evals/runs/2026-07-26-contrast-retry-discipline.md`](evals/runs/2026-07-26-contrast-retry-discipline.md) |
| 100% / 60% / 37% adoption of the same skill text | [`evals/runs/2026-07-26-retest-deleak.md`](evals/runs/2026-07-26-retest-deleak.md) and the retry-discipline record |
| Harm controls (130 trials, no damage, underpowered) | [`EVIDENCE.md`](EVIDENCE.md) claims 11 and 13 |

*Scope, honestly stated: one skill, one model (Claude Sonnet 5), one family
of multi-file consistency tasks, ~$0.25/session size class. The full claims
ledger, including what we did **not** find, is [`EVIDENCE.md`](EVIDENCE.md).*
