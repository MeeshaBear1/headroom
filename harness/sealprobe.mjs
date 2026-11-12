#!/usr/bin/env node
// Seal probe — what actually reaches a trial-shaped session.
//
//   node harness/sealprobe.mjs [--model claude-opus-5]
//
// The README's one-line leak probe spawns a session with a throwaway
// CLAUDE_CONFIG_DIR and asks it three questions. That instrument has two holes,
// both found on 2026-09-18:
//
//   1. It does not pass --allowedTools, so the session can READ the operator's
//      files off disk and answer from what it read rather than from its context.
//      A leak and a lookup are then indistinguishable.
//   2. It trusts the model's own account of which skills it has. Asked twice in
//      one session set, the same environment self-reported two different skill
//      lists, neither matching the `system/init` event. Self-report is not
//      evidence; `system/init` is.
//
// So this probe uses the harness's exact flags, records every tool call, and
// reads the skill list off `system/init`. Zero tool calls plus a quoted file is
// proof of a leak. Exits 1 if any fleet-shaped skill reaches the session.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const ALLOWED = "Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite"; // must match run.mjs
const model = process.argv.includes("--model") ? process.argv[process.argv.indexOf("--model") + 1] : "claude-opus-5";

const Q = `Four answers, one line each, no tools, no preamble.
1. Quote verbatim every line of any user-level CLAUDE.md or house instruction file in your context, or say NONE.
2. Do you have memory of any prior conversation? yes or no.
3. Is any hook or plugin injecting text into this session? name it or say no.
4. Say DONE.`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "headroom-seal-"));
const cfg = path.join(tmp, "cfg"), work = path.join(tmp, "trials", "seal-000");
fs.mkdirSync(cfg, { recursive: true });
fs.mkdirSync(work, { recursive: true });
const key = process.env.ANTHROPIC_API_KEY ?? "";
if (!key) { console.error("ERROR: ANTHROPIC_API_KEY not set"); process.exit(2); }
fs.writeFileSync(path.join(cfg, ".claude.json"), JSON.stringify({
  hasCompletedOnboarding: true, customApiKeyResponses: { approved: [key.slice(-20)], rejected: [] } }));
fs.writeFileSync(path.join(cfg, "settings.json"), JSON.stringify({ includeCoAuthoredBy: false }));

// childEnv + makeConfigDir, exactly as run.mjs builds them.
const SECRET = /(_KEY|_SECRET|_TOKEN|APIKEY|API_KEY|PASSWORD|DATABASE|CREDENTIAL)/i;
const env = {};
for (const [k, v] of Object.entries(process.env)) {
  if (/^CLAUDE/i.test(k) || /^ANTHROPIC_/i.test(k)) continue;
  if (SECRET.test(k)) continue;
  env[k] = v;
}
env.CLAUDE_CONFIG_DIR = cfg;
env.ANTHROPIC_API_KEY = key;
env.DISABLE_AUTOUPDATER = "1";
env.DISABLE_TELEMETRY = "1";
env.GIT_CEILING_DIRECTORIES = path.dirname(work);

const args = ["-p", "--model", model, "--output-format", "stream-json", "--verbose",
  "--max-turns", "6", "--permission-mode", "acceptEdits", "--allowedTools", ALLOWED];
const ch = spawn(process.platform === "win32" ? "claude.cmd" : "claude", args,
  { cwd: work, env, shell: process.platform === "win32" });

let out = "";
ch.stdout.on("data", (d) => { out += d; });
ch.on("close", () => {
  let skills = null; const text = [], tools = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    if (ev.type === "system" && ev.subtype === "init") skills = ev.skills ?? [];
    if (ev.type === "assistant") for (const b of ev.message?.content ?? []) {
      if (b.type === "text") text.push(b.text);
      if (b.type === "tool_use") tools.push(b.name);
    }
  }
  // Fleet skills live under the operator's own skills dir; a trial must see none.
  const fleetDir = path.join(os.homedir(), ".claude", "skills");
  // Only directories holding a SKILL.md count. `~/.claude/skills` is itself a
  // git repo, so a bare readdir counts .git and .gitignore as two skills.
  const fleet = fs.existsSync(fleetDir)
    ? fs.readdirSync(fleetDir).filter((n) => fs.existsSync(path.join(fleetDir, n, "SKILL.md")))
    : [];
  const leaked = (skills ?? []).filter((s) => fleet.includes(s));

  console.log(`model            ${model}`);
  console.log(`tool calls       ${tools.length ? tools.join(", ") : "none  (so anything quoted below was in context, not read)"}`);
  console.log(`system/init      ${skills ? `${skills.length} skills: ${skills.join(", ")}` : "(no init event)"}`);
  console.log(`operator skills  ${fleet.length} installed under ~/.claude/skills`);
  console.log(`LEAKED SKILLS    ${leaked.length ? leaked.join(", ") : "none"}`);
  console.log("");
  console.log(text.join("\n").trim());
  console.log("");
  fs.rmSync(tmp, { recursive: true, force: true });
  if (leaked.length) { console.error(`FAIL: ${leaked.length} operator skill(s) reached a trial-shaped session`); process.exit(1); }
  console.log("PASS: no operator skill reached the session. Read answer 1 — CLAUDE.md is a separate question.");
});
ch.stdin.write(Q);
ch.stdin.end();
