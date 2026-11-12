#!/usr/bin/env node
// headroom, stream mode: does a setup get cheaper when the same kind of job
// comes back after a gap?
//
//   node harness/schedule.mjs --tasks <dir,...> --held <dir,...> --seed 0 > schedule.json
//   node harness/stream.mjs gate --task probes/<id> [--seeds 8]
//   node harness/stream.mjs run --schedule schedule.json --arm carried|reset --model <id> \
//        --out <dir> [--setup <dir>] [--memory <dir>] [--plays 4] [--phases stream,seen,heldout] \
//        [--name reset-b] [--alias] [--concurrency 4] --yes
//   python harness/stream_metrics.py <dir> --cap <tokens>
//   node harness/streamtest.mjs                       # the self-test, no model calls
//
// Two arms meet the same schedule. `carried` keeps one sealed config and state
// directory from the first visit to the last. `reset` gets that directory
// rebuilt from the same starting setup before every visit. The difference in
// what the visits cost is what the carried state was worth.
//
// This is a mode beside run.mjs, not a second harness. The model call, the
// infra rule, the seal, the trials root and the ancestor-memory refusal are
// imported from run.mjs and seal.mjs.
//
// A task is a folder with a stream.mjs that exports:
//   generate(seed, dest)  write a fresh fixture into dest; return { prompt, ...answer key }
//   solve(dest, instance) write the reference fix, for the pristine-state gate
//   wrong                 optional { name: (dest, instance) => void }, each must fail
//   check({ trialDir, instance, pristineDir })  ->  { cls: "pass" | "fail-...", notes }
// or a make(id) that returns such an object.

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runClaude, infraVerdict, childEnv, dirSha256 } from "./run.mjs";
import { makeConfigDir, trialsRoot, ancestorMemory } from "./seal.mjs";
import { taskSpec } from "./schedule.mjs";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

// ---------------------------------------------------------------- tasks

export async function loadTask({ id, dir }) {
  const file = path.resolve(ROOT, dir, "stream.mjs");
  if (!fs.existsSync(file)) throw new Error(`no stream.mjs in ${dir}`);
  const mod = await import(pathToFileURL(file).href);
  const task = mod.make ? mod.make(id) : mod;
  for (const k of ["generate", "solve", "check"]) {
    if (typeof task[k] !== "function") throw new Error(`${file} must export ${k}()`);
  }
  return task;
}

function stage(task, seed, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const instance = task.generate(seed, dest);
  if (typeof instance?.prompt !== "string") throw new Error("generate() must return { prompt, ... }");
  return instance;
}

// The oracle runs in its own process. A trial's code is imported to be graded,
// and a visit's working directory is reused, so grading in this process would
// read the previous visit's modules out of the module cache. A fresh process
// also means a trial that hangs or calls process.exit cannot take the run down.
async function checkChild({ task: spec, seed, trial }) {
  const task = await loadTask(spec);
  const pristineDir = fs.mkdtempSync(path.join(os.tmpdir(), "headroom-pristine-"));
  try {
    const instance = stage(task, seed, pristineDir);
    const got = await task.check({ trialDir: path.resolve(trial), instance, pristineDir });
    process.stdout.write("\n" + JSON.stringify({ verdict: got }) + "\n");
  } finally {
    fs.rmSync(pristineDir, { recursive: true, force: true });
  }
}

export function grade(spec, seed, trialDir, timeoutS = 120) {
  return new Promise((resolve) => {
    const env = childEnv("");                     // no operator secrets where trial code runs
    delete env.ANTHROPIC_API_KEY;
    delete env.CLAUDE_CONFIG_DIR;
    const ch = spawn(process.execPath, [SELF, "check", "--task", `${spec.id}=${spec.dir}`, "--seed", String(seed), "--trial", trialDir], { env });
    let out = "", err = "", timedOut = false;
    const t = setTimeout(() => { timedOut = true; ch.kill("SIGKILL"); }, timeoutS * 1000);
    ch.stdout.on("data", (d) => { out += d; });
    ch.stderr.on("data", (d) => { err += d; });
    ch.on("close", () => {
      clearTimeout(t);
      const line = out.trim().split("\n").pop() ?? "";
      try {
        const { verdict } = JSON.parse(line);
        if (typeof verdict?.cls === "string") return resolve(verdict);
      } catch { /* no verdict line */ }
      // Not a pass, and not silently a model failure either: the metrics count
      // these so somebody reads them before trusting a number.
      resolve({ cls: timedOut ? "fail-oracle-timeout" : "fail-oracle-no-verdict", notes: (err || out).trim().slice(-300) });
    });
  });
}

