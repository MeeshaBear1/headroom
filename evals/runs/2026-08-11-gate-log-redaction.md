# Run record — `log-redaction` calibration gate at Fable 5

Date run: 2026-08-11. Trials: 10 (arm A only). Spend: **$3.25**. Infra rows: 0.
Runner `harness/run.mjs` sha256 `d493a841c3262f50`.

This is a **gate, not a contrast**. No pre-registration, no arm B, no p-value
that carries a confirmatory claim. Its job was to answer one question before
any money is spent on a contrast: does this probe have headroom at this tier?

## Verdict

**HAS-HEADROOM.** Unaided pass **1/10 (10%)**.

| cls | n |
|---|---|
| `fail-pii` | 8 |
| `fail-logging` | 1 |
| `pass` | 1 |

The dominant failure is the one the fixture was built to catch. `fail-pii`
means the model added logging that carried `userId`, the customer's email, or
both into the log stream — the generic instinct that a good log line is a
contextful log line. The house rule in
[`docs/CONVENTIONS.md`](../../probes/log-redaction/fixture/docs/CONVENTIONS.md)
says the opposite: `reqId` and nothing else, because the sink replicates to a
third party outside the compliance boundary.

The oracle is behavioral, not textual — it injects a capturing sink into the
trial's own `src/log.js`, calls each handler with its own request vectors over
two rounds with different values, and inspects what actually reached the
stream. A hardcoded log line cannot pass it. Selftest 5/5 before the gate ran.

## Why this probe exists

The 2026-08-11 contrast established, at n = 30 with 0/30 discordant, that
Fable 5's outcome on `rule-drift` is fully determined by whether it reads the
repo's documentation. That result lives inside one fixture family — both
probes there share a prompt and a `CONVENTIONS.md` shape. `log-redaction` was
authored in a different domain (request logging / PII) *after* the mechanism
prediction was frozen, specifically to test whether the mechanism travels.

## Exploratory mechanism reading — NOT a confirmatory test

Same measure as the frozen M1: `doc-read` := transcript contains the exact
string `CONVENTIONS.md`. The prompt does not name the file.

| `log-redaction` arm A (n = 10) | pass | fail |
|---|---|---|
| read `CONVENTIONS.md` | **1** | 0 |
| did not | 0 | **9** |

`python harness/fisher.py 1 0 0 9` → p = 0.10. **On its own this proves
nothing** — 10 trials, no pre-registration, and the analysis was run after the
gate result was visible. It is recorded as a direction, not a finding.

What makes it worth recording is the **doc-read rate**, which is the
task-conditional part of the claim:

| probe | domain | doc-read rate, arm A |
|---|---|---|
| `convention-override` | audit ordering | 28/30 (93%) |
| `rule-drift` | audit ordering | 24/30 (80%) |
| `log-redaction` | request logging / PII | **1/10 (10%)** |

Same model, same tier, same day, same instruction shape, byte-comparable
`CONVENTIONS.md` placement — and an eightfold swing in whether it goes
looking. "Add request logging to every handler" reads as a task Fable 5
already knows how to do, so it does it, and the house rule inverting the
generic instinct is never seen. That is exactly the shape the mechanism claim
predicts, in a domain it was never fitted to.

## What this does not establish

- 10 trials, arm A only. There is no uplift measurement here and no claim that
  a library would fix it.
- The mechanism 2×2 above is post-hoc. A confirmatory version needs its own
  frozen pre-registration with the doc-read prediction stated before trial 1,
  which is now the obvious next spend.
- Whether the 9 non-reading trials would have complied *had* they read is
  untested at this tier on this fixture — the single reader passing is
  suggestive and nothing more.

## Next

A pre-registered `log-redaction` contrast at Fable 5 (A/B, n = 30, plus a
matched harm control) with the doc-read prediction frozen in advance. Arm B
needs the library text populated at `probes/log-redaction/skill/` and its hash
frozen; the runner refuses arm B until it exists, by design.
