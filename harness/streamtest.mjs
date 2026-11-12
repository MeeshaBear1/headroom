#!/usr/bin/env node
// Self-test for stream mode. No model is called and nothing is spent.
//
//   node harness/streamtest.mjs
//
// What it holds:
//   the schedule is the same bytes across two processes, and visits every task
//     `supply` times with test seeds no stream visit used;
//   every task generator on disk clears the pristine-state gate over several seeds;
//   three fake learners, run through the same door the model uses, land where
//     they must: one that keeps nothing at L = 0, one with perfect memory at
//     L = 1, one that replays stale state at L < 0;
//   no alias reaches the prompt unless it is asked for;
//   a voided visit leaves nothing in the carried state, a state edited between
//     visits stops the run, and a stopped run resumes;
//   the metrics are the same bytes under different PYTHONHASHSEED values.

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeSchedule, serialise, taskSpec } from "./schedule.mjs";
import { runArm, gate } from "./stream.mjs";
import { trialsRoot } from "./seal.mjs";
import { answer } from "./selftest/stream.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PY = process.platform === "win32" ? "python" : "python3";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "headroom-streamtest-"));
// Working directories stay under the trials root, outside the home tree, where
// the ancestor-memory refusal allows them. One folder, removed at the end.
process.env.HEADROOM_TRIALS_ROOT = path.join(trialsRoot(), `streamtest-${process.pid}`);

let n = 0;
const ok = (name, detail = "") => console.log(`ok  ${String(++n).padStart(2)}  ${name}${detail ? `   ${detail}` : ""}`);
const quiet = () => {};
const syn = (ids) => ids.map((id) => ({ id, dir: "harness/selftest" }));

// ---------------------------------------------------------------- schedule

const args = [path.join(HERE, "schedule.mjs"), "--tasks", "a=harness/selftest,b=harness/selftest,c=harness/selftest",
  "--held", "h=harness/selftest", "--seed", "7", "--pilot", "1"];
const one = execFileSync(process.execPath, args), two = execFileSync(process.execPath, args);
assert.ok(one.equals(two) && one.length > 200, "schedule differs between two processes");
assert.equal(one.toString(), serialise(makeSchedule({ seed: 7, pilot: 1, tasks: syn(["a", "b", "c"]), held: syn(["h"]) })));
assert.notEqual(one.toString(), serialise(makeSchedule({ seed: 8, pilot: 1, tasks: syn(["a", "b", "c"]), held: syn(["h"]) })));
ok("schedule is the same bytes across two processes and in-process; another seed differs");

// The paper's stream at its own parameters: 25 tasks, eight visits each.
const big = makeSchedule({ seed: 0, tasks: syn(Array.from({ length: 25 }, (_, i) => `t${i}`)), held: syn(["h0", "h1"]) });
const byTask = new Map();
for (const s of big.stream) byTask.set(s.task, [...(byTask.get(s.task) ?? []), s]);
assert.equal(big.stream.length, 200);
big.stream.forEach((s, i) => assert.equal(s.round, i));
for (const [id, visits] of byTask) {
  assert.equal(visits.length, 8, `${id} is not visited eight times`);
  visits.forEach((v, k) => assert.equal(v.exposure, k));
  const used = new Set(visits.map((v) => v.instanceSeed));
  assert.equal(used.size, 8, `${id} is served one instance twice`);
  for (const t of big.seen.filter((s) => s.task === id)) assert.ok(!used.has(t.instanceSeed), "a seen-test seed was served in the stream");
}
assert.equal(big.seen.length, 100);
assert.equal(big.heldout.length, 2);
const gaps = [...byTask.values()].flatMap((v) => v.slice(1).map((x, i) => x.round - v[i].round)).filter((g) => g > 1).sort((x, y) => x - y);
const met = (round) => new Set(big.stream.filter((s) => s.round < round).map((s) => s.task)).size;
ok("default stream: 200 rounds, every task eight times, test seeds unused",
  `met by round 50: ${met(50)}, by 100: ${met(100)}; gap between spells median ${gaps[gaps.length >> 1]}, p90 ${gaps[Math.floor(gaps.length * 0.9)]}, max ${gaps.at(-1)}`);

