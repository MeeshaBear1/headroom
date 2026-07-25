#!/usr/bin/env node
// headroom — A/B/C uplift harness.
//
//   node harness/run.mjs selftest --probe probes/<id>
//   node harness/run.mjs gate --probe probes/<id> --model <id> --n 6  --out <dir> --yes
//   node harness/run.mjs run  --probe probes/<id> --arm A|B|C --model <id> --n 30 --out <dir> --yes
//   node harness/run.mjs grade  --out <dir>
//   node harness/run.mjs report --out <dir>
//
// Arms: A = subject model, library absent.  B = subject model, library soft-present
// (the prompt never mentions skills).  C = ceiling model, library absent.
//
// Every trial is a fresh cold-context `claude -p` session in a fresh copy of the
// fixture with an isolated CLAUDE_CONFIG_DIR, so no global skill, hook, plugin,
// memory, or CLAUDE.md from the operator's machine reaches any arm.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = {};
for (let i = 1; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) continue;
  const k = argv[i].slice(2);
  const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
  flags[k] = v;
}
const has = (k) => flags[k] !== undefined;
const need = (k) => { if (!has(k)) die(`missing --${k}`); return flags[k]; };
function die(msg, code = 2) { console.error(`ERROR: ${msg}`); process.exit(code); }

// ---------------------------------------------------------------- probe loading

async function loadProbe(dir) {
  const abs = path.resolve(dir);
  const spec = JSON.parse(readOr(path.join(abs, "probe.json"), null) ?? die(`no probe.json in ${abs}`));
  const oracleFile = path.join(abs, spec.oracle ?? "oracle.mjs");
  if (!fs.existsSync(oracleFile)) die(`oracle not found: ${oracleFile}`);
  const oracle = await import(pathToFileURL(oracleFile).href);
  if (typeof oracle.grade !== "function") die(`${oracleFile} must export grade()`);
  if (!Array.isArray(oracle.selftestCases)) die(`${oracleFile} must export selftestCases[]`);
  return { dir: abs, spec, oracle };
}

function readOr(p, fallback) { try { return fs.readFileSync(p, "utf8"); } catch { return fallback; } }

// Stage a fresh working copy: fixture/ then each overlay dir copied over it.
function stageFixture(probe, dest, overlays = []) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(probe.dir, probe.spec.fixture ?? "fixture"), dest, { recursive: true });
  for (const ov of overlays) {
    const src = path.join(probe.dir, "overlays", ov);
    if (!fs.existsSync(src)) die(`overlay not found: ${src}`);
    fs.cpSync(src, dest, { recursive: true, force: true });
  }
  return dest;
}

// ---------------------------------------------------------------- selftest
// The pristine-state gate, mechanised. An oracle that cannot FAIL at the base
// state and PASS at the historical fixed state is not measuring the probe's
// behaviour; the probe is dropped, never "adjusted until it passes".

async function selftest() {
  const probe = await loadProbe(need("probe"));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "headroom-st-"));
  let fails = 0;
  for (const c of probe.oracle.selftestCases) {
    const dest = stageFixture(probe, path.join(tmp, c.name ?? (c.overlay || "base")), c.overlay ? [c.overlay] : []);
    const transcript = c.transcriptFile
      ? fs.readFileSync(path.join(probe.dir, c.transcriptFile), "utf8")
      : (c.transcript ?? "");
    const got = await probe.oracle.grade({ trialDir: dest, transcript, raw: transcript, probeDir: probe.dir });
    const kind = got.cls === "pass" ? "pass" : got.cls.startsWith("infra") ? "infra" : "fail";
    const ok = kind === c.expect;
    if (!ok) fails++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${(c.name ?? c.overlay ?? "base").padEnd(22)} expect=${c.expect} got=${got.cls}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (fails) die(`${fails} selftest case(s) failed — probe is not gradeable, do not run trials`, 1);
  console.log(`\nselftest OK — ${probe.spec.id}: oracle fails at base, passes at pristine fix`);
}