// The pristine-state gate for a generated task, over several seeds: the oracle
// must fail the untouched fixture, fail every named wrong answer, and pass the
// reference fix. Two runs of one seed must be the same bytes, and two seeds
// must not be. A task that cannot clear it is dropped, never tuned.
export async function gate(spec, seeds, log = console.log) {
  const task = await loadTask(spec);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "headroom-gate-"));
  const fresh = (seed, name) => { const d = path.join(tmp, `${seed}-${name}`); return [d, stage(task, seed, d)]; };
  let fails = 0;
  const hashes = new Set();
  const say = (ok, seed, name, detail) => {
    if (!ok) fails++;
    if (!ok || seed === seeds[0]) log(`${ok ? "ok  " : "FAIL"}  ${spec.id.padEnd(18)} seed ${String(seed).padEnd(4)} ${name.padEnd(14)} ${detail}`);
  };
  try {
    for (const seed of seeds) {
      const [a, inst] = fresh(seed, "base");
      const [b, again] = fresh(seed, "again");
      const same = dirSha256(a) === dirSha256(b) && JSON.stringify(inst) === JSON.stringify(again);
      say(same, seed, "same-bytes", same ? "two runs agree" : "two runs of one seed differ");
      hashes.add(dirSha256(a));
      const base = await grade(spec, seed, a);
      say(base.cls !== "pass", seed, "base", `expect=fail got=${base.cls}`);
      for (const [name, apply] of Object.entries(task.wrong ?? {})) {
        const [w, wi] = fresh(seed, `wrong-${name}`);
        apply(w, wi);
        const got = await grade(spec, seed, w);
        say(got.cls !== "pass", seed, name, `expect=fail got=${got.cls}`);
      }
      const [f, fi] = fresh(seed, "fixed");
      task.solve(f, fi);
      const fixed = await grade(spec, seed, f);
      say(fixed.cls === "pass", seed, "fixed", `expect=pass got=${fixed.cls}${fixed.notes ? ` (${fixed.notes})` : ""}`);
    }
    const distinct = hashes.size === seeds.length;
    say(distinct, seeds[0], "fresh", `${hashes.size} distinct fixtures from ${seeds.length} seeds`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return fails;
}

// ---------------------------------------------------------------- state

// path -> sha256 for every file under dir. The carried arm's state is hashed at
// every visit boundary, and the difference between two manifests is the record
// of what a visit left behind.
function manifest(dir) {
  const out = {};
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) return walk(f);
      out[path.relative(dir, f).split(path.sep).join("/")] = sha(fs.readFileSync(f));
    });
  walk(dir);
  return out;
}
const changedPaths = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).sort();

// The CLI keys project memory by the working directory with every character
// that is not a letter or a digit turned into a dash. Read off the folder names
// under ~/.claude/projects on 2026-11-11, not from a live session: the freeze
// asks for one canary session before the stream to confirm the mount is read.
const projectSlug = (cwd) => path.resolve(cwd).replace(/[^A-Za-z0-9]/g, "-");

// Re-assert the seal on a config dir without wiping what the CLI keeps in
// .claude.json. The deny rules are rewritten before every visit, because a
// learner can edit files in its own state directory and the seal is one of them.
function sealConfig(dir) {
  const cj = path.join(dir, ".claude.json");
  const keep = fs.existsSync(cj) ? fs.readFileSync(cj) : null;
  makeConfigDir(dir);
  if (keep) fs.writeFileSync(cj, keep);
}

