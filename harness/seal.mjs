// Every spelling of the operator's config directory that a deny rule, a shell
// command, or a transcript could use.
//
// This exists as its own module for one reason: `run.mjs` builds the SEAL from
// this list and `reachcheck.mjs` builds the CHECK from it. Defect 5 was a seal
// and a check that disagreed about what "reached the operator's config" meant,
// and two copies of a path-spelling list is exactly how that happens again.
//
// `run.mjs` runs its CLI on import, so neither consumer can import the list
// from there.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function operatorConfigForms(cfg = path.join(os.homedir(), ".claude")) {
  const fwd = cfg.replace(/\\/g, "/");
  const drive = fwd.match(/^([A-Za-z]):\/(.*)$/);
  const forms = new Set([cfg, fwd, fwd.replace(/\//g, "\\"), fwd.replace(/\//g, "\\\\")]);
  if (drive) {
    forms.add(`/${drive[1].toLowerCase()}/${drive[2]}`);   // MSYS: /c/Users/...
    forms.add(`/${drive[1].toUpperCase()}/${drive[2]}`);
  }
  return [...forms];
}

// A fresh config dir per trial: no global skills, hooks, plugins, memory, or
// CLAUDE.md, and no cross-trial state of any kind.
//
// Defect 5 (2026-09-18): the above stops the operator's skills being LOADED and
// does nothing about a trial READING the operator's disk — 102 of 250 trials of
// the frontier study ran `ls ~/.claude` or read a path under it, and 19 read the
// fleet's own motion doctrine on the probes measuring motion conventions. The
// deny rules here are the smallest lever that closes it, as proposed in that
// census record.
//
// Read-tool rules are exact; Bash rules are prefix-matched on the command string
// and are therefore a speed bump, not a jail — a command can always spell a path
// another way. That is why the seal is VERIFIED EMPIRICALLY by `sealtest.mjs`
// (one adversarial trial that is TOLD to go looking) and by `reachcheck.mjs`
// over a finished run. Never claim a run was sealed because this function ran.
export function makeConfigDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  fs.writeFileSync(path.join(dir, ".claude.json"), JSON.stringify({
    hasCompletedOnboarding: true,
    customApiKeyResponses: { approved: [key.slice(-20)], rejected: [] },
  }));
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify({
    includeCoAuthoredBy: false,
    permissions: { deny: denyRules() },
  }));
  return dir;
}

export function denyRules() {
  const deny = [];
  for (const f of operatorConfigForms()) {
    const p = f.replace(/\\/g, "/");
    deny.push(`Read(${p}/**)`, `Read(${p})`);
    for (const cmd of ["ls", "cat", "head", "tail", "sed", "grep", "find", "type", "dir"]) {
      deny.push(`Bash(${cmd}:*${p}*)`);
    }
  }
  return deny;
}

// Did this trial MENTION the operator's config directory anywhere? Conservative,
// and the basis of `reachcheck.mjs`'s reporting: it cannot tell a successful read
// from a refusal, so it over-counts. That is the right bias for a report.
export function mentionsOperatorConfig(text, cfg) {
  const needles = operatorConfigForms(cfg).map((s) => s.toLowerCase());
  const s = text.toLowerCase();
  return needles.some((n) => s.includes(n));
}

// Did this trial actually OBTAIN operator content? Precise, and the basis of the
// per-trial void rule: a trial whose read was refused saw nothing and its
// behaviour is still measurable, so voiding it would throw away a good row and
// re-run it into the same refusal forever.
//
// The signal is a tool_result that names the config directory and is not an
// error. A refusal arrives as `<tool_use_error>File is in a directory that is
// denied by your permission settings.</tool_use_error>`, which is evidence the
// seal HELD, not evidence it failed.
export function obtainedOperatorContent(streamJson, cfg) {
  const needles = operatorConfigForms(cfg).map((s) => s.toLowerCase());
  for (const line of streamJson.split("\n")) {
    if (!line.trim()) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    const content = ev?.message?.content;
    if (ev.type !== "user" || !Array.isArray(content)) continue;
    for (const b of content) {
      if (!b || b.type !== "tool_result") continue;
      const s = JSON.stringify(b.content ?? "").toLowerCase();
      if (s.includes("tool_use_error") || s.includes("denied by your permission")) continue;
      if (needles.some((n) => s.includes(n))) return true;
    }
  }
  return false;
}

// ponytail: self-check, not a suite. Fails if a spelling stops being produced.
if (process.argv[1] && process.argv[1].endsWith("seal.mjs")) {
  const f = operatorConfigForms("C:\\Users\\nileh\\.claude").map((s) => s.toLowerCase());
  const want = ["c:/users/nileh/.claude", "c:\\users\\nileh\\.claude", "/c/users/nileh/.claude"];
  const missing = want.filter((w) => !f.includes(w));
  if (missing.length) { console.error("FAIL missing spellings:", missing); process.exit(1); }
  const d = denyRules();
  if (!d.some((r) => r.startsWith("Read("))) { console.error("FAIL no Read deny rule"); process.exit(1); }
  if (!d.some((r) => r.startsWith("Bash("))) { console.error("FAIL no Bash deny rule"); process.exit(1); }

  // The refusal must not be mistaken for a read. This is the whole point of
  // having two detectors, so it is the case the self-check asserts.
  const cfg = "C:\\Users\\nileh\\.claude";
  const refused = JSON.stringify({ type: "user", message: { content: [{ type: "tool_result",
    content: "<tool_use_error>File is in a directory that is denied by your permission settings.</tool_use_error>",
    }] } });
  const got = JSON.stringify({ type: "user", message: { content: [{ type: "tool_result",
    content: "canary abc\nread from C:/Users/nileh/.claude/AESTHETIC.md" }] } });
  if (obtainedOperatorContent(refused, cfg)) { console.error("FAIL refusal scored as a read"); process.exit(1); }
  if (!obtainedOperatorContent(got, cfg)) { console.error("FAIL real read not detected"); process.exit(1); }
  if (!mentionsOperatorConfig(refused + got, cfg)) { console.error("FAIL mention detector missed"); process.exit(1); }
  console.log(`PASS seal: ${f.length} spellings, ${d.length} deny rules, refusal != read`);
}