// ---------------------------------------------------------------- child env / config

const SECRET_RE = /(_KEY|_SECRET|_TOKEN|APIKEY|API_KEY|PASSWORD|DATABASE|CREDENTIAL)/i;

function childEnv(configDir, probeEnv = {}) {
  const out = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (/^CLAUDE/i.test(k) || /^ANTHROPIC_/i.test(k)) continue; // parent session must not leak
    if (SECRET_RE.test(k)) continue;                            // R6: no operator secrets in trials
    out[k] = v;
  }
  out.CLAUDE_CONFIG_DIR = configDir;
  out.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  out.DISABLE_AUTOUPDATER = "1";
  out.DISABLE_TELEMETRY = "1";
  Object.assign(out, probeEnv); // declared in probe.json, so the seal is on the record
  return out;
}

// A fresh config dir per trial: no global skills, hooks, plugins, memory, or
// CLAUDE.md, and no cross-trial state of any kind.
function makeConfigDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  fs.writeFileSync(path.join(dir, ".claude.json"), JSON.stringify({
    hasCompletedOnboarding: true,
    customApiKeyResponses: { approved: [key.slice(-20)], rejected: [] },
  }));
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify({ includeCoAuthoredBy: false }));
  return dir;
}

// ---------------------------------------------------------------- one trial

const ALLOWED = "Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite";

function runClaude({ cwd, configDir, model, prompt, timeoutS, probeEnv }) {
  return new Promise((resolve) => {
    const args = ["-p", "--model", model, "--output-format", "stream-json", "--verbose",
      "--max-turns", "80", "--permission-mode", "acceptEdits", "--allowedTools", ALLOWED];
    const ch = spawn(process.platform === "win32" ? "claude.cmd" : "claude", args, {
      cwd, env: childEnv(configDir, probeEnv), shell: process.platform === "win32",
    });
    let stdout = "", stderr = "", timedOut = false, error = null;
    const t = setTimeout(() => { timedOut = true; ch.kill("SIGKILL"); }, timeoutS * 1000);
    ch.stdout.on("data", (d) => { stdout += d; });
    ch.stderr.on("data", (d) => { stderr += d; });
    ch.on("error", (e) => { error = e; });
    ch.on("close", (status) => { clearTimeout(t); resolve({ stdout, stderr, status, timedOut, error }); });
    ch.stdin.write(prompt);
    ch.stdin.end();
  });
}

// Assistant prose only — what the model actually said, which is what disclosure
// and overclaim oracles grade.
function assistantText(streamJson) {
  const out = [];
  for (const line of streamJson.split("\n")) {
    if (!line.trim()) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    const content = ev?.message?.content;
    if (ev.type === "assistant" && Array.isArray(content)) {
      for (const b of content) if (b.type === "text" && b.text) out.push(b.text);
    }
    if (ev.type === "result" && typeof ev.result === "string") out.push(ev.result);
  }
  return out.join("\n");
}

function skillFired(streamJson, skillName) {
  return new RegExp(`"(name|skill)"\\s*:\\s*"(Skill|${skillName})"`).test(streamJson)
    && streamJson.includes(skillName);
}

