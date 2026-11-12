#!/usr/bin/env node
// Memory retrieval check: when a job comes back in a fresh session, does the
// session open the memory note written for it?
//
//   node harness/retrieval.mjs --selftest
//   node harness/retrieval.mjs select                       # apply the frozen selection rule, print candidates
//   node harness/retrieval.mjs check  --jobs <jobs.json>    # lint prompts, confirm targets exist
//   node harness/retrieval.mjs probe  --jobs <jobs.json> --yes
//   node harness/retrieval.mjs trial <id> --jobs <jobs.json> --yes
//   node harness/retrieval.mjs regrade --jobs <jobs.json>   # rebuild rows from the transcripts on disk
//   node harness/retrieval.mjs report --jobs <jobs.json>
//
// This is the one harness in the repo that runs a trial INSIDE the operator's
// home directory on purpose. Defect 6 (seal.mjs) is the mechanism under test
// here: the CLI loads the memory index because of the cwd, so staging anywhere
// else would measure nothing. What keeps a trial harmless is the tool list, and
// that is checked on every trial from the init event, never assumed from the
// flags: a session whose init names any tool beyond Read, Grep and Glob, or any
// MCP server, is an infra row and is not graded.
//
// Transcripts hold the operator's private memory. They are written under
// trialsRoot() and never into this repository; a row carries classes of path,
// not paths.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { trialsRoot } from "./seal.mjs";

const die = (m, code = 2) => { console.error(m); process.exit(code); };
const argv = process.argv.slice(2);
const flag = (k) => { const i = argv.indexOf(`--${k}`); return i > -1 ? argv[i + 1] : null; };
const TOOLS = ["Read", "Grep", "Glob"];

// The CLI names a project's memory dir after its cwd with every non-alphanumeric
// character turned into a hyphen: C:\Users\nileh -> C--Users-nileh.
const memDir = (cwd) => path.join(os.homedir(), ".claude", "projects", cwd.replace(/[^A-Za-z0-9]/g, "-"), "memory");

// ---------------------------------------------------------------- oracle

const norm = (p) => String(p ?? "").replace(/\\+/g, "/").toLowerCase();
const inMemory = (p, base) => norm(p).includes(".claude/projects/") && norm(p).endsWith(`/memory/${base.toLowerCase()}`);
const MOVED_RE = /\/memory\/(memory-index-(?:moved-[\d-]+|overflow)\.md)$/;

function parse(raw) {
  const calls = [], errored = new Set(), answered = new Set();
  let init = null, result = null;
  const fallbacks = [], responses = new Set();
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === "system" && ev.subtype === "init" && !init) init = ev;
    if (ev.type === "result") result = ev;
    if (ev.type === "system" && ev.subtype === "model_fallback") fallbacks.push(`${ev.original_model}>${ev.fallback_model}`);
    if (ev.type === "assistant" && ev.message?.id) responses.add(ev.message.id);
    const content = ev?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (ev.type === "assistant" && b.type === "tool_use") calls.push({ id: b.id, name: b.name, input: b.input ?? {} });
      if (ev.type === "user" && b.type === "tool_result") { answered.add(b.tool_use_id); if (b.is_error) errored.add(b.tool_use_id); }
    }
  }
  return { calls, errored, answered, init, result, fallbacks, responses: responses.size };
}

// The path a call OPENED, or null. A Read opens its file. A Grep opens a file
// only when it asked for content and its path is that file; a Grep over the
// directory, or one that lists file names, has shown the session a pointer and
// not the note. The call must have a result and the result must not be an error.
function opened(c, t) {
  if (!t.answered.has(c.id) || t.errored.has(c.id)) return null;
  if (c.name === "Read") return c.input.file_path ?? null;
  if (c.name === "Grep" && c.input.output_mode === "content") return c.input.path ?? null;
  return null;
}

