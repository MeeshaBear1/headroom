# Run record — rule-drift contrast (Sonnet 5, Opus 5 ceiling)

Pre-registration: [`evals/prereg/2026-07-24-contrast-rule-drift.md`](../prereg/2026-07-24-contrast-rule-drift.md)
(frozen before trial 1 of this phase).
Date run: 2026-07-24. Trials: 130. Actual spend: **$32.10**. Infra rows: **0**.

## Verdict

**UPLIFT, confirmed, on the primary probe. NO HARM, confirmed, on the matched
control.** This is the first uplift claim published from this repository.

| probe | arm | model | n | pass | rate | skill fired |
|---|---|---|---|---|---|---|
| `rule-drift` | A | `claude-sonnet-5` | 30 | 11 | 37% | — |
| `rule-drift` | B | `claude-sonnet-5` | 30 | 30 | 100% | 30/30 |
| `rule-drift` | C | `claude-opus-5` | 10 | 10 | 100% | — |
| `convention-override` (harm control) | A | `claude-sonnet-5` | 30 | 30 | 100% | — |
| `convention-override` (harm control) | B | `claude-sonnet-5` | 30 | 30 | 100% | 30/30 |

`rule-drift` A vs B: `python harness/fisher.py 30 0 11 19` → **p = 5.34×10⁻⁸**.
Gap closure `(B-A)/(C-A)` = **100%** — arm B matches the Opus 5 ceiling exactly.

`convention-override` A vs B: `python harness/fisher.py 30 0 30 0` → **p = 1.0**.
No difference. The skill fired in all 30 trials and changed nothing.

## What the skill actually did

The `rule-consistency` skill (frozen at sha256:`07550bba3d88fdfb`, identical
copy in both probes) does not teach "audit before mutation." It teaches:
read the rationale, verify against the specific edge case the convention
names, apply it independently per instance. The transcripts show it
generalizing correctly in **both directions on the same wording**:

`rule-drift` (documented rule: audit before the mutation) —

> "All six ops functions log the audit entry even when the mutation throws,
> confirming the convention holds for the exact scenario it's meant to
> protect."

`convention-override` (documented rule: audit only after a confirmed
success — the inverted fixture) —

> "Confirmed: a failed mutation produces no audit entry, and a successful
> one logs correctly."

Same skill, same wording style, opposite correct behavior, because the
skill's instruction is "verify against what this repo's doc says and the
scenario it protects," not "always do X." That is what a matched harm
control is for: a library that lifted `rule-drift` by teaching a fixed
answer would have broken `convention-override`. This one didn't.

## Relationship to the pilot

The pre-registered arm A landed at 37% (11/30), not the unregistered pilot's
10% (1/10). Both are disclosed; neither is hidden or averaged away. n = 10 is
directional only (see `uplift-statistics` and the 2026-07-24 gate's own
calibration note: the same historical effect read p ≈ 0.18 at n = 10 and
p ≈ 4.9×10⁻⁵ at n = 30) — a 10-trial pilot landing a binomial draw from a
~30–40% true rate at 1/10 is unremarkable variance, not a sign anything
changed between runs. The frozen n = 30 number is the one the p-value and the
gap-closure figure above are computed from; the pilot number is not used in
any statistic. If anything, 37% is the more conservative — and more
credible — starting point, which makes the 100% in arm B a larger, not
smaller, confirmed effect than the pilot suggested.

## What this does and does not show

**Shows:** on this one fixture, `claude-sonnet-5` complies with a documented,
non-obvious ordering convention 37% of the time unaided, and 100% of the
time with `rule-consistency` present — a jump that closes the entire
measured gap to an unaided `claude-opus-5` ceiling, at p = 5.34×10⁻⁸. On the
matched fixture where the convention is inverted, the same skill produces no
measurable change in either direction (p = 1.0) — evidence against, not just
absence of evidence for, a harm mode from this specific library.

**Does not show:** that this generalizes beyond this fixture, this domain
(audit-logging ordering), or this exact skill wording. One probe pair,
30 trials a side, one model tier as subject.

**Important scope note, stated plainly:** `rule-consistency` is a **new**
skill, authored in this repository specifically to close the gap
`rule-drift` measures — it is not one of the fleet's pre-existing skill
suites. This run demonstrates the *framework* can find real, frontier-tier
headroom and validate a real, judgment-preserving uplift against a matched
harm control, cheaply (a $12.46 gate plus roughly $35 in pilot and contrast
spend here) and honestly (two oracle corrections logged, one pilot-to-freeze
discrepancy disclosed). It is not, by itself, a claim about any library that
predates this run.

## Environment

`claude` CLI 2.1.206 · Node v24.16.0 · Windows 11 win32 · `acceptEdits` ·
allowed tools `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` · max turns 80 ·
timeout 900 s · concurrency 6 · throwaway `CLAUDE_CONFIG_DIR` per trial ·
models `claude-sonnet-5` (subject), `claude-opus-5` (ceiling).

## Deviations from the pre-registration

Recorded in [the pre-registration's deviation log](../prereg/2026-07-24-contrast-rule-drift.md#deviations-from-this-pre-registration):
a post-hoc, read-only bug fix in `report()`'s console output, made after all
130 trials had already been graded and written — confined to a display
label, with no path into trial execution or grading.