// ---------------------------------------------------------------- task gates

const onDisk = fs.readdirSync(path.join(ROOT, "probes")).filter((p) => fs.existsSync(path.join(ROOT, "probes", p, "stream.mjs")));
for (const spec of [{ id: "syn", dir: "harness/selftest" }, ...onDisk.map((p) => taskSpec(`probes/${p}`))]) {
  const lines = [];
  const fails = await gate(spec, [0, 1, 2, 3], (l) => lines.push(l));
  assert.equal(fails, 0, `gate failed for ${spec.id}:\n${lines.join("\n")}`);
  ok(`gate ${spec.id}`, "fails at base and at every wrong answer, passes at the fix, four seeds, same bytes twice");
}

// ---------------------------------------------------------------- fake learners

const CAP = 2000, WORK = 1000;
const result = (tokens) => ({
  stdout: JSON.stringify({ type: "result", subtype: "success", num_turns: 1, total_cost_usd: 0,
    usage: { input_tokens: tokens, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } }) + "\n",
  stderr: "", status: 0, timedOut: false, error: null,
});
// A fake learner has the signature of runClaude. It works a job out for WORK
// tokens. `perfect` files the rule and does a returning job for nothing;
// `stale` files its last answer and hands it back when the job returns.
function fake(kind, prompts = []) {
  return async ({ cwd, configDir, prompt }) => {
    prompts.push(prompt);
    const job = JSON.parse(fs.readFileSync(path.join(cwd, "job.json"), "utf8"));
    const file = path.join(configDir, "memory.json");
    const mem = kind !== "nothing" && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
    const known = job.kind in mem, right = String(answer(job));
    fs.writeFileSync(path.join(cwd, "answer.txt"), (known && kind === "stale" ? mem[job.kind] : right) + "\n");
    if (kind !== "nothing" && !known) fs.writeFileSync(file, JSON.stringify({ ...mem, [job.kind]: right }));
    return result(!known ? WORK : kind === "perfect" ? 0 : WORK / 10);
  };
}

const schedule = makeSchedule({ seed: 3, nc: 2, spell: 2, rest: 3, arrival: 2, supply: 4, seen: 1,
  tasks: syn(["w", "x", "y", "z"]), held: syn(["p", "q"]) });
const metrics = (out, env = {}) => spawnSync(PY, [path.join(HERE, "stream_metrics.py"), out, "--cap", String(CAP), "--resamples", "200", "--json"],
  { env: { ...process.env, ...env }, encoding: "utf8" });

const L = {};
for (const kind of ["nothing", "perfect", "stale"]) {
  const out = path.join(tmp, kind), prompts = [];
  await runArm({ schedule, arm: "reset", model: "fake", out, learner: fake(kind, prompts), concurrency: 4, log: quiet });
  await runArm({ schedule, arm: "carried", model: "fake", out, learner: fake(kind, prompts), log: quiet });
  assert.equal(fs.readdirSync(path.join(out, "rows")).length, 2 * (16 + 4 + 2));
  assert.ok(prompts.every((p) => !/job-[0-9a-f]{6}/.test(p)), "an alias reached a prompt that did not ask for one");
  const run = metrics(out);
  assert.equal(run.status, 0, run.stderr);
  const m = JSON.parse(run.stdout);
  L[kind] = m.L.value;
  if (kind === "nothing") { assert.equal(m.L.value, 0); assert.equal(m.S_seen.value, 0); }
  if (kind === "perfect") {
    assert.equal(m.L.value, 1);
    assert.equal(m.S_seen.value, 1, "perfect memory must do every seen-test job for nothing");
    assert.equal(m.S_heldout.value, 0, "nothing kept can help a job never met");
    assert.equal(m.arms.carried.stream.P, 1);
  }
  if (kind === "stale") { assert.ok(m.L.value < 0); assert.ok(m.arms.carried.stream.P < 1); assert.ok(m.L.ci95[1] < 0); }
  ok(`fake learner, ${kind === "nothing" ? "keeps nothing" : kind === "perfect" ? "perfect memory" : "stale state"}`,
    `L = ${m.L.value}   S seen = ${m.S_seen.value}   S held-out = ${m.S_heldout.value}`);

  if (kind === "stale") {
    const base = metrics(out, { PYTHONHASHSEED: "0" }).stdout;
    for (const seed of ["1", "12345"]) assert.equal(metrics(out, { PYTHONHASHSEED: seed }).stdout, base, `metrics differ under PYTHONHASHSEED=${seed}`);
    assert.ok(base.length > 500);
    const text = spawnSync(PY, [path.join(HERE, "stream_metrics.py"), out, "--cap", String(CAP), "--resamples", "50"], { encoding: "utf8" });
    assert.equal(text.status, 0, text.stderr);
    assert.match(text.stdout, /^L\s+-1\.000/m, "the plain report did not print L");
    ok("metrics are the same bytes under PYTHONHASHSEED 0, 1 and 12345");
  }
}

