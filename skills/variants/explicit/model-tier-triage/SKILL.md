---
name: model-tier-triage
description: "Load this skill at the start of any task that ends in a status report, a completion claim, or a release note, and read it before writing that report. Also load it before deciding whether a task is safe to attempt, and before weakening a guard, a test, or an assertion to reach a passing result."
---

# model-tier-triage

## Purpose
Gives a workhorse-tier model a branch-explicit procedure to (a) complete only tasks it can finish safely, (b) stop at defined out-of-depth signals BEFORE doing damage, and (c) hand off via a cheap escalation artifact — plus the reverse: how a frontier-tier session triages its own work, stops at its own signals, and packages work down to cheaper tiers.

**Both tiers are in scope, and they fail differently.** A workhorse fails by grinding: the same test three ways, then a suppression to get past it. A frontier model rarely grinds — it fails once, fluently, by producing a well-formed answer across a gap in the evidence. Capability does not fix that; it makes it harder to spot, because the output has the shape of a sourced one. Steps 1–4 govern the workhorse loop; Steps 1b, 2b and 3b govern the frontier loop; Step 5 is the handoff between them.

## When NOT to use
- Onboarding onto a repo (build commands, layout, test truth) → use repo-truth-discovery.
- Building, refreshing, or auditing a skill library → use skill-library-builder.

## Procedure

### Step 1 — Triage before touching anything
Classify the task by observable features, not vibes. One row per class; any one feature qualifies.

| Class | Observable features | Who executes |
|---|---|---|
| Mechanical | rename; apply a pattern already documented in this repo; add a test mirroring an existing one; fix a lint/format error with a named rule | Workhorse tier alone |
| Bounded judgment | implement against existing failing tests; extend an API that has docs + examples; fix a bug that has a reproducer command | Workhorse tier + Step 4 gates |
| Open judgment | design decision; schema or API shape; security boundary; ambiguous spec (two readings survive a re-read); cross-repo invariant; novel algorithm | Frontier tier, or stop and produce the Step 3 artifact |
| Irreversible | payments/money movement; DB migrations; data deletion; publishing/release; legal or compliance copy; auth/permission changes | Any tier PLUS a human gate — tier never removes the gate |

GATE: which class?
- Features from two classes present → take the more severe class (order above, top = least severe).
- Unsure between two classes → take the more severe.
- Any irreversible feature present, even incidentally → the whole task is Irreversible.

### Step 1b — Frontier triage (run this when YOU are the most capable reader present)
Step 1 asks what the task is. Step 1b asks what the *deliverable becomes*, because at frontier tier the expensive mistake is not an attempted task — it is a confident sentence that outlives the session. Three questions, answered before the first edit.

| # | Question | If yes |
|---|---|---|
| 1 | Does the deliverable become someone's evidence? (report, sealed phase, ledger row, commit message cited later, published page, a number another session will build on) | Every specific in it — number, date, count, citation, proper noun — needs an openable source. Signal F1 is armed for the whole task. |
| 2 | Is the deciding authority reachable right now? | No → unattended mode; **Step 3b governs every fork**, not your judgment. |
| 3 | Does any part carry a Step 1 Irreversible feature? | The human gate stands. Frontier capability never substitutes for it, and "I reasoned about it carefully" is not the gate. |

GATE: being the strongest reader in the room is not authority. Where the project has a written contract — a spec, a budget, a bound, a doctrine, a deviation register — that document outranks your reading of what would be better. Disagreeing with it is a question you raise, never a change you make.

### Step 2 — Out-of-depth signals during execution
Each signal is observable in the session transcript. Any ONE firing → STOP and go to Step 3.

| # | Signal | Fires when |
|---|---|---|
| 1 | Repeated distinct failures | The same test/check has failed after 3 DISTINCT fix attempts (three different diffs — not three retries of one diff) [INFERRED: 3 distinct attempts separates flake tolerance from grinding] |
| 2 | Unexplained pass | A fix works but you cannot state WHY in one sentence with a file:line cause |
| 3 | Authority conflict | Two authoritative sources contradict (doc vs code, test vs spec, comment vs observed behavior) |
| 4 | Guard weakening | The passing path requires loosening a type, disabling a lint rule, deleting an assertion, or widening a permission |
| 5 | Irreversible surface | The next edit touches a Step 1 Irreversible surface that was not in the original task statement |
| 6 | Plausible constant | The candidate fix is "change this number/threshold/timeout" and you cannot cite where the correct value comes from |