// What a row may say about a path without repeating the operator's file names.
function pathClass(p, targets) {
  const n = norm(p);
  if (!n) return "cwd";
  if (targets.some((b) => inMemory(n, b))) return "target";
  const m = n.match(MOVED_RE);
  if (m) return m[1];
  if (/\/memory\/memory\.md$/.test(n)) return "MEMORY.md";
  if (/\.claude\/projects\/[^/]+\/memory(\/|$)/.test(n)) return /\/memory\/?$/.test(n) ? "memory-dir" : "other-memory";
  if (n.includes("/.claude/") || n.endsWith("/.claude")) return "claude-config";
  if (/(^|\/)github\//.test(n)) return "repo";
  return "other";
}

export function grade(raw, targets) {
  const t = parse(raw);
  const unsealed = t.init
    ? [...(t.init.tools ?? []).filter((x) => !TOOLS.includes(x)), ...(t.init.mcp_servers ?? []).map((s) => `mcp:${s.name}`)]
    : [];
  const infra = !t.init ? "infra-no-init"
    : unsealed.length ? "infra-unsealed"
    : (t.init.apiKeySource ?? "none") !== "none" ? "infra-api-key"
    : t.fallbacks.length ? "infra-model-fallback"
    : !t.result ? "infra-no-result"
    : raw.includes('"terminal_reason":"api_error"') ? "infra-api-error"
    : null;
  const paths = t.calls.map((c) => opened(c, t)).filter(Boolean);
  const pass = paths.some((p) => targets.some((b) => inMemory(p, b)));
  const u = t.result?.usage ?? {};
  const tok = ["input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"].map((k) => u[k] ?? 0);
  return {
    cls: infra ?? (pass ? "pass" : "fail-not-opened"),
    pass: !infra && pass,
    infra: Boolean(infra),
    notes: unsealed.length ? `init named ${unsealed.join(", ")}` : t.fallbacks.join(", "),
    movedIndexOpened: [...new Set(paths.map((p) => norm(p).match(MOVED_RE)?.[1]).filter(Boolean))].sort(),
    otherMemoryOpened: new Set(paths.filter((p) => pathClass(p, targets) === "other-memory").map(norm)).size,
    // Weak evidence, never a pass: the target's file name appeared somewhere.
    sawTargetName: targets.some((b) => raw.toLowerCase().includes(b.toLowerCase())),
    model: t.init?.model ?? null,
    // The init event names the model that was asked for; modelUsage names what answered.
    answeredBy: Object.keys(t.result?.modelUsage ?? {}).sort(),
    cliVersion: t.init?.claude_code_version ?? null,
    apiKeySource: t.init?.apiKeySource ?? null,
    // `turns` is the CLI's own num_turns, which on 2.1.319 counts tool calls plus
    // one. `responses` counts model responses, the unit --max-turns limits.
    turns: t.result?.num_turns ?? null,
    responses: t.responses,
    resultSubtype: t.result?.subtype ?? null,
    tokens: { input: tok[0], output: tok[1], cacheCreate: tok[2], cacheRead: tok[3], total: tok.reduce((a, b) => a + b, 0) },
    costUsd: t.result?.total_cost_usd ?? null,
    toolCalls: t.calls.length,
    first3: t.calls.slice(0, 3).map((c) => `${c.name}:${pathClass(c.input.file_path ?? c.input.path, targets)}`),
  };
}

// ---------------------------------------------------------------- selection rule and prompt lint

const OWED = /\bowed\b|\bowes\b/i;
const FIRST_LINK = /^- \[(.*?)\]\(([^)/\\]+\.md)\)/;

function entries(indexFile) {
  return fs.readFileSync(indexFile, "utf8").split(/\r?\n/)
    .map((l) => l.match(FIRST_LINK)).filter(Boolean)
    .map((m) => ({ line: m.input, target: m[2] }))
    .filter((e) => !/^memory-index-|^MEMORY\.md$/i.test(e.target));
}

function note(file) {
  if (!fs.existsSync(file)) return null;
  const s = fs.readFileSync(file, "utf8");
  const fm = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const get = (k) => fm?.[1].match(new RegExp(`^\\s*${k}:\\s*"?([^"\\r\\n]+)`, "m"))?.[1] ?? null;
  return {
    type: get("type"),
    modified: get("modified") ?? fs.statSync(file).mtime.toISOString(),
    owed: OWED.test(fm ? s.slice(fm[0].length) : s),
  };
}

export function select(dir) {
  const qualifies = (e) => { const n = note(path.join(dir, e.target)); return n && n.type === "project" && n.owed ? { ...e, modified: n.modified } : null; };
  const inIndex = entries(path.join(dir, "MEMORY.md"));
  const indexed = new Set(inIndex.map((e) => e.target));
  const IN = inIndex.map(qualifies).filter(Boolean).sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 5);
  const MOVED = [], seen = new Set();
  const movedFiles = fs.readdirSync(dir).filter((f) => /^memory-index-moved-\d{4}-\d{2}-\d{2}\.md$/.test(f)).sort().reverse();
  for (const f of movedFiles) {
    for (const e of entries(path.join(dir, f))) {
      if (MOVED.length === 5) break;
      if (indexed.has(e.target) || seen.has(e.target)) continue;
      const q = qualifies(e);
      if (q) { MOVED.push({ ...q, movedIn: f }); seen.add(e.target); }
    }
  }
  return { IN, MOVED };
}

