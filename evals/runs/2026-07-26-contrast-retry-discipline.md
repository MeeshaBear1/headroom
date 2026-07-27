# Run record — retry-discipline contrast (Sonnet 5)

Pre-registration: [`evals/prereg/2026-07-26-contrast-retry-discipline.md`](../prereg/2026-07-26-contrast-retry-discipline.md)
(frozen before trial 1 of this phase). Pilot pre-registration:
[`evals/prereg/2026-07-26-pilot-retry-discipline.md`](../prereg/2026-07-26-pilot-retry-discipline.md).
Date run: 2026-07-26. Trials: 60 (30/arm) plus a 10-trial pilot. Actual
spend: **$15.82** (contrast) + **$2.95** (pilot) = **$18.78**. Infra rows: **0**.

## Verdict

**No harm detected, and no uplift either — because the fixture turned out
to have almost no room to show either one, once measured at the
pre-registered n rather than the pilot's n=10.** That gap between pilot and
frozen result is itself the most useful thing this phase produced, and is
reported in full below rather than smoothed over.

| probe | arm | model | n | pass | rate | skill fired |
|---|---|---|---|---|---|---|
| `retry-discipline` (pilot, n=10, not used in the statistic below) | A | `claude-sonnet-5` | 10 | 8 | 80% | — |
| `retry-discipline` (frozen contrast) | A | `claude-sonnet-5` | 30 | 29 | 97% | — |
| `retry-discipline` (frozen contrast) | B | `claude-sonnet-5` | 30 | 30 | 100% | 18/30 |

`python harness/fisher.py 30 0 29 1` → **p = 1.0**. Not a significant
difference in either direction.

## The pilot-vs-freeze gap, disclosed

The n=10 pilot landed 8/10 (80%), comfortably inside the pre-registered
HAS-HEADROOM band (5%–90%) and the reason a full contrast was frozen at all.
The frozen n=30 arm A landed 29/30 (97%) — above the 90% ceiling threshold
that would have voided this as a primary probe had it been known at gate
time. Both numbers are real; neither is discarded. This is the same lesson
the original 2026-07-24 contrast's own pilot-vs-freeze note drew, just in
the opposite direction: there, a 10-trial pilot (1/10) understated a true
~37% rate; here, a 10-trial pilot (8/10) understated what turned out to be
a true rate close to ceiling. A binomial draw of 8/10 is unremarkable
variance if the true rate is anywhere from roughly 65% to 100% — it does
not, by itself, distinguish "genuine 80% headroom" from "97% with pilot
noise". The pre-registration's rule — freeze the contrast on the pilot's
verdict, but never use the pilot's rate as the statistic — is exactly what
kept this honest: the primary comparison above uses the frozen 29/30, not
the pilot's 8/10.

**Practical lesson for this framework, stated plainly:** an n=10 screen
resolves "is this probe unusably near a ceiling or floor" but does not
reliably resolve "is this probe usefully mid-band" — a probe that clears the
80%-ish range at n=10 can still turn out to be a near-ceiling probe at n=30.
A future harm-control search should either pilot at n≥20 before freezing a
contrast, or treat an 70–90% pilot result as marginal and expect the
possibility of a near-ceiling freeze.

## What the data actually shows

Across all 70 real trials in this probe (10 pilot + 30 frozen arm A + 30
frozen arm B), there were exactly **two** failure classes, and both were
`fail-no-log` or `fail-wrong-args` — an omission or a wrong parameter, never
`fail-swallowed` or `fail-retried`. **Zero of 70 trials, in either arm, at
either n, exhibited the specific defensive-instinct failure this fixture was
built to detect** (catching a propagated error and returning a fallback
value, or retrying the call). That is weak evidence, on its own, because the
sample that could have shown it is small (31 real failures... actually only
3 failures total across 70 trials: 2 in the pilot, 1 in the frozen arm A,
0 in arm B) — but it is evidence, and it points the same direction as the
overall null: nothing in these 70 trials suggests `claude-sonnet-5`, aided
or unaided, has a hidden bias toward adding retries or swallowing errors on
this kind of task.

