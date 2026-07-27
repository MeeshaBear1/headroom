# Run record — token accounting across all Sonnet 5 trials (post-hoc)

Date: 2026-07-27. **This is a post-hoc observational analysis, not a
pre-registered experiment.** No new trials were run and no new spend was
incurred: every number below is computed from the final result line of the
transcripts the three pre-registered Sonnet 5 phases already produced
(2026-07-24 contrast, 2026-07-26 de-leak retest, 2026-07-26 retry-discipline
contrast — 240 transcripts). Analysis script: `harness/tokens.py`
(sha256:`d0eb98dfe67aa76e`), reproduce with:

```
python harness/tokens.py evals/runs/contrast-rule-drift-sonnet5 \
  evals/runs/retest-deleak-sonnet5 evals/runs/contrast-retry-discipline-sonnet5
```

"Cost" is the CLI-reported all-in `total_cost_usd` (includes a negligible
Haiku helper component, ~$0.0006/trial). "Total tok" sums input, output,
cache-creation, and cache-read tokens; cache reads dominate the count but are
billed at a tenth of the input rate, so cost is the honest aggregator.

## Verdict

**Skills are not free, and the per-session direction is not consistent —
but on the one fixture where the skill changed outcomes, it paid for itself
roughly three times over per correct result.** The right token metric for a
skill is tokens per correct outcome, not tokens per session: a failed
session is 100% wasted spend.

## The numbers

### 2026-07-24 contrast (`contrast-rule-drift-sonnet5`)

| group | n | pass | mean cost | mean output tok | mean total tok | mean turns | mean secs | total cost | cost per pass |
|---|---|---|---|---|---|---|---|---|---|
| convention-override arm A | 30 | 30 | $0.245 | 4,288 | 364,050 | 22.7 | 62 | $7.35 | $0.25 |
| convention-override arm B | 30 | 30 | $0.225 | 3,948 | 328,550 | 21.7 | 59 | $6.76 | $0.23 |
| rule-drift arm A | 30 | 11 | $0.239 | 3,974 | 308,436 | 21.6 | 57 | $7.18 | $0.65 |
| rule-drift arm B | 30 | 30 | $0.222 | 3,724 | 331,008 | 20.8 | 50 | $6.67 | $0.22 |

### 2026-07-26 de-leak retest (`retest-deleak-sonnet5`)

| group | n | pass | mean cost | mean output tok | mean total tok | mean turns | mean secs | total cost | cost per pass |
|---|---|---|---|---|---|---|---|---|---|
| convention-override-deleak arm B | 30 | 30 | $0.271 | 4,946 | 382,365 | 26.0 | 73 | $8.14 | $0.27 |
| rule-drift-deleak arm B | 30 | 21 | $0.281 | 4,499 | 403,122 | 24.2 | 74 | $8.44 | $0.40 |
| — rule-drift-deleak, skill fired | 11 | 11 | $0.312 | 4,715 | 471,953 | 25.9 | 84 | $3.43 | $0.31 |
| — rule-drift-deleak, not fired | 19 | 10 | $0.263 | 4,374 | 363,273 | 23.3 | 68 | $5.01 | $0.50 |

### 2026-07-26 retry-discipline contrast (`contrast-retry-discipline-sonnet5`)

| group | n | pass | mean cost | mean output tok | mean total tok | mean turns | mean secs | total cost | cost per pass |
|---|---|---|---|---|---|---|---|---|---|
| retry-discipline arm A | 30 | 29 | $0.244 | 4,063 | 385,395 | 23.0 | 64 | $7.31 | $0.25 |
| retry-discipline arm B | 30 | 30 | $0.284 | 4,629 | 462,369 | 24.8 | 71 | $8.51 | $0.28 |
| — retry-discipline, skill fired | 18 | 18 | $0.296 | 4,863 | 490,717 | 24.9 | 73 | $5.34 | $0.30 |
| — retry-discipline, not fired | 12 | 12 | $0.264 | 4,278 | 419,848 | 24.5 | 67 | $3.17 | $0.26 |

## What the data shows

1. **On the headline fixture (`rule-drift`), the skill arm was cheaper per
   session AND ~3× cheaper per correct result.** Mean cost $0.222 vs $0.239
   (−7%), output tokens 3,724 vs 3,974 (−6%), 50 s vs 57 s — while pass rate
   went 37% → 100%. Cost per passing trial: **$0.65 → $0.22 (2.9×)**. The
   skill did not bloat the sessions; sessions that follow one consistent
   rule appear to flail slightly less than sessions that guess.

2. **Where the skill changes nothing, it costs something.** On
   `retry-discipline` (arm A already at 97%), the skill arm cost 16% more
   per session ($0.284 vs $0.244) and processed 20% more tokens, for a
   pass-rate difference of p = 1.0. The fired subgroup was the expensive
   one ($0.296 vs $0.264 not-fired): reading and applying a skill the task
   didn't need is pure overhead.

3. **The fired-vs-not-fired split repeats the cost-per-outcome inversion.**
   In `rule-drift-deleak`, fired trials cost 19% more per session ($0.312
   vs $0.263) but 38% less per correct result ($0.31 vs $0.50), because
   fired went 11/11 and not-fired went 10/19.

4. Directionally consistent small saving on `convention-override` (both
   arms at ceiling): skill arm $0.225 vs $0.245 (−8%) per session. Same
   sign as `rule-drift`, but with no outcome difference it reads as noise
   until replicated.

## Caveats

- Post-hoc and observational: none of these comparisons were pre-registered,
  no significance tests are claimed on the cost deltas, and per-session cost
  differences of 7–16% at n=30 are within plausible run-to-run noise. The
  cost-per-pass deltas are arithmetic consequences of the (pre-registered,
  significant) pass-rate deltas, and inherit their strength.
- One skill, one model (`claude-sonnet-5`), fixtures of one size class
  (~$0.25/session tasks). Nothing here says skills save money in general.
- Costs use list prices as reported by CLI 2.1.206 at run time, including
  the Sonnet 5 intro pricing in effect through 2026-08-31.