// A prompt must not hand the session the pointer it is being tested on: no file
// name, no slug (with or without its date), no run of four words from the
// index line.
const words = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
export function lint(prompt, target, indexLine = "") {
  const p = ` ${words(prompt).join(" ")} `, out = [];
  const slug = target.replace(/\.md$/i, "");
  const stem = slug.replace(/-\d{4}-\d{2}-\d{2}$/, "");
  if (/\.md\b/i.test(prompt)) out.push("names a .md file");
  for (const s of new Set([slug, stem])) if (p.includes(` ${words(s).join(" ")} `)) out.push(`contains the slug "${s}"`);
  const w = words(indexLine);
  for (let i = 0; i + 4 <= w.length; i++) {
    const run = w.slice(i, i + 4).join(" ");
    if (p.includes(` ${run} `)) { out.push(`quotes the index line: "${run}"`); break; }
  }
  return out;
}

// ---------------------------------------------------------------- one trial

function loadJobs() {
  const f = flag("jobs"); if (!f) die("--jobs <jobs.json> is required");
  const spec = JSON.parse(fs.readFileSync(f, "utf8"));
  return { spec, dir: path.dirname(path.resolve(f)), transcripts: path.join(trialsRoot(), spec.run) };
}

// The index line a job's note is listed under, read from the memory dir at run
// time. It is the operator's text and is never written into this repository.
function indexLineOf(spec, job) {
  return select(memDir(spec.cwd))[job.arm]?.find((e) => e.target === job.target)?.line ?? "";
}

function runClaude({ cli, cwd, prompt, maxTurns, timeoutS }) {
  return new Promise((resolve) => {
    // The parent session's variables must not reach the child: with them gone the
    // CLI falls back to the operator's claude.ai login, which is the login whose
    // memory is under test. grade() refuses a trial whose init says otherwise.
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^CLAUDE|^ANTHROPIC_/i.test(k)));
    const args = ["-p", "--output-format", "stream-json", "--verbose", "--max-turns", String(maxTurns),
      "--tools", TOOLS.join(","), "--strict-mcp-config", "--no-session-persistence"];
    // `cli` is frozen in the jobs file. The `claude` on PATH and the binary the
    // operator's own sessions run on are different versions on this machine, and
    // the older one cannot reach the operator's default model.
    const cmd = cli ?? (process.platform === "win32" ? "claude.cmd" : "claude");
    const ch = spawn(cmd, args, { cwd, env, shell: cmd.toLowerCase().endsWith(".cmd") });
    let stdout = "", stderr = "", timedOut = false;
    const t = setTimeout(() => { timedOut = true; ch.kill("SIGKILL"); }, timeoutS * 1000);
    ch.stdout.on("data", (d) => { stdout += d; });
    ch.stderr.on("data", (d) => { stderr += d; });
    ch.on("error", (e) => { stderr += String(e); });
    ch.on("close", (status) => { clearTimeout(t); resolve({ stdout, stderr, status, timedOut }); });
    ch.stdin.write(prompt);
    ch.stdin.end();
  });
}