The one frozen arm-A failure (`retry-discipline-A-018`, `fail-wrong-args`,
0/6 ok — uniform across all six files, not partial, consistent with the
same compounding-by-pattern mechanism `rule-drift` showed) did not recur in
arm B. That is a one-point move, not a claim: n=1 failure fixed is not
evidence of anything on its own, and is reported as what it is, not
inflated into a second uplift finding.

## Adoption: a third data point for the same frozen skill

`rule-consistency` (sha256:`07550bba3d88fdfb`, the same file from the
original contrast, unmodified) fired in **18/30 (60%)** of arm-B trials
here — lower than its 100% (30/30) adoption on `rule-drift`'s own domain
(audit logging), higher than the de-leaked variant's 37% on the same
`rule-drift` fixture. Same skill text, three different adoption rates
across three different task framings:

| context | skill text | adoption |
|---|---|---|
| `rule-drift` (original) | names "audit logging, ordering" | 30/30 (100%) |
| `rule-drift-deleak` | generalized domain list | 11/30 (37%) |
| `retry-discipline` (this run) | original text, unrelated task (delivery logging) | 18/30 (60%) |

Because arm B here hit 100% pass regardless of firing, adoption could not
be checked against an outcome difference the way the de-leak retest's could
(there, fired vs. not-fired split 100% vs. 53%; here, fired and not-fired
both landed 100%, uninformative by construction). What this table does show
is that discoverability is genuinely task-dependent, not just a property of
the skill's own wording — the same unmodified skill text was opened at three
different rates across three different task framings.

## Relationship to the original contrast and the de-leak retest

This does not change either prior result. `rule-drift`, `convention-override`,
`rule-drift-deleak`, and `convention-override-deleak` are untouched by this
phase. What this phase adds is a second, independent attempt at a
harm-control fixture for the same skill, built specifically to avoid
`convention-override`'s known flaw (ground truth trivially equal to the
unaided default). It avoided that flaw by construction and by a real,
headroom-showing pilot — and still landed near ceiling once measured
properly, for a different and more mundane reason: the true unaided rate on
this fixture is just high. That is a different failure mode than
`convention-override`'s, and is disclosed as such rather than folded into
the same explanation.

## What this does and does not show

**Shows:** across 70 real trials on a fixture built with the opposite
valence from `rule-drift` (correct behavior requires *less* defensive code,
not more), `claude-sonnet-5` gets it right the large majority of the time
unaided, `rule-consistency` does not measurably help or hurt, and the
specific hypothesized failure mode (retry-on-failure, swallow-and-fallback)
never appeared in any trial, aided or unaided. That is evidence against a
generic "always add more defensive code" bias in this skill, though weaker
evidence than a well-powered mid-band contrast would have given.

**Does not show:** a well-powered test of harm. With arm A at 97%, there was
room for at most a 3-point drop to be detectable at all, and Fisher exact at
this n cannot resolve an effect that small. A genuinely well-powered
downward harm control for this skill — one where a real pre-registered
contrast lands solidly mid-band, not just its pilot — remains an open task
this repository has not yet completed. Two independent attempts
(`convention-override`, structurally unable to show harm by construction;
`retry-discipline`, empirically near ceiling despite sound design) both
failing to surface harm is suggestive, not conclusive, of the skill being
what it claims to be.

## Environment

`claude` CLI 2.1.206 · Node v24.16.0 · Windows 11 win32 · `acceptEdits` ·
allowed tools `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` · max turns 80 ·
timeout 900 s · concurrency 6 · throwaway `CLAUDE_CONFIG_DIR` per trial ·
model `claude-sonnet-5` · runner sha256:`bdaf65b12c4cbc1d` · artifact hashes
as frozen in the contrast pre-registration.

## Deviations from the pre-registration

None. Arm A was collected fresh at n=30 as specified (not reused from the
pilot); the primary metric, the fired/not-fired reporting requirement, and
the failure-mode breakdown were all computed exactly as specified. The pilot
result is reported in full per the pilot pre-registration's own publication
rule, not omitted because it turned out to disagree with the frozen number.