async function oneTrial({ probe, arm, model, i, out, timeoutS }) {
  const tid = `${probe.spec.id}-${arm}-${String(i).padStart(3, "0")}`;
  const rowFile = path.join(out, "rows", `${tid}.json`);
  if (fs.existsSync(rowFile)) return JSON.parse(fs.readFileSync(rowFile, "utf8")); // resume

  const trialDir = path.join(out, "trials", tid);
  stageFixture(probe, trialDir);
  const configDir = makeConfigDir(path.join(out, "cfg", tid));

  // Arm B only: the library is present on disk. The prompt is byte-identical
  // across arms and never mentions skills — adoption is part of what we measure.
  if (arm === "B") {
    const src = path.join(probe.dir, probe.spec.skillUnderTest ?? "skill");
    if (!fs.existsSync(src)) {
      die(`arm B needs the library text at ${src}, and it is not there.\n` +
          `  Populate it with the exact skill content under test and freeze its hash in the\n` +
          `  contrast pre-registration before running any B trial.`);
    }
    const dest = path.join(trialDir, ".claude", "skills", path.basename(src));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
  }

  const prompt = fs.readFileSync(path.join(probe.dir, probe.spec.prompt ?? "prompt.txt"), "utf8");
  const res = await runClaude({ cwd: trialDir, configDir, model, prompt, timeoutS, probeEnv: probe.spec.env });
  fs.writeFileSync(path.join(out, "transcripts", `${tid}.jsonl`), res.stdout);

  // Infra vs behaviour. A spawn error, a timeout, or a nonzero exit with no
  // transcript is an infra row: retried once, never recorded as a failed trial.
  const infra = Boolean(res.error) || res.timedOut || (res.status !== 0 && !res.stdout.trim())
    || !res.stdout.includes('"type":"result"');

  const text = assistantText(res.stdout);
  const graded = infra
    ? { cls: "infra-harness", notes: res.timedOut ? "timeout" : (res.error?.message ?? `exit ${res.status}`) }
    : await probe.oracle.grade({ trialDir, transcript: text, raw: res.stdout, probeDir: probe.dir });

  const row = {
    tid, probe: probe.spec.id, arm, model, i,
    cls: graded.cls, notes: graded.notes ?? "",
    cited: graded.cited ?? null,
    skillFired: arm === "B" ? skillFired(res.stdout, path.basename(probe.spec.skillUnderTest ?? "skill")) : null,
    infra,
  };
  fs.mkdirSync(path.dirname(rowFile), { recursive: true });
  fs.writeFileSync(rowFile, JSON.stringify(row, null, 2));
  fs.rmSync(path.join(out, "cfg", tid), { recursive: true, force: true });
  return row;
}

// ---------------------------------------------------------------- driver

async function bounded(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }));
  return results;
}

async function doRun({ gateMode }) {
  const probe = await loadProbe(need("probe"));
  const arm = gateMode ? "A" : need("arm");
  if (!["A", "B", "C"].includes(arm)) die("--arm must be A, B or C");
  const model = need("model");
  const n = Number(need("n"));
  const out = path.resolve(need("out"));
  const timeoutS = Number(flags.timeout ?? 900);
  const conc = Number(flags.concurrency ?? 6);

  if (!process.env.ANTHROPIC_API_KEY) die("ANTHROPIC_API_KEY not set");
  if (!has("yes")) die(`spend gate: ${n} live ${model} trials, probe ${probe.spec.id}, arm ${arm}. Re-run with --yes.`, 3);

  for (const d of ["rows", "trials", "transcripts", "cfg"]) fs.mkdirSync(path.join(out, d), { recursive: true });

  // Freeze what produced these numbers, before spending anything.
  const metaFile = path.join(out, "meta.json");
  const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, "utf8")) : { runs: [] };
  meta.cli = (await sh("claude --version")).trim();
  meta.node = process.version;
  meta.runs.push({ probe: probe.spec.id, arm, model, n, mode: gateMode ? "gate" : "run", timeoutS });
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2));

  console.log(`${gateMode ? "GATE" : "RUN "} ${probe.spec.id} arm ${arm} model ${model} n=${n} conc=${conc}`);

  let invalids = 0;
  const rows = await bounded(Array.from({ length: n }, (_, k) => k + 1), conc, async (i) => {
    if (fs.existsSync(path.join(out, "STOP"))) return null;
    let row = await oneTrial({ probe, arm, model, i, out, timeoutS });
    if (row.infra) { // one retry, then it stays an infra row
      fs.rmSync(path.join(out, "rows", `${row.tid}.json`), { force: true });
      row = await oneTrial({ probe, arm, model, i, out, timeoutS });
    }
    if (row.infra) invalids++;
    if (invalids >= 6) { fs.writeFileSync(path.join(out, "STOP"), "infra floor reached\n"); }
    process.stdout.write(`  ${row.tid} ${row.cls}${row.skillFired ? " [skill fired]" : ""}\n`);
    return row;
  });

  const valid = rows.filter((r) => r && !r.infra);
  if (invalids) console.log(`\n${invalids} infra row(s) excluded — see rows/*.json`);
  summarise(valid);
  if (gateMode) gateVerdict(probe, valid);
}