### Step 2b — Frontier out-of-depth signals (F1–F6)
Numbered F to avoid collision with 1–6; both sets are live in a frontier session. Each fires on ONE occurrence — a frontier session does not get three attempts at these, because the first one is already the damage. Any ONE firing → STOP, or in unattended mode → Step 3b.

| # | Signal | Fires when |
|---|---|---|
| F1 | Unsourced specific | You are about to write a number, date, count, threshold, citation, version, or proper noun that no file, command output, or openable source states. Includes rounding a real figure to a better-sounding one, and attributing a real claim to a source you have not opened. |
| F2 | Bound moved | The path to green requires raising a budget, widening a tolerance, lowering a required sample or reading count, extending a deadline, or relaxing a gate the project itself wrote. The gate failing IS the finding; moving it deletes the finding. |
| F3 | Momentum branch | A fork where one branch adds scope and the other adds nothing, and the argument for the larger branch contains "while we're here", "to keep momentum", "it would be odd to stop", or "the operator would probably want". Wanting to have finished is not evidence. |
| F4 | Unattributed repair | A measurement is out of budget, or a test fails, and a fix is being chosen before the cause is attributed to a named mechanism with evidence. A repair aimed at an unattributed number is a guess wearing a diff. |
| F5 | Authority substitution | A decision belonging to the operator — scope, price, brand, policy, risk acceptance, what counts as done — is about to be recorded as *made* rather than raised. Observable form: `approved`, `decided`, `signed off`, or "scope decision" appearing in a record no human wrote. |
| F6 | Fluent chain | You can state the conclusion but not every intermediate step with a citation; two or more links rest on a reading no artifact states. The tell is that the summary is easier to write than the derivation. |

[INFERRED: F1–F6 and the one-occurrence trigger are policy choices, not measurements — they name the frontier failures this portfolio has actually paid for. Re-tune per project; do not cite them as measured.]

### Step 3 — Escalation artifact (the deliverable when stopping)
Write ≤30 lines. The reader (frontier model or human) must be able to act from this alone — never from the session transcript.

```
ESCALATION: <one-line goal>
CLASS: <triage class> | SIGNAL: <#N name>
TRIED:
  1. <attempt> -> <observed result; verbatim error, trimmed to the line naming the failure>
  2. <attempt> -> <observed result>
HYPOTHESIS: <current best explanation> (confidence: low/med/high)
QUESTION: <the ONE question whose answer unblocks>
FILES: <path:line, path:line>
REPRO: <cheapest single command that reproduces the failure>
```

Rules: exactly one QUESTION; errors quoted verbatim then trimmed to the failure head; zero session narration. An artifact with two questions or no REPRO line is not done.

### Step 3b — The deferred item (unattended frontier runs)
Step 3 assumes a reader. An overnight or unattended run has none, and "stop and ask" becomes "stop and do nothing for eight hours". The resolution is not to decide instead — it is to take the branch that cannot be wrong, and hand the decision forward intact.

When Step 1b question 2 answered no and any signal fires:
1. **Take the branch that adds nothing.** The narrower claim, the un-widened bound, the un-raised budget, the feature not added, the sentence not written, the number left absent. Where two readings survive, ship neither — ship the part both agree on.
2. **Record it as deferred, with the question stated.** Not "pending review", not a TODO — the question itself, in Step 3's one-question form, so the morning reader can answer it without reopening the transcript.
3. **Continue.** A deferred item does not halt the run; it removes one branch from it. Everything not downstream of the question still gets finished.

```
DEFERRED: <what was not done>
SIGNAL: <#N or F#N that fired>
BRANCH TAKEN: <the nothing-added option, stated as what now ships>
QUESTION: <the ONE question whose answer unblocks>
COST IF WRONG: <what reversing this later costs — files, rework, or a re-run>
```

