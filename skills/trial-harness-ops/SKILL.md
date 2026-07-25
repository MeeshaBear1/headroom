---
name: trial-harness-ops
description: Running the trials without contaminating them — cold-context session isolation, the environment sealing risk register, infra-vs-behavioural row classification, retry and resume, spend gates, and transcript retention. Use when building or operating an eval harness, when trial results look inconsistent between runs, when a run must resume after an interruption, or when a result might be explained by the environment rather than the model. Not for grading rules — use oracle-contract. Not for statistics — use uplift-statistics.
---

# Trial harness ops

The harness is where measurements silently die. Every rule here exists because
one of these leaks turns a clean design into an unfalsifiable number.

## Cold context, every trial

Each trial is a **fresh non-interactive session** in a **fresh copy of the
fixture**. Never reuse a session, never reuse a working tree, never run trials in
the working repo.

If the trials run inside the session doing the analysis, the result is *self-run,
not cold-context*, and it is not evidence of subject-model uplift. Label it that
way or do not report it.

## Isolate the agent's configuration, not just its directory

An agent CLI loads far more than the current directory: user-level instruction
files, global skills, hooks that inject text into every session, plugins that
carry memory *between* sessions, and MCP servers. Any of those reaching a trial
contaminates **every arm**, and a cross-session memory plugin destroys the
fresh-session property outright by carrying trial N's context into trial N+1.

So: point the CLI at a **throwaway config directory per trial**, and strip the
parent session's own variables from the child environment.

```js
for (const [k, v] of Object.entries(process.env)) {
  if (/^CLAUDE/i.test(k) || /^ANTHROPIC_/i.test(k)) continue;  // parent session
  if (/(_KEY|_SECRET|_TOKEN|APIKEY|PASSWORD|CREDENTIAL)/i.test(k)) continue;  // operator secrets
  childEnv[k] = v;
}
childEnv.CLAUDE_CONFIG_DIR = freshConfigDir;
childEnv.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;  // re-add only what auth needs
```

A fresh config directory generally has no approved credential, so the CLI will
refuse to start. Seed the throwaway directory with the minimum that makes API-key
auth work — an onboarding flag and the key's approval record — rather than copying
the operator's credential file into it.

**Verify the isolation, once, with a leak probe.** Spawn one trial-shaped session
and ask it directly: is any global mode or persona active, is any of the
library's skills available, do you have memory of prior conversations. Three
noes is your evidence the seal holds. Put the probe's output in the run record —
an unverified seal is an assumption.

## Environment sealing risk register

| Risk | Leak | Control |
|---|---|---|
| **Future leak** | the fixture's history reveals the answer, or `.git` shape differs between arms | seal fixtures as plain files or uniform orphan commits, no remote, no reflog |
| **Install weight** | first trial pays a dependency install the rest do not | warm every dependency in setup; fixtures with zero install are better |
| **Dirty tree** | trial N sees trial N−1's edits | fresh copy per trial, never the working repo |
| **Env leakage** | operator secrets or config visible to the model | scrub secret-shaped variables; declare any probe-specific variable in the probe spec so the seal is on the record |
| **Non-mainline mining** | fixtures drawn from abandoned branches | mainline history only |
| **Tool asymmetry** | arms get different tool permissions | one allowed-tools list, one permission mode, shared by all arms |

## Infra rows are not failures

A spawn error, a timeout, or a non-zero exit with an empty transcript is the
**harness** failing, not the model. Classify it `infra-*`, retry once, and exclude
it from every statistic. Recording infra noise as behavioural failure is the
fastest way to invent an effect.

Detect "the session actually completed" from a positive signal in the transcript
(a terminal result event), not from exit status alone.

**Abort floor:** if infra rows exceed a pre-registered count, stop the run and fix
the harness. A run limping along at a 30% spawn-failure rate is not producing data.
Write a stop file the driver checks each iteration so an operator can halt a run
without killing it mid-trial.

## No silent caps

Every trial that does not reach the statistics is named in the run record with its
reason: infra, timeout, operator halt, excluded by a pre-registered rule. A results
table that quietly reports 27 of 30 rows reads as "we ran 27".

## Resume, don't restart

Write one row file per trial, keyed by trial id, and skip trials whose row already
exists. Runs get interrupted; re-running the completed 80% wastes the budget and
changes nothing. Keep every raw transcript on disk — the row is the summary, the
transcript is the evidence, and the questions you will want to ask later are not
the ones you thought to record.

## Spend gates

A live run costs real money. Require an explicit confirmation flag, and make the
refusal message state the count, the model, the probe and the arm:

    spend gate: 30 live claude-opus-5 trials, probe repo-truth, arm B. Re-run with --yes.

Bound concurrency. Parallel trials are independent, but an unbounded fan-out
trips rate limits, and rate-limit failures arrive as infra rows that eat the
abort floor.

## Pin the harness

Record the CLI name and version, the runner's commit, the model id per arm, the
allowed-tools list, the permission mode, the timeout, and the concurrency. All of
them change results. A CLI's own built-in skills compete for invocation and change
between releases — a run without its CLI version is not comparable to any other run.

## Siblings

- **oracle-contract** — how a completed trial is graded.
- **uplift-eval-core** — what the run record must contain.
- **uplift-statistics** — what to do with the rows.