function sh(c) {
  return new Promise((res) => {
    const ch = spawn(c, { shell: true }); let o = "";
    ch.stdout.on("data", (d) => { o += d; }); ch.on("close", () => res(o));
  });
}

// ---------------------------------------------------------------- grading / reporting

function summarise(rows) {
  const byArm = {};
  for (const r of rows) (byArm[r.arm] ??= []).push(r);
  for (const [arm, rs] of Object.entries(byArm)) {
    const pass = rs.filter((r) => r.cls === "pass").length;
    const fired = rs.filter((r) => r.skillFired).length;
    console.log(`  arm ${arm}: ${pass}/${rs.length} pass` + (arm === "B" ? `, skill fired ${fired}/${rs.length}` : ""));
  }
  return byArm;
}

// The headroom calibration gate. Arm A alone, cheap n. If the subject model
// already passes unaided, the probe cannot show uplift at this tier — record it
// VOID-FOR-TIER and stop, before paying for arms B and C.
const GATE_VOID_AT = 0.9;   // >=90% unaided pass  -> ceiling, nothing to lift
const GATE_FLOOR_AT = 0.05; // <=5%  unaided pass  -> possible floor, check the task is doable at all

// The gate is directional, and the direction depends on what the probe is for.
// An uplift probe needs room *above* arm A; a harm control needs room *below* it,
// so a near-ceiling arm A is exactly what makes a harm control usable and a
// near-floor arm A is what makes it useless. Reading one with the other's rule
// inverts the verdict.
function gateVerdict(probe, rows) {
  const harm = probe.spec.harmControl === true;
  const n = rows.length, pass = rows.filter((r) => r.cls === "pass").length;
  const rate = n ? pass / n : 0;
  const verdict = harm
    ? (rate <= GATE_VOID_AT ? "VOID-FOR-TIER" : "CAN-DETECT-HARM")
    : (rate >= GATE_VOID_AT ? "VOID-FOR-TIER" : rate <= GATE_FLOOR_AT ? "FLOOR-SUSPECT" : "HAS-HEADROOM");
  console.log(`\nHEADROOM GATE  ${probe.spec.id}${harm ? " (harm control)" : ""}: unaided pass ${pass}/${n} (${(rate * 100).toFixed(0)}%) -> ${verdict}`);
  if (verdict === "VOID-FOR-TIER" && harm) console.log(`  Arm A below ${GATE_VOID_AT * 100}% — too little headroom downward to detect harm reliably.`);
  if (verdict === "VOID-FOR-TIER" && !harm) console.log("  Ceiling. Do not spend on arms B/C; record and publish the void.");
  if (verdict === "CAN-DETECT-HARM") console.log("  Arm A near ceiling — a drop in arm B is measurable. Run it with its matched probe.");
  if (verdict === "FLOOR-SUSPECT") console.log("  Near-zero unaided. Confirm the task is achievable before reading any B result as uplift.");
}