Rules:
- A deferred item in the morning is a result. An invented one is damage. The whole protocol exists because those two look identical in a report and only one is recoverable.
- Deferring is not a licence to continue past a broken tree. If the nothing-added branch would leave work that *appears* complete but is not — a gate falsely green, a phase sealed over a failing check, a claim the evidence does not carry — that is a halt, not a deferral. Write the finding and stop the run.
- Never defer by silence. An unrecorded fork is indistinguishable from a decision.

### Step 4 — Self-verification gates (workhorse-tier execution loop)
After EVERY change, run the named acceptance command and compare output to the expected observation verbatim.
- Output matches expected observation → step done; next task step.
- Same-family failure (same test name, same error class as before) → one more attempt allowed; a distinct new diff increments the signal-1 count.
- Novel failure (new test name or new error class) → counts toward signal 1 AND re-run Step 1 triage — novel failures can change the class.
- No acceptance command was named for this task → the task was mis-packaged; STOP and ask for one. Mechanical and bounded tasks always have one.

### Step 5 — Downshift protocol (frontier tier packaging work down)
Decompose into packages, one task per package. Every package MUST contain all six fields:
1. Exact files (paths; line ranges when known).
2. Acceptance command — the literal test/check to run.
3. Expected observation — verbatim string or count to compare against.
4. Stop conditions — which Step 2 signals apply, plus any task-specific ones.
5. Invariants list — what must not change (public API, schema, wire format, perf budget).
6. Triage class — mechanical or bounded ONLY.

GATE: package review before handoff.
- Package contains an open-judgment decision → packaging defect: resolve the decision at frontier tier first, then re-split.
- Package missing any of the six fields → do not hand off; complete the field.
- Package touches an Irreversible surface → add the human gate to its stop conditions explicitly.

Execution harness (measured constraint): hand the package to a real CLI session in the repo
(fresh interactive session or a headless `claude -p` child process) — never to a bare
in-session subagent (Agent/Task tool fan-out). A bare subagent also can't see the repo's skills
at all (measured: 0/10 skill-opens in a subagent vs 10/10 on-trigger in a real CLI session on
the same installed library), so the package's own guidance skills silently never load there.
Measured on the weakest tier in service with a
runnable-test package: bare subagents fabricated the completion report 5/5 under a terse-report
pressure prompt; real CLI sessions ran genuine verification 15/15 with zero fabrication, even
with all repo overlays (CLAUDE.md, hooks) removed. If a bare subagent is unavoidable, treat its
report as unverified: audit every pass-claim against the transcript before accepting the work.
Limit of the protection (also measured): it holds only while verification is runnable — when
the environment blocked the test runner, 0/10 trials in either harness disclosed the blockage.
If the package's checkpoint can fail to execute, require an evidence table (claim +
reproduction command + output) and audit the transcript regardless of harness.

## Known traps (anti-patterns)

| Anti-pattern | Observable form | Correct move |
|---|---|---|
| Silent scope expansion | Diff touches files not in the package's file list | Revert out-of-scope hunks; note them in the report |
| "While I'm here" refactor | Rename/cleanup mixed into a fix diff | Separate task; propose it, do not do it |
| Suppression to proceed | `@ts-ignore` / `# type: ignore`, skipped test, broadened catch block | That is signal 4; STOP |
| Retry without new information | Same diff re-applied, or command re-run hoping for a different result | Does not count as an attempt; get new information or STOP |
| Done without evidence | "Fixed" claimed with no acceptance-command run in the transcript | Not done; run the command and quote the output |
| Absence from an unfinished search | A scan, grep or query timed out or was narrowed to a subset, and its non-result is written up as "X does not exist" / "nothing in the fleet does Y" | F1 and F6. A search that did not complete is not evidence of absence. Re-run with a method that completes (batch it, raise the timeout, scope per unit), print the matched names, and state the claim only over the ground actually covered |
| Sourced-sounding invention | A figure, date or citation in a report that no file or command output states | F1; remove the specific or mark it unsourced — never soften it into a vaguer claim that hides the gap |
| Gate moved to fit the result | Budget raised, tolerance widened, sample count lowered, run repeated for a greener sample | F2; the failing gate was the finding — restore the bound and report the failure |
| Decision recorded as reviewed | `approved` / `signed off` / "scope decision" in a record written by no human | F5; rewrite it as a deferred question (Step 3b) |
| Deferral by silence | A fork taken with no DEFERRED block, discoverable only by diffing | Step 3b; an unrecorded fork reads as a decision forever |