function copyDir(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

// The starting setup: the snapshot under test copied in, its memory mounted
// where a session in `cwd` will look for it, then the seal on top.
function freshConfig(cfg, cwd, { setup, memory }) {
  fs.rmSync(cfg, { recursive: true, force: true });
  fs.mkdirSync(cfg, { recursive: true });
  if (setup) fs.cpSync(setup, cfg, { recursive: true });
  if (memory) fs.cpSync(memory, path.join(cfg, "projects", projectSlug(cwd), "memory"), { recursive: true });
  sealConfig(cfg);
}

// The void rule in run.mjs matches lines of the operator's top-level doctrine
// files. A snapshot that carries copies of them would void every visit that
// reads its own setup, so such a snapshot is refused before anything is spent.
function checkSetup(setup) {
  if (!setup) return;
  if (!fs.existsSync(setup)) throw new Error(`setup snapshot not found: ${setup}`);
  const md = fs.readdirSync(setup).filter((n) => n.toLowerCase().endsWith(".md"));
  if (md.length) {
    throw new Error(`setup snapshot carries top-level doctrine files (${md.join(", ")}). ` +
      "The seal voids any visit that reads a line of the operator's doctrine and cannot tell a copy from the original. " +
      "Snapshot skills/ and the memory folder only.");
  }
}

// ---------------------------------------------------------------- the run

const PHASES = ["pilot", "stream", "seen", "heldout"];
const pad = (n) => String(n).padStart(3, "0");

export function visitsOf(schedule, phases, plays) {
  const out = [];
  for (const phase of phases) {
    if (phase === "stream") {
      for (const s of schedule.stream) out.push({ phase, slot: s.round, play: 0, ...s, vid: `stream-${pad(s.round)}` });
    } else {
      for (const s of schedule[phase]) {
        for (let play = 0; play < plays; play++) out.push({ phase, play, round: null, exposure: null, ...s, vid: `${phase}-${pad(s.slot)}-p${play}` });
      }
    }
  }
  return out;
}

async function pool(items, n, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(n, items.length)) }, async (_, worker) => {
    while (next < items.length) await fn(items[next++], worker);
  }));
}

