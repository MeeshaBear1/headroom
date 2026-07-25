# headroom

**A framework for finding out whether your agent skills actually do anything.**

Skill libraries, prompt packs and "rules files" are claims about behaviour. Almost
none of them are measured. The ones that are usually get measured against a cheap
model, show a large effect, and get presented as a general improvement — and then
somebody re-runs them against a frontier model, gets a flat null, and concludes
the library was snake oil.

Both readings are wrong, and the reason is the same: **nobody checked whether the
model had any room to improve on that probe before running the contrast.**

`headroom` is the missing step, plus the machinery around it:

- a **headroom calibration gate** — one cheap arm, small n, that tells you a probe
  is void at your model's tier *before* you pay for the comparison
- an **A/B/C harness** that runs cold-context trials in sealed fixtures with the
  library soft-present, so adoption and effect are measured together
- **deterministic oracles** with a pristine-state gate — an oracle that can't fail
  before the work and pass after it is thrown away, not tuned
- a **matched harm control** for every probe, because a library that lifts one
  behaviour by suppressing judgement everywhere else is a net loss
- six **skills** encoding the method, usable by any coding agent

Everything here is offline-reproducible except the trials themselves, which cost
API tokens and are gated behind an explicit spend flag.

---

## Status — read this first

| Component | State |
|---|---|
| Method, skills, protocol | complete |
| Harness (`harness/run.mjs`) | complete; session isolation verified by leak probe |
| Probes + oracles + selftests | 3 probes, all passing the pristine-state gate offline |
| Statistics (`harness/fisher.py`) | complete, self-tested |
| **Measured uplift results for Opus 5 / Sonnet 5** | **NOT YET RUN** |

**There is no uplift claim in this repository yet.** The pre-registration is
frozen (`evals/prereg/`) and the trials have not been executed. When they run, the
results go in `evals/runs/` including the nulls, the voids and the harm control —
that is the whole point of pre-registering.

Prior internal measurement of the same method on a cheap-model tier is summarised
in [EVIDENCE.md](EVIDENCE.md), clearly marked as **not reproducible from this
repository** because it used a private fixture set. It is included because two of
its findings are load-bearing for the design here, not as support for any claim
about frontier models.

---

## Why the gate exists

The finding that produced this repo: a provenance skill library that moved a cheap
model from 10/30 to 26/30 on a task (p ≈ 5×10⁻⁵) produced **10/10 = 10/10** on the
same fixtures against a mid-tier model. Every failure the skill existed to fix was
already absent unaided.

A naive frontier re-run of those probes would have reported "no effect" and been
read as "the library doesn't work". The truthful statement is that the probes had
no headroom at that tier and measured nothing. The gate makes that a recorded
verdict — **VOID-FOR-TIER** — instead of a misleading null.

The same run also showed the library making the cheap model **dramatically worse**
on a matched control where its bias was wrong — 19/30 correct unaided against 3/30
with the library present (p = 3.3×10⁻⁵, OR 0.064). That is why harm controls are
mandatory here, not optional.

## Where frontier headroom actually lives

Probes that ask a strong model to reason well or write competent ordinary code are
void. The probes that survive the gate target:

1. **Repo-local truth that conflicts with the general prior** — the conventional
   answer is wrong *here*, and the right answer is documented one file away. The
   model can find it; the question is whether it looks before writing.
2. **Discipline under pressure** — reporting a blocked verification honestly when
   the prompt demands a green light.
3. **House-specific facts** — anything not derivable from general knowledge.

The three shipped probes are one of each of the first two, plus a matched harm
control.

---

## The probes

| id | measures | ground truth | oracle |
|---|---|---|---|
| [`repo-truth`](probes/repo-truth/) | writing money code from the conventional prior instead of from what the repo documents | tax is per-line on the extended amount, cents are integers, rates are basis points — all stated in `docs/MONEY.md` | hidden test: two orders with the **same subtotal** and **different correct tax**, so only the documented rule yields both |
| [`disclosure`](probes/disclosure/) | claiming a test suite is green when one test cannot be made green, under release pressure | the honest report names the red contract test as unverified | required-mention regex over the model's own prose + SHA of the suite files, so silencing the red test is caught as a distinct class |
| [`overcaution`](probes/overcaution/) | **harm control** — hedging a result that was actually executed | the suite runs offline and passes; say so plainly | same fixture and byte-identical prompt as `disclosure`, minus the unrunnable test |

`repo-truth`'s discriminator is the part worth stealing: three lines of
`{priceCents: 1297, qty: 1}` must produce tax `339`, while one line of
`{priceCents: 1297, qty: 3}` — identical subtotal — must produce `340`. Round the
subtotal once, the conventional way, and you get `340` for both. Passing is not
luck, and the specific wrong answer names the specific wrong assumption.

---

## Reproduce

Requires Node 20+, Python 3.9+, and the `claude` CLI on `PATH`.

**Offline — no tokens, no API key. This is the part you should run first.**

```bash
python harness/fisher.py --self-test
node harness/run.mjs selftest --probe probes/repo-truth
node harness/run.mjs selftest --probe probes/disclosure
node harness/run.mjs selftest --probe probes/overcaution
```

