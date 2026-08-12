# Run record — rule-drift contrast at Fable 5 (reused Opus 5 ceiling)

Pre-registration: [`evals/prereg/2026-08-11-contrast-rule-drift-fable5.md`](../prereg/2026-08-11-contrast-rule-drift-fable5.md)
(frozen before trial 1, commit `65af11e`).
Date run: 2026-08-11. Trials: 120 valid + 31 voided. Actual spend: **$71.58**
($67.30 valid, $4.28 voided). Infra rows in the reported set: **0**.

## Verdict

**UPLIFT, confirmed but modest. NO HARM, confirmed. The tier-inversion claim
did NOT replicate. The mechanism claim replicated perfectly and is now the
finding.**

| probe | arm | model | n | pass | rate | skill fired |
|---|---|---|---|---|---|---|
| `rule-drift` | A | `claude-fable-5` | 30 | 24 | 80% | — |
| `rule-drift` | B | `claude-fable-5` | 30 | 30 | 100% | 30/30 |
| `rule-drift` | C | `claude-opus-5` (reused 2026-07-24) | 10 | 10 | 100% | — |
| `convention-override` (harm control) | A | `claude-fable-5` | 30 | 30 | 100% | — |
| `convention-override` (harm control) | B | `claude-fable-5` | 30 | 30 | 100% | 30/30 |

**Primary.** `rule-drift` A vs B: `python harness/fisher.py 30 0 24 6` →
**p = 0.0237**. Uplift +20 pp. Gap closure `(B−A)/(C−A)` = 100%, but C is at
ceiling and only 10 wide, so read the closure figure as "B reaches the
ceiling", not as a precise fraction.

**Harm control.** `convention-override` A vs B: `fisher.py 30 0 30 0` →
**p = 1.0**. 30/30 both arms. The library does not damage the sibling task it
should leave alone.

## The exploratory result did not survive

The 2026-08-09 exploratory pass (n = 10/cell) put `rule-drift` arm A at
**5/10 (50%)** and framed the headline as a tier inversion: *Fable 5,
a tier above Opus 5, scores below Opus 5 unaided.* At n = 30 arm A is
**24/30 (80%)**.

Secondary endpoint as frozen — `rule-drift` arm A (Fable, n = 30) vs reused
arm C (Opus, n = 10): `python harness/fisher.py 24 6 10 0` →
**p = 0.31. Not significant.**

**The tier inversion is withdrawn.** The exploratory 50% was small-n noise; a
50%→80% shift is entirely ordinary at n = 10. Any downstream text repeating
"Fable 5 scores below Opus 5 unaided" is wrong and is corrected in this pass.

The primary uplift survived the correction but shrank hard: at the exploratory
rate the gap was 50 pp, and it is 20 pp measured. p moved from the
Sonnet-tier `5×10⁻⁸` to a marginal `0.024`.

## What did replicate — the mechanism

All three mechanism predictions were frozen before trial 1.
`doc-read` := the retained transcript contains the exact string
`CONVENTIONS.md`. Neither probe's prompt names the file (the two prompts are
byte-identical, sha256 `422d913a9b721837`), so the marker is genuine
unprompted discovery, not instruction-following.

**M1 — predicted pass ⟺ doc-read in `rule-drift` arm A, ≤ 2/30 discordant.
Observed 0/30 discordant.**

| `rule-drift` arm A (n = 30) | pass | fail |
|---|---|---|
| read `CONVENTIONS.md` | **24** | 0 |
| did not | 0 | **6** |

`python harness/fisher.py 24 0 0 6` → **p = 1.68×10⁻⁶**. Perfect
concordance. Every trial that discovered the doc passed; every trial that did
not, failed. There is no third behaviour.

**M2 — predicted doc-read (or skill-fire marker) in ≥ 28/30 of `rule-drift`
arm B. Observed 30/30**, skill fired 30/30. Holds.

**M3 — predicted `convention-override` arm A doc-read rate > `rule-drift` arm
A doc-read rate (direction only). Observed 28/30 (93%) vs 24/30 (80%).
Holds directionally**, but weakly: on those cells Fisher gives p ≈ 0.25, and
M3 was frozen as a direction test precisely because it could not carry a
significance claim at this n. The sibling-fixture variance is real and
unexplained; it is smaller than the exploratory 10/10-vs-5/10 split implied.

Full 2×2 for all four cells, as promised in the freeze:

| cell | n | doc-read | pass | read&pass | read&fail | noread&pass | noread&fail |
|---|---|---|---|---|---|---|---|
| `convention-override` A | 30 | 28 | 30 | 28 | 0 | 2 | 0 |
| `convention-override` B | 30 | 30 | 30 | 30 | 0 | 0 | 0 |
| `rule-drift` A | 30 | 24 | 24 | 24 | 0 | 0 | 6 |
| `rule-drift` B | 30 | 30 | 30 | 30 | 0 | 0 | 0 |