// One arm over one schedule. `learner` is the single door to the model: it gets
// what runClaude gets and returns what runClaude returns. The self-test passes
// fake learners through it and spends nothing.
export async function runArm({
  schedule, arm, name = arm, model, out, phases = ["stream", "seen", "heldout"], plays = 1,
  setup = null, memory = null, alias = false, timeoutS = 900, concurrency = 1,
  learner = runClaude, log = console.log,
}) {
  if (!["carried", "reset"].includes(arm)) throw new Error("--arm must be carried or reset");
  for (const ph of phases) if (!PHASES.includes(ph)) throw new Error(`unknown phase ${ph}`);
  if (arm === "carried" && phases.includes("pilot")) throw new Error("the pilot fixes the cap from first exposures: run it in the reset arm");
  checkSetup(setup);
  out = path.resolve(out);
  for (const d of ["rows", "transcripts", "cfg", "trials"]) fs.mkdirSync(path.join(out, d), { recursive: true });

  const specs = new Map([...schedule.tasks, ...schedule.held].map((s) => [s.id, s]));
  const tasks = new Map();
  for (const [id, spec] of specs) tasks.set(id, await loadTask(spec));

  // A visit's working directory says nothing about the arm, the phase or the
  // position in the stream, and has no sibling the learner could read a past
  // visit out of. Worked fixtures are moved out to <out>/trials after grading.
  const runId = sha(`${path.basename(out)}:${name}`).slice(0, 10);
  const cwdOf = (w) => path.join(trialsRoot(), `${runId}-${w}`, "w");
  const cfgOf = (w) => path.join(out, "cfg", `${name}-w${w}`);
  const leak = ancestorMemory(path.dirname(cwdOf(0)));
  if (leak) throw new Error(`trial dir ${cwdOf(0)} sits under a memory file the CLI would load: ${leak} -- set HEADROOM_TRIALS_ROOT outside it`);

  // Shown only on request, and the same in both arms. Theirs shows it on every
  // visit; here, noticing that a job has come back is part of what is measured.
  const aliasOf = (task) => `job-${sha(`${schedule.params.seed}:alias:${task}`).slice(0, 6)}`;

  const rowFile = (v) => path.join(out, "rows", `${name}-${v.vid}.json`);
  const done = (v) => fs.existsSync(rowFile(v));
  let infraRows = 0;

  async function visit(v, w) {
    const tid = `${name}-${v.vid}`;
    const cwd = cwdOf(w);
    const instance = stage(tasks.get(v.task), v.instanceSeed, cwd);
    const prompt = (alias ? `Job reference: ${aliasOf(v.task)}\n\n` : "") + instance.prompt;
    const res = await learner({
      cwd, configDir: cfgOf(w), model, prompt, timeoutS, probeEnv: instance.env,
      visit: { arm, phase: v.phase, task: v.task, instanceSeed: v.instanceSeed },   // for fake learners; runClaude ignores it
    });
    fs.writeFileSync(path.join(out, "transcripts", `${tid}.jsonl`), res.stdout);
    const bad = infraVerdict(res);
    const graded = bad ?? await grade(specs.get(v.task), v.instanceSeed, cwd);
    copyDir(cwd, path.join(out, "trials", tid));
    fs.rmSync(cwd, { recursive: true, force: true });
    return {
      tid, arm: name, mode: arm, phase: v.phase, slot: v.slot, play: v.play, round: v.round, exposure: v.exposure,
      task: v.task, instanceSeed: v.instanceSeed, model, alias,
      cls: graded.cls, notes: graded.notes ?? "", solved: graded.cls === "pass", infra: Boolean(bad),
    };
  }

  // One retry for an infra row, as in run.mjs. `before` puts the state back to
  // where the visit started, so a voided visit leaves nothing behind.
  async function attempt(v, w, before) {
    before();
    let row = await visit(v, w);
    if (row.infra) { before(); row = await visit(v, w); }
    if (row.infra) {
      before();
      if (++infraRows >= 6) fs.writeFileSync(path.join(out, "STOP"), "infra floor reached\n");
    }
    fs.writeFileSync(rowFile(v), JSON.stringify(row, null, 2));
    log(`  ${row.tid} ${row.cls}`);
    if (fs.existsSync(path.join(out, "STOP"))) throw new Error(`STOP file in ${out}: infra floor reached or run halted by hand`);
    return row;
  }

  const todo = visitsOf(schedule, phases, plays);

  if (arm === "reset") {
    await pool(todo.filter((v) => !done(v)), concurrency, (v, w) =>
      attempt(v, w, () => freshConfig(cfgOf(w), cwdOf(w), { setup, memory })));
    return;
  }

  // carried: strictly serial. What one visit writes is first read by the next,
  // and nothing else may touch the state between them.
  const cfg = cfgOf(0), prev = `${cfg}-prev`, frozen = path.join(out, "cfg", `${name}-frozen`);
  const logFile = path.join(out, `state-${name}.jsonl`);
  const stateLog = fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  const record = (entry) => { stateLog.push(entry); fs.appendFileSync(logFile, JSON.stringify(entry) + "\n"); };
  const stateSha = (m) => sha(JSON.stringify(m));

  const streamVisits = todo.filter((v) => v.phase === "stream");
  if (streamVisits.some((v) => !done(v))) {
    if (fs.existsSync(frozen)) throw new Error(`${frozen} exists but the stream is unfinished; the frozen state would not be the end of the stream`);
    if (!stateLog.length) {
      freshConfig(cfg, cwdOf(0), { setup, memory });
      record({ after: null, sha: stateSha(manifest(cfg)), changed: [] });
    }
    for (const v of streamVisits) {
      if (done(v)) continue;
      const before = manifest(cfg);
      if (stateSha(before) !== stateLog.at(-1).sha) {
        throw new Error(`carried state in ${cfg} changed outside a visit (after ${stateLog.at(-1).after ?? "the start"}). ` +
          "The run cannot continue from a state no visit produced.");
      }
      copyDir(cfg, prev);
      // The seal is re-asserted before the visit and again after it, so the
      // boundary hash is of the state the next visit will start from.
      const row = await attempt(v, 0, () => { copyDir(prev, cfg); sealConfig(cfg); });
      sealConfig(cfg);
      const after = manifest(cfg);
      record({ after: row.tid, sha: stateSha(after), changed: changedPaths(before, after).slice(0, 200) });
    }
    fs.rmSync(prev, { recursive: true, force: true });
  }

  // The tests meet a frozen learner: every test visit starts from the state the
  // stream ended in, and nothing one test visit writes reaches another.
  const tests = todo.filter((v) => v.phase !== "stream" && !done(v));
  if (!tests.length) return;
  if (!fs.existsSync(frozen)) {
    if (schedule.stream.some((s) => !done({ vid: `stream-${pad(s.round)}` }))) throw new Error("carried tests need the finished stream: run the stream phase first");
    copyDir(cfg, frozen);
  }
  for (const v of tests) await attempt(v, 0, () => { copyDir(frozen, cfg); sealConfig(cfg); });
}

