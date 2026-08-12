# Run record — Fable 5 tier reanalysis (exploratory)

> **SUPERSEDED, 2026-08-11, and one claim below is WITHDRAWN.**
> The pre-registered n=30 replication is
> [`2026-08-11-contrast-rule-drift-fable5.md`](2026-08-11-contrast-rule-drift-fable5.md).
>
> - `rule-drift` arm A measured **5/10 (50%)** here. At n=30 it is **24/30
>   (80%)**. The 50% was small-n noise.
> - **The tier-inversion framing below — Fable 5 scoring under the Opus 5
>   ceiling unaided — is withdrawn.** At n=30, Fable A 24/6 vs the same reused
>   Opus C 10/0 gives **p = 0.31**. Do not cite it.
> - The uplift replicated but shrank: p = 0.0325 here, **p = 0.024** at n=30,
>   on a 20 pp gap rather than a 50 pp one.
> - The mechanism claim — task-conditional doc discovery — replicated and got
>   stronger: **0/30 discordant, p = 1.7×10⁻⁶**, pre-registered before trial 1.
>
> This file is left as written. It is the exploratory pass, and the point of
> the caveat in its own third paragraph is that it was right to be cautious.

Date run: 2026-08-09. Trials: 50. Actual spend: **$23.93** (`harness/tokens.py`
over the three run dirs). Infra rows: **0**. Model under test:
`claude-fable-5` (Anthropic's Mythos-class tier, above Opus 5).

**Not pre-registered.** This is an exploratory reanalysis at a newly available
tier, run at gate/pilot n. Every number below is directional evidence at n=10
per cell, not a frozen contrast. Treat p-values accordingly and re-run at n=30
per arm before quoting any of this as a headline claim.

## Results

| probe | arm | n | pass | rate | verdict / note |
|---|---|---|---|---|---|
| `rule-drift` | A (unaided) | 10 | 5 | 50% | **HAS-HEADROOM** |
| `rule-drift` | B (`rule-consistency` soft-present) | 10 | 10 | 100% | skill fired 10/10; vs arm A, Fisher p = 0.0325 |
| `convention-override` (harm control) | A | 10 | 10 | 100% | CAN-DETECT-HARM |
| `convention-override` (harm control) | B | 10 | 10 | 100% | skill fired 10/10; **no harm, p = 1.0** |
| `null-census` (new, fleet-convention) | A | 10 | 10 | 100% | **VOID-FOR-TIER** |

Run dirs: `gate-fable5/`, `gate-fable5-harm/`, `gate-fable5-nullcensus/`.
Transcripts retained.

## The headline mechanism — verified in transcripts, not inferred

**Fable 5's failure mode on `rule-drift` is different in kind from Sonnet 5's.**
Sonnet 5's documented failure (2026-07-24 contrast) was dispositional: it read
the ordering rule and inverted it anyway, with a plausible justification. Fable 5
never did that. Across the 10 unaided trials the split is perfect:

- **5/5 passing trials opened `docs/CONVENTIONS.md`** (5-6 mentions each) and
  complied exactly.
- **5/5 failing trials never mentioned it** — tool-call logs show they Globbed
  `src/ops/*.js`, read the op files, grepped `audit`, read `src/audit.js`, and
  edited all six files without ever looking in `docs/`. All five produced the
  same instinct answer: `audit()` *after* the mutation, `fail-order-after`,
  0/6 sites.

The two transcript classes differ by exactly one tool call: the `Read` of
`docs/CONVENTIONS.md`.

**The `null-census` void completes the picture.** That probe (built today from a
real fleet contract — `provenance-print-kit/contract.md`: null means unmeasured,
measurement beats assertion, unknown versions fail loudly) is *visibly*
underspecified: the 3600×5400 printability threshold cannot be guessed. There,
Fable 5 opened `docs/CONTRACT.md` in **10/10** trials and passed 10/10.

So at this tier the gap is **task-conditional doc discovery**: Fable 5 reads the
repo's docs when it can feel that it doesn't know something, and skips them when
the task looks like something it already knows how to do (adding audit logging).
"Looks generic but the house does it differently" is exactly where a library
still earns its keep at this tier — and the soft-present skill closed the gap
completely (10/10, fired 10/10) with zero measured harm on the inverted-rule
control (where it also fired 10/10 and still deferred to the fixture's own doc,
a stronger no-harm shape than the Sonnet 5 run, where firing was not total).

## Also observed, not explained

Unaided doc-reading rates differed sharply between the two near-identical
fixtures: 5/10 on `rule-drift` vs 10/10 on `convention-override` (byte-identical
prompt; fixtures differ only in README title line, CONVENTIONS content, and
package name). At this n that is unexplained variance — recorded, not
interpreted.

## Honest reading

- **What this shows.** At `claude-fable-5`, on this fixture, the validated skill
  still produces its full effect, via a discovery/routing mechanism rather than
  the disposition mechanism measured at Sonnet 5. A tier above Opus 5 is *not*
  uniformly at ceiling: `rule-drift` arm A is 50% at Fable 5 vs 100% at Opus 5
  (n=10 each; Fisher on those two cells: p = 0.033).
- **What this does not show.** Anything about the fleet's 121 pre-existing
  libraries (only `rule-consistency` was run); anything at contrast power; why
  discovery behaviour differed between sibling fixtures. The `null-census` void
  is a statement about that probe at this tier, not about the print-house family
  skill, whose arm B was never run (correctly — the gate said stop).
- **Cost of learning this: $23.93 and under an hour**, including authoring and
  selftesting a new probe.

## Environment

`claude` CLI on PATH · Node v24.16.0 · Windows 11 win32 · harness defaults
(concurrency 6, timeout 900 s, throwaway `CLAUDE_CONFIG_DIR` per trial) ·
model `claude-fable-5`.