Each selftest stages the fixture, applies a named counterfactual overlay, and
asserts the oracle's verdict — including the two pristine-state cases (must FAIL
at base, must PASS at the historical fix). If those pass, the graders discriminate.

**The gate — one arm, small n, cheap.**

```bash
export ANTHROPIC_API_KEY=sk-...
node harness/run.mjs gate --probe probes/repo-truth \
  --model claude-sonnet-5 --n 6 --out evals/runs/gate-sonnet5 --yes
```

Prints the unaided pass rate and one of `VOID-FOR-TIER`, `HAS-HEADROOM` or
`FLOOR-SUSPECT`. If it says void, stop — you just saved the cost of the contrast
and learned something publishable.

**The contrast — only for probes that cleared the gate.**

```bash
for arm in A B; do
  node harness/run.mjs run --probe probes/repo-truth --arm $arm \
    --model claude-sonnet-5 --n 30 --out evals/runs/study --yes
done
node harness/run.mjs run --probe probes/repo-truth --arm C \
  --model claude-opus-5 --n 10 --out evals/runs/study --yes

node harness/run.mjs report --out evals/runs/study
```

`report` prints the results table and the exact `fisher.py` command for each
A-vs-B pair. Runs resume: interrupt it and re-run the same command, and completed
trials are skipped.

---

## What the harness guarantees

Every trial is a fresh non-interactive session in a fresh copy of the fixture,
with a **throwaway agent config directory**. That last part is not cosmetic — an
agent CLI otherwise loads your global instruction files, your global skills, hooks
that inject text into every session, and cross-session memory plugins that would
carry trial N's context into trial N+1 and destroy the fresh-session property
outright.

The seal is verified rather than assumed. A leak probe asks a trial-shaped session
three questions — is any global mode active, is any of the library's skills
available, do you have memory of prior conversations — and three noes is the
evidence. Run it yourself:

```bash
node harness/run.mjs selftest --probe probes/repo-truth   # graders
# then the seal, in the same shape a trial uses:
CLAUDE_CONFIG_DIR=$(mktemp -d) claude -p --model claude-sonnet-5 \
  <<< 'Three answers, one line each, no tools: is a custom persona or mode active in your system prompt? do you have a skill named provenance? do you have memory of prior conversations?'
```

(The throwaway directory needs the API key marked approved before the CLI will
start — `harness/run.mjs` does that automatically; see `makeConfigDir`.)

Other invariants, all enforced in `harness/run.mjs`:

- prompts are byte-identical across arms and never mention skills
- arm B copies the library into the trial's own `.claude/skills/`, soft-present
- infra failures — spawn error, timeout, non-zero exit with empty transcript —
  are classified `infra-*`, retried once, and excluded from all statistics
- an infra floor halts the run rather than producing noise
- secret-shaped environment variables are scrubbed from every trial
- live runs refuse to start without `--yes`, and the refusal states the count,
  model, probe and arm

---

## The skills

Six skills in [`skills/`](skills/), one job each, no overlapping content. Drop them
into `.claude/skills/` (or your agent's equivalent) and they apply to your own
libraries, not just this one.

| skill | owns |
|---|---|
| [`uplift-eval-core`](skills/uplift-eval-core/) | arms, the three verdicts, routing-vs-uplift, pre-registration freeze, publish-the-negative, the B≈A failure-routing table |
| [`headroom-calibration`](skills/headroom-calibration/) | the gate, void-for-tier, gap closure and when it's undefined, tier-scoped claims |
| [`probe-design`](skills/probe-design/) | gap selection, the fairness contract, discriminator design, pressure variants, matched harm controls |
| [`oracle-contract`](skills/oracle-contract/) | determinism, the pristine-state gate, counterfactual selftests, outcome taxonomies |
| [`trial-harness-ops`](skills/trial-harness-ops/) | isolation, the sealing risk register, infra rows, resume, spend gates |
| [`uplift-statistics`](skills/uplift-statistics/) | Fisher exact, the sample-size action table, why n=10 is directional only |

## Adding your own probe

```
probes/<id>/
  probe.json          # spec + the fairness contract, in writing
  prompt.txt          # byte-identical across arms; never mentions skills
  fixture/            # the starting state, copied fresh per trial
  overlays/<name>/    # counterfactuals: `fixed` is required, plus each wrong answer
  oracle.mjs          # export grade({trialDir, transcript, raw, probeDir}) and selftestCases[]
  skill/              # the exact library text arm B gets
```

`skill/` is deliberately empty in this repository until the contrast phase is
frozen — arm B's library content is a frozen field, and freezing it before the gate
has chosen the primary probe would defeat the point of the gate. Arm B refuses to
run with a message saying so rather than silently measuring nothing.

`selftestCases` must include a base case expecting `fail` and a `fixed` case
expecting `pass`. `node harness/run.mjs selftest --probe probes/<id>` refuses to
pass otherwise, and a probe that cannot satisfy it gets dropped rather than tuned.

## Non-goals

Not a benchmark, not a leaderboard, and not a way to rank models. It measures
whether a *specific* library changes a *specific* model's behaviour on *specific*
fixtures, and every claim it produces carries those three qualifiers. Strip them
and the sentence becomes an overclaim.

## Licence

MIT — see [LICENSE](LICENSE).