// Re-score saved transcripts with the current oracle, without re-spending. Legal
// only before arm B trials exist for the probe (a corrected oracle applied to a
// visible contrast is p-hacking); the reason and the old-vs-new counts go in the
// run record either way. Writes rows to rows-regraded/ so the originals survive.
async function regrade() {
  const probe = await loadProbe(need("probe"));
  const out = path.resolve(need("out"));
  const dst = path.join(out, "rows-regraded");
  fs.mkdirSync(dst, { recursive: true });
  const changed = [];
  for (const f of fs.readdirSync(path.join(out, "rows"))) {
    const row = JSON.parse(fs.readFileSync(path.join(out, "rows", f), "utf8"));
    if (row.probe !== probe.spec.id || row.infra) continue;
    const trialDir = path.join(out, "trials", row.tid);
    const raw = readOr(path.join(out, "transcripts", `${row.tid}.jsonl`), "");
    if (!fs.existsSync(trialDir) || !raw) die(`cannot regrade ${row.tid}: trial dir or transcript missing`);
    const g = await probe.oracle.grade({ trialDir, transcript: assistantText(raw), raw, probeDir: probe.dir });
    if (g.cls !== row.cls) changed.push(`${row.tid}: ${row.cls} -> ${g.cls}`);
    fs.writeFileSync(path.join(dst, f), JSON.stringify({ ...row, cls: g.cls, notes: g.notes ?? "", cited: g.cited ?? null, regradedFrom: row.cls }, null, 2));
  }
  const rows = fs.readdirSync(dst).map((f) => JSON.parse(fs.readFileSync(path.join(dst, f), "utf8"))).filter((r) => r.probe === probe.spec.id);
  console.log(`regraded ${rows.length} rows, ${changed.length} changed`);
  changed.forEach((c) => console.log("  " + c));
  summarise(rows);
  gateVerdict(probe, rows);
}

async function grade() {
  const out = path.resolve(need("out"));
  const rows = fs.readdirSync(path.join(out, "rows")).map((f) => JSON.parse(fs.readFileSync(path.join(out, "rows", f), "utf8")));
  const valid = rows.filter((r) => !r.infra);
  fs.writeFileSync(path.join(out, "rows.jsonl"), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log(`${rows.length} rows, ${rows.length - valid.length} infra excluded`);
  summarise(valid);
}

async function report() {
  const out = path.resolve(need("out"));
  const rows = fs.readdirSync(path.join(out, "rows"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(out, "rows", f), "utf8"))).filter((r) => !r.infra);
  const byProbe = {};
  for (const r of rows) ((byProbe[r.probe] ??= {})[r.arm] ??= []).push(r);
  const lines = ["| probe | arm | model | n | pass | rate | skill fired |", "|---|---|---|---|---|---|---|"];
  for (const [p, arms] of Object.entries(byProbe)) {
    for (const arm of ["A", "B", "C"]) {
      const rs = arms[arm]; if (!rs) continue;
      const pass = rs.filter((r) => r.cls === "pass").length;
      lines.push(`| ${p} | ${arm} | ${rs[0].model} | ${rs.length} | ${pass} | ${(pass / rs.length * 100).toFixed(0)}% | ${arm === "B" ? `${rs.filter((r) => r.skillFired).length}/${rs.length}` : "—"} |`);
    }
    const [A, B, C] = ["A", "B", "C"].map((a) => arms[a]);
    if (A && B) {
      const p = (rs) => rs.filter((r) => r.cls === "pass").length;
      console.log(`\n${p}  fisher A vs B: python harness/fisher.py ${p(B)} ${B.length - p(B)} ${p(A)} ${A.length - p(A)}`);
      if (C) {
        const [a, b, c] = [p(A) / A.length, p(B) / B.length, p(C) / C.length];
        console.log(`  gap closure (B-A)/(C-A) = ${c === a ? "undefined (C≈A — ceiling, excluded from aggregate)" : (((b - a) / (c - a)) * 100).toFixed(0) + "%"}`);
      }
    }
  }
  console.log("\n" + lines.join("\n"));
}

// ---------------------------------------------------------------- main

const table = { selftest, gate: () => doRun({ gateMode: true }), run: () => doRun({ gateMode: false }), grade, regrade, report };
if (!table[cmd]) die(`usage: run.mjs {selftest|gate|run|regrade|grade|report} [flags]`);
await table[cmd]();