### Reproducing the mechanism measure without re-spending

`doc-read` is a string match, so it is checkable from the repository:

```bash
cd evals/runs/contrast-rule-drift-fable5
cat mechanism.tsv                          # tid, probe, arm, doc_read, cls — all 120 rows
grep -c CONVENTIONS.md transcripts/rule-drift-A-*.jsonl | grep -c ':0$'   # -> 6, the non-readers
```

The 30 `rule-drift` arm A transcripts are committed as an exception to the
repo's usual transcript ignore, precisely because this claim reduces to
grepping them. The other 90 are retained locally only; `mechanism.tsv` carries
their measure.

## What this now claims

The finding is **not** a tier ranking. It is:

> At Fable 5, outcome on this task is fully determined by whether the model
> goes looking at the repo's own documentation. It decides that per-task and
> unprompted, and the decision rate moves with surface details of the fixture
> rather than with the difficulty of the rule.

This is mechanistically different from the Sonnet 5 failure the same fixture
measures. Sonnet 5 at `rule-drift` arm A scored 11/30 and its failures include
trials that **read the rule and inverted it** — a disposition failure. Fable 5
produces zero read-and-fail trials in 30. Its only failure mode is not looking.

That distinction is what a library buys at each tier. Against a disposition
failure the library supplies the correct disposition; against a discovery
failure it supplies nothing but the prompt to look — which is why the same
library that closes a 63 pp gap at Sonnet closes 20 pp at Fable.

## Deviation D1 — API outage voided 31 trials

Fully written up in the pre-registration's append-only Deviations section. In
brief: a 529 outage killed 25 trials whose terminating event carried
`"terminal_reason":"api_error"`. The CLI still emits a well-formed
`"type":"result"` with `"subtype":"success"` on an API death, so every infra
check in the runner passed and the oracle graded 24 untouched fixtures as
`fail-no-audit` — producing an apparent harm signal (`convention-override`
arm B at 6/30 = 20%) that was pure artifact.

Actions, all under the pre-registered abort rule:

- `harness/run.mjs` patched to classify `terminal_reason=api_error` as
  `infra-api-error`. Frozen hash `bdaf65b12c4cbc1d` → **`d493a841c3262f50`**.
  The patch touches only the infra/behaviour split and cannot change a
  behavioural grade, so arm A rows produced under the earlier hash stay
  comparable.
- All 30 `convention-override` arm B rows and `rule-drift-B-021` voided into
  [`voided-529/`](contrast-rule-drift-fable5/voided-529/) and retained.
- All 31 re-run from scratch. The re-run produced **0 infra rows** and
  `convention-override` arm B at 30/30 — i.e. the "harm" was the outage.
- `rule-drift-B-021` is the honest edge case: it completed 18 tool calls
  across all six `src/ops/*.js` files, graded **pass**, then died on
  `"Connection closed mid-response."` It was voided anyway, on the same
  mechanical rule. Its replacement also passed, so the exclusion changed
  nothing.

No endpoint, threshold, or exclusion rule was changed. The voided 20% was
visible before the discard was ordered; it is published here for that reason.

## Cost

| group | n | mean cost | total |
|---|---|---|---|
| `convention-override` A | 30 | $0.466 | $13.97 |
| `convention-override` B | 30 | $0.678 | $20.34 |
| `rule-drift` A | 30 | $0.500 | $15.00 |
| `rule-drift` B | 30 | $0.600 | $17.99 |
| voided (529) | 31 | $0.138 | $4.28 |
| **total** | **151** | | **$71.58** |

Arm C cost $0: reused from 2026-07-24 after verifying every relevant artifact
hash is byte-identical to the July freeze. The 18-day gap and the asymmetric
n = 10 are the disclosed limitations, and they are exactly why the tier
comparison was frozen as secondary.

The 24 outage-killed trials cost $0.02 in total — they died at turn 1. An API
outage is cheap to suffer and expensive to miss.

## Limitations

- One fixture family. Both probes share a prompt and a `CONVENTIONS.md` shape;
  M3's unexplained variance lives inside that family. Whether the discovery
  mechanism generalizes is the open question — [`probes/log-redaction`](../../probes/log-redaction/)
  was built for it and is gated separately.
- Arm C is reused, 18 days stale, and n = 10.
- `doc-read` is a string match on the transcript. It detects that the file was
  opened, not that the rule was understood. Its predictive power here (0/30
  discordant) is the evidence that the two coincide at this tier, not an
  assumption built into the measure.
- p = 0.024 on the primary is one fixture at one tier on one day. It is a
  result, not a law.