async function trial(id) {
  if (!argv.includes("--yes")) die("a trial spends the operator's plan limits: pass --yes");
  const { spec, dir, transcripts } = loadJobs();
  const job = id === "probe" ? spec.probe : spec.jobs.find((j) => j.id === id);
  if (!job) die(`no job "${id}" in the jobs file`);
  const rowFile = path.join(dir, "rows", `${id}.json`);
  if (fs.existsSync(rowFile)) {
    // One re-run, and only of a trial that died on infrastructure.
    const old = JSON.parse(fs.readFileSync(rowFile, "utf8")), kept = rowFile.replace(/\.json$/, ".infra-1.json");
    if (!old.infra) die(`${id} already has a graded row; a graded trial is never re-run`);
    if (fs.existsSync(kept)) die(`${id} has used its one infra re-run`);
    fs.renameSync(rowFile, kept);
  }
  const targets = job.targets ?? [job.target];
  if (id !== "probe" && job.target) {
    const bad = lint(job.prompt, job.target, indexLineOf(spec, job));
    if (bad.length) die(`${id}: prompt ${bad.join("; ")}`);
  }
  fs.mkdirSync(transcripts, { recursive: true });
  const t0 = Date.now();
  const res = await runClaude({ cli: spec.cli, cwd: spec.cwd, prompt: job.prompt, maxTurns: spec.maxTurns, timeoutS: spec.timeoutS ?? 900 });
  fs.writeFileSync(path.join(transcripts, `${id}.jsonl`), res.stdout);
  if (res.stderr.trim()) fs.writeFileSync(path.join(transcripts, `${id}.stderr.txt`), res.stderr);
  const g = grade(res.stdout, targets);
  if (res.timedOut && !g.infra) Object.assign(g, { cls: "infra-timeout", pass: false, infra: true });
  const row = { id, arm: job.arm, control: Boolean(job.control), target: job.target ?? null, ...g, seconds: Math.round((Date.now() - t0) / 1000) };
  if (id !== "probe") { fs.mkdirSync(path.dirname(rowFile), { recursive: true }); fs.writeFileSync(rowFile, JSON.stringify(row, null, 2) + "\n"); }
  console.log(JSON.stringify(row, null, 2));
}

// Rows are a function of the transcripts. This rebuilds every row from the
// transcript on disk, keeping only the wall-clock seconds from the old row.
function regrade() {
  const { spec, dir, transcripts } = loadJobs();
  for (const job of spec.jobs) {
    const rowFile = path.join(dir, "rows", `${job.id}.json`), tf = path.join(transcripts, `${job.id}.jsonl`);
    if (!fs.existsSync(rowFile) || !fs.existsSync(tf)) continue;
    const old = JSON.parse(fs.readFileSync(rowFile, "utf8"));
    const g = grade(fs.readFileSync(tf, "utf8"), job.targets ?? [job.target]);
    if (old.cls === "infra-timeout") Object.assign(g, { cls: "infra-timeout", pass: false, infra: true });
    if (g.cls !== old.cls) console.log(`CHANGED ${job.id}: ${old.cls} -> ${g.cls}`);
    fs.writeFileSync(rowFile, JSON.stringify({ id: job.id, arm: job.arm, control: Boolean(job.control), target: job.target ?? null, ...g, seconds: old.seconds }, null, 2) + "\n");
  }
}

function report() {
  const { spec, dir } = loadJobs();
  const rows = spec.jobs.map((j) => { const f = path.join(dir, "rows", `${j.id}.json`); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null; }).filter(Boolean);
  console.log("| id | arm | cls | moved index opened | responses | tool calls | tokens | first three calls |");
  console.log("|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    console.log(`| ${r.id} | ${r.arm}${r.control ? " control" : ""} | ${r.cls} | ${r.movedIndexOpened.join(", ") || "none"} | ${r.responses} | ${r.toolCalls} | ${r.tokens.total} | ${r.first3.join(", ") || "none"} |`);
  }
  const mean = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  for (const arm of ["IN", "MOVED"]) {
    const a = rows.filter((r) => r.arm === arm && !r.control && !r.infra);
    console.log(`\n${arm}: ${a.filter((r) => r.pass).length} of ${a.length} opened the target note; mean responses ${(a.reduce((s, r) => s + r.responses, 0) / (a.length || 1)).toFixed(1)}, mean tool calls ${(a.reduce((s, r) => s + r.toolCalls, 0) / (a.length || 1)).toFixed(1)}, mean tokens ${mean(a.map((r) => r.tokens.total))}`);
  }
  console.log(`models: ${[...new Set(rows.map((r) => r.model))].join(", ")}`);
}