// ---------------------------------------------------------------- alias

{
  const prompts = [];
  await runArm({ schedule, arm: "reset", model: "fake", out: path.join(tmp, "alias"), phases: ["stream"], alias: true,
    learner: fake("nothing", prompts), log: quiet });
  const tags = new Map();
  schedule.stream.forEach((s, i) => {
    const tag = /^Job reference: (job-[0-9a-f]{6})\n\n/.exec(prompts[i])?.[1];
    assert.ok(tag, "--alias did not put the job reference first in the prompt");
    assert.equal(tags.get(s.task) ?? tag, tag, "one job, two aliases");
    tags.set(s.task, tag);
  });
  assert.equal(new Set(tags.values()).size, 4);
  ok("alias is absent by default; with the flag each job carries one stable reference");
}

// ---------------------------------------------------------------- carried state

{
  const out = path.join(tmp, "state"), cfg = path.join(out, "cfg", "carried-w0");
  const inner = fake("perfect");
  let calls = 0;
  const flaky = async (a) => {
    calls++;
    if (calls === 1) { fs.writeFileSync(path.join(a.configDir, "junk.txt"), "left by a voided visit"); return { stdout: "", stderr: "", status: 1, timedOut: false, error: null }; }
    if (calls === 4) throw new Error("halt");
    return inner(a);
  };
  const go = (learner) => runArm({ schedule, arm: "carried", model: "fake", out, phases: ["stream"], learner, log: quiet });
  await assert.rejects(go(flaky), /halt/);
  assert.equal(fs.readdirSync(path.join(out, "rows")).length, 2);
  assert.ok(!fs.existsSync(path.join(cfg, "junk.txt")), "a voided visit left a file in the carried state");
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, "rows", "carried-stream-000.json"), "utf8")).infra, false);
  fs.writeFileSync(path.join(cfg, "tamper.txt"), "edited between visits");
  await assert.rejects(go(inner), /changed outside a visit/);
  fs.rmSync(path.join(cfg, "tamper.txt"));
  await go(inner);
  assert.equal(fs.readdirSync(path.join(out, "rows")).length, 16);
  const log = fs.readFileSync(path.join(out, "state-carried.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(log.length, 17);
  assert.ok(log.some((e) => e.changed.includes("memory.json")), "the state log did not record what a visit wrote");
  await assert.rejects(runArm({ schedule, arm: "reset", model: "fake", out, setup: path.join(ROOT, "evals", "prereg"), learner: inner, log: quiet }), /doctrine files/);
  ok("a voided visit leaves nothing behind, an edited state stops the run, a stopped run resumes, a snapshot with top-level .md is refused");
}

fs.rmSync(tmp, { recursive: true, force: true });
fs.rmSync(process.env.HEADROOM_TRIALS_ROOT, { recursive: true, force: true });
console.log(`\nstreamtest OK: ${n} checks, no model calls.   L: keeps nothing ${L.nothing}, perfect memory ${L.perfect}, stale state ${L.stale}`);