// ---------------------------------------------------------------- CLI

function sh(c) {
  return new Promise((res) => {
    const ch = spawn(c, { shell: true }); let o = "";
    ch.stdout.on("data", (d) => { o += d; }); ch.on("close", () => res(o));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const flags = {};
  for (let i = 1; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    flags[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  }
  const die = (msg, code = 2) => { console.error(`ERROR: ${msg}`); process.exit(code); };
  const need = (k) => flags[k] ?? die(`missing --${k}`);

  if (cmd === "check") {
    return checkChild({ task: taskSpec(need("task")), seed: Number(need("seed")), trial: need("trial") });
  }
  if (cmd === "gate") {
    const n = Number(flags.seeds ?? 8);
    const fails = await gate(taskSpec(need("task")), Array.from({ length: n }, (_, i) => i));
    if (fails) die(`${fails} gate case(s) failed: the task is not gradeable, do not schedule it`, 1);
    return console.log(`\ngate OK: oracle fails at base and at every wrong answer, passes at the reference fix, ${n} seeds`);
  }
  if (cmd === "run") {
    const scheduleFile = path.resolve(need("schedule"));
    const schedule = readJson(scheduleFile);
    const arm = need("arm"), model = need("model"), out = path.resolve(need("out"));
    const name = flags.name ?? arm;
    const phases = String(flags.phases ?? "stream,seen,heldout").split(",");
    const plays = Number(flags.plays ?? 1);
    const setup = flags.setup ? path.resolve(flags.setup) : null;
    const memory = flags.memory ? path.resolve(flags.memory) : null;
    const all = visitsOf(schedule, phases, plays);
    const left = all.filter((v) => !fs.existsSync(path.join(out, "rows", `${name}-${v.vid}.json`))).length;

    if (!process.env.ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY not set");
    if (!flags.yes) die(`spend gate: ${left} live ${model} visits (${all.length} scheduled), arm ${name}, phases ${phases.join(",")}. Re-run with --yes.`, 3);

    fs.mkdirSync(out, { recursive: true });
    const metaFile = path.join(out, "meta.json");
    const meta = fs.existsSync(metaFile) ? readJson(metaFile) : { runs: [] };
    meta.cli = (await sh("claude --version")).trim();
    meta.node = process.version;
    meta.runs.push({
      mode: "stream", arm, name, model, phases, plays, alias: Boolean(flags.alias), visits: left,
      schedule: scheduleFile, scheduleSha256: sha(fs.readFileSync(scheduleFile)),
      setup, setupSha256: setup ? dirSha256(setup) : null, memory, memorySha256: memory ? dirSha256(memory) : null,
      trialsRoot: trialsRoot(), timeoutS: Number(flags.timeout ?? 900),
    });
    fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

    console.log(`STREAM arm ${name} model ${model} visits=${left}/${all.length} phases=${phases.join(",")} plays=${plays}`);
    try {
      await runArm({ schedule, arm, name, model, out, phases, plays, setup, memory, alias: Boolean(flags.alias),
        timeoutS: Number(flags.timeout ?? 900), concurrency: Number(flags.concurrency ?? 1) });
    } catch (e) { die(e.message, 1); }
    return console.log(`\ndone. Metrics: python harness/stream_metrics.py ${path.relative(process.cwd(), out)} --cap <tokens>`);
  }
  die("usage: stream.mjs {gate|run} [flags]   (self-test: node harness/streamtest.mjs)");
}

if (path.basename(process.argv[1] ?? "") === "stream.mjs") await main();