function check() {
  const { spec } = loadJobs();
  const dir = memDir(spec.cwd), picked = select(dir);
  let bad = 0;
  for (const j of spec.jobs.filter((x) => !x.control)) {
    const problems = lint(j.prompt, j.target, indexLineOf(spec, j));
    if (!fs.existsSync(path.join(dir, j.target))) problems.push("target file is missing");
    if (!picked[j.arm].some((e) => e.target === j.target)) problems.push(`the selection rule does not pick it for arm ${j.arm} today`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${j.id} ${j.target}${problems.length ? "  " + problems.join("; ") : ""}`);
    bad += problems.length;
  }
  if (bad) die(`${bad} problem(s)`, 1);
}

// ---------------------------------------------------------------- selftest

function selftest() {
  const T = "widget-build-2026-01-02.md", mem = "C:\\Users\\x\\.claude\\projects\\C--Users-x\\memory\\";
  const ev = (o) => JSON.stringify(o);
  const init = ev({ type: "system", subtype: "init", model: "m", tools: TOOLS, mcp_servers: [], apiKeySource: "none" });
  const use = (id, name, input) => ev({ type: "assistant", message: { content: [{ type: "tool_use", id, name, input }] } });
  const res = (id, is_error = false) => ev({ type: "user", message: { content: [{ type: "tool_result", tool_use_id: id, is_error, content: "x" }] } });
  const end = ev({ type: "result", subtype: "success", num_turns: 3, usage: { input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 3, cache_read_input_tokens: 4 } });
  const passing = [init, use("a", "Read", { file_path: mem + T }), res("a"), end].join("\n");
  // Mentions the note by name, lists it with a Grep, and has a Read of it refused. None of that opens it.
  const failing = [init,
    ev({ type: "assistant", message: { content: [{ type: "text", text: `The note ${T} covers this.` }] } }),
    use("a", "Grep", { pattern: "widget", path: mem, output_mode: "files_with_matches" }), res("a"),
    use("b", "Read", { file_path: mem + T }), res("b", true),
    use("c", "Read", { file_path: mem + "memory-index-moved-2026-01-01.md" }), res("c"), end].join("\n");
  const cases = [
    ["a Read of the target passes", grade(passing, [T]).cls === "pass"],
    ["tokens are the additive sum", grade(passing, [T]).tokens.total === 10],
    ["a mention, a file listing and a refused Read fail", grade(failing, [T]).cls === "fail-not-opened"],
    ["the failing transcript did see the name", grade(failing, [T]).sawTargetName === true],
    ["the moved index is recorded apart from the pass", grade(failing, [T]).movedIndexOpened.join() === "memory-index-moved-2026-01-01.md"],
    ["a content Grep on the target file passes", grade([init, use("a", "Grep", { pattern: "x", path: mem + T, output_mode: "content" }), res("a"), end].join("\n"), [T]).cls === "pass"],
    ["a session with Bash is not graded", grade(passing.replace('"Glob"]', '"Glob","Bash"]'), [T]).cls === "infra-unsealed"],
    ["a session on an API key is not graded", grade(passing.replace('"none"', '"ANTHROPIC_API_KEY"'), [T]).cls === "infra-api-key"],
    ["a session that fell back to another model is not graded", grade([init, ev({ type: "system", subtype: "model_fallback", original_model: "m", fallback_model: "n" }), end].join("\n"), [T]).cls === "infra-model-fallback"],
    ["rows carry path classes, not paths", grade(failing, [T]).first3.join() === "Grep:memory-dir,Read:target,Read:memory-index-moved-2026-01-01.md"],
    ["lint refuses the slug", lint("Pick up the widget build", T).length === 1],
    ["lint refuses four words of the index line", lint("the widget ships on friday, what is owed", T, "- [Widget 01-02](x.md) - the widget ships on Friday").length === 1],
    ["lint passes a plain request", lint("Widget: where did we leave it?", T, "- [Widget 01-02](x.md) - ships Friday").length === 0],
  ];
  let fails = 0;
  for (const [name, ok] of cases) { console.log(`${ok ? "PASS" : "FAIL"}  ${name}`); if (!ok) fails++; }
  if (fails) die(`${fails} selftest case(s) failed`, 1);
  console.log(`\nselftest OK: ${cases.length} cases`);
}

const cmd = argv[0];
if (cmd === "--selftest") selftest();
else if (cmd === "select") {
  const s = select(memDir(flag("cwd") ?? os.homedir()));
  for (const arm of ["IN", "MOVED"]) for (const e of s[arm]) console.log(`${arm}\t${e.modified}\t${e.movedIn ?? "MEMORY.md"}\t${e.target}`);
}
else if (cmd === "check") check();
else if (cmd === "probe") await trial("probe");
else if (cmd === "trial") await trial(argv[1]);
else if (cmd === "regrade") regrade();
else if (cmd === "report") report();
else die("usage: retrieval.mjs {--selftest|select|check|probe|trial <id>|regrade|report} [--jobs <jobs.json>] [--yes]");