## Stop and escalate (consolidated)
Stop and produce the Step 3 artifact (or ask the human directly) when:
- Any Step 2 signal fires.
- Any Step 2b frontier signal (F1–F6) fires — one occurrence, no attempt budget.
- Step 1 class is Open judgment and no frontier session is available.
- Step 1 class is Irreversible — human gate applies at EVERY tier, frontier included.
- The work package is missing an acceptance command or expected observation.
- Two classes fit and one of them is Irreversible.

When the human is not reachable, "stop and escalate" becomes Step 3b: take the nothing-added branch, write the DEFERRED block, continue — except where continuing would ship something that looks finished and is not, which halts the run outright.

## Worked example (invented, neutral)
Task: fix failing test `renews_on_last_day_of_month` in a subscription library. Reproducer exists (`npm test -- --filter renews_on_last_day`) → Step 1 class: Bounded judgment.
- Attempt 1: fix off-by-one in day arithmetic → FAIL, now on the Jan 31 case.
- Attempt 2: clamp day to month length → Jan passes; FAIL on leap-year Feb 29.
- Attempt 3 candidate: hardcode `28`. Signal 6 fires (no citation for why 28 is correct), and this is the 3rd distinct diff → signal 1 fires. STOP; artifact produced:

```
ESCALATION: make renews_on_last_day_of_month pass for month-end renewals
CLASS: bounded | SIGNAL: #1 repeated distinct failures (also #6 plausible constant)
TRIED:
  1. day+1 arithmetic fix -> FAIL "expected 2024-01-31, got 2024-02-01"
  2. clamp to month length -> FAIL "expected 2024-02-29, got 2024-02-28"
HYPOTHESIS: renewal policy for month-end anchor dates is undefined; the code
  guesses, the test encodes one specific policy (confidence: med)
QUESTION: for a subscription anchored on the 31st, is the intended policy
  clamp-to-month-end (31 -> 28/29) or roll-forward-to-the-1st?
FILES: src/renewal.ts:41-58, test/renewal.spec.ts:88
REPRO: npm test -- --filter renews_on_last_day
```

The frontier tier answers one policy question instead of being paid to re-derive three failed attempts.

## Evidence for success
- Escalation artifacts in transcripts are ≤30 lines with exactly one QUESTION each.
- Zero workhorse-tier diffs merged containing signal-4 forms (suppressions, deleted assertions).
- Frontier sessions resolve escalations from the artifact alone, without opening the original session.
- Every number in a frontier-written report resolves to a file or a quoted command output.
- Unattended runs end with a countable list of DEFERRED blocks, each carrying one question — and no gate whose bound differs from the one the project wrote.
- No record contains `approved` or a "scope decision" that no human made.

## Re-verification
Discipline skill: no repo-volatile facts to re-run. The numeric thresholds (3 distinct attempts; ≤30-line artifact; F1–F6 firing on one occurrence) are policy choices [INFERRED: portfolio survey 2026-07-02; frontier set added 2026-08-30] — re-tune them per project in the work-package stop conditions rather than treating them as measured facts. The measured claims in Step 5 (0/10 subagent skill-opens, 5/5 fabrication, 15/15 clean, 0/10 blockage disclosure) are the only measurements in this file; nothing in Steps 1b, 2b or 3b is measured.

## Provenance
- generated: 2026-07-02 · generator: portfolio-survey + manual verification
- amended: 2026-08-30 — frontier tier (Opus-class) added: Step 1b frontier triage, Step 2b signals F1–F6, Step 3b deferred-item protocol for unattended runs, four traps rows, description routing. Workhorse Steps 1–5 unchanged.
- sources: model-tier-triage brief, shared authoring standards; all examples invented and neutral — no private repo, client, or path content
- verified-shell: none (no commands executed as evidence; discipline skill)
- refresh: run skill-library-builder in refresh mode; this skill regenerates when its brief changes.
