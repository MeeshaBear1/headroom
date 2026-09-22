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
  // The shell spellings. Measured 2026-09-21 on the July Sonnet 5 contrast: 8 of
  // 30 arm-A trials reached the config as `~/.claude`, which no rule above and no
  // mention count knew, so `obtained` outran `mentioned` in the per-arm table.
  forms.add("~/.claude");
  forms.add("$HOME/.claude");
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
// A directory listing is not content either. Measured 2026-09-20 on the sealed
// re-gate: Read was refused 19 times out of 19, and the only calls that returned
// anything were 9 `ls` listings and 2 Glob patterns. Not one returned a line of
// house doctrine — yet an earlier version of this function voided 8 of 10 trials,
// because a listing's text contains the config path. Knowing AESTHETIC.md exists
// is not reading it.
//
// So the call is paired with its result and classified by what the tool returns:
// Read returns file bodies, Glob returns paths, and Bash depends on the command.
//
// This detector was written three times before it was written correctly, and
// the first two versions each voided a run the seal had in fact protected:
//
//   v1  any tool_result whose text contained the config path -> an `ls` listing
//       of ~/.claude voided 8 of 10 trials. Knowing AESTHETIC.md exists is not
//       reading it.
//   v2  paired the call with its result and excluded the known refusal string ->
//       the CLI refuses in more than one voice (`Permission to use Bash with
//       command ... has been denied`), and a `bash: unexpected EOF` from a
//       malformed command is not a refusal at all. Both scored as content.
//
// The fault is structural, not a missing string. v1 and v2 both inferred success
// from the ABSENCE of a known failure, so every failure mode nobody had met yet
// read as a breach. The list of ways a command can fail has no end.
//
// v3 asks for positive evidence instead: a trial obtained operator content iff a
// tool_result carries a line that is literally in one of the operator's own docs.
// A refusal cannot contain one, a directory listing cannot, a shell error cannot.
// The failure direction is now a MISSED breach rather than a false one, and
// reachcheck.mjs's conservative mention count is the published backstop for that.
//
// ponytail: literal lines, not semantics. A trial that read the doctrine and only
// paraphrased it is not caught here. That is the ceiling; the mention count is
// what the record quotes. Lines are sampled from the config AS IT IS NOW, so an
// old transcript is checked against today's doctrine -- these files grow by
// accretion, and the count is a floor either way.
function doctrineLines(cfg = path.join(os.homedir(), ".claude")) {
  const lines = new Set();
  let names;
  try { names = fs.readdirSync(cfg); } catch { return []; }
  for (const name of names) {
    if (!name.endsWith(".md")) continue;
    let text;
    try { text = fs.readFileSync(path.join(cfg, name), "utf8"); } catch { continue; }
    for (const raw of text.split("\n")) {
      const l = raw.trim();
      // Long enough to belong to one document, and not a path, table or fence.
      if (l.length < 45 || l.length > 200) continue;
      if (/^[|`#>*-]/.test(l) || l.includes("://") || l.includes("\\")) continue;
      lines.add(l.toLowerCase());
    }
  }
  return [...lines];
}

export function obtainedOperatorContent(streamJson, cfg) {
  const lines = doctrineLines(cfg);
  if (!lines.length) return false;            // nothing to match on: report nothing
  for (const line of streamJson.split("\n")) {
    if (!line.trim()) continue;
    let ev; try { ev = JSON.parse(line); } catch { continue; }
    const content = ev?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b?.type !== "tool_result") continue;
      const s = JSON.stringify(b.content ?? "").toLowerCase();
      if (s.length < 60) continue;
      if (lines.some((l) => s.includes(l))) return true;
    }
  }
  return false;
}

// ponytail: self-check, not a suite. Fails if a spelling stops being produced.
if (process.argv[1] && process.argv[1].endsWith("seal.mjs")) {
  const f = operatorConfigForms("C:\\Users\\nileh\\.claude").map((s) => s.toLowerCase());
  const want = ["c:/users/nileh/.claude", "c:\\users\\nileh\\.claude", "/c/users/nileh/.claude", "~/.claude"];
  const missing = want.filter((w) => !f.includes(w));
  if (missing.length) { console.error("FAIL missing spellings:", missing); process.exit(1); }
  const d = denyRules();
  if (!d.some((r) => r.startsWith("Read("))) { console.error("FAIL no Read deny rule"); process.exit(1); }
  if (!d.some((r) => r.startsWith("Bash("))) { console.error("FAIL no Bash deny rule"); process.exit(1); }

  // The refusal must not be mistaken for a read. This is the whole point of
  // having two detectors, so it is the case the self-check asserts.
  const cfg = "C:\\Users\\nileh\\.claude";
  const use = (id, name, input) => JSON.stringify({ type: "assistant", message: { content: [
    { type: "tool_use", id, name, input }] } });
  const result = (id, content) => JSON.stringify({ type: "user", message: { content: [
    { type: "tool_result", tool_use_id: id, content }] } });
  const DENIED = "<tool_use_error>File is in a directory that is denied by your permission settings.</tool_use_error>";

  // 1. A refused Read is not a read.
  const refused = use("t1", "Read", { file_path: "C:\\Users\\nileh\\.claude\\AESTHETIC.md" })
    + "\n" + result("t1", DENIED);
  // 2. A successful Read is -- and the payload has to be a REAL line of the
  //    operator's doctrine, because a real line is the whole of v3's evidence.
  const sample = doctrineLines(cfg).find((l) => l.length >= 60);
  if (!sample) { console.error(`FAIL no doctrine lines sampled from ${cfg}`); process.exit(1); }
  const read = use("t2", "Read", { file_path: cfg })
    + "\n" + result("t2", `     1\t${sample}`);
  // 3. An `ls` listing is NOT content, however much of the path it prints.
  const listing = use("t3", "Bash", { command: 'ls -la "C:/Users/nileh/.claude/"' })
    + "\n" + result("t3", "AESTHETIC.md\nCOPY.md\nBRIEFGATE.md\nC:/Users/nileh/.claude/");
  // 4. A `cat` through Bash IS content.
  const cat = use("t4", "Bash", { command: 'cat "C:/Users/nileh/.claude/COPY.md"' })
    + "\n" + result("t4", `${sample} and then some more of the file`);

  // 5. The CLI's OTHER refusal voice, on a Bash command that would have read.
  //    This is the case that voided a good trial on 2026-09-20.
  const bashDenied = use("t5", "Bash", { command: 'ls C:/Users/nileh/.claude/ && find . -type f | head -50' })
    + "\n" + result("t5", "Permission to use Bash with command ls C:/Users/nileh/.claude/ has been denied.");
  // 6. And on Glob.
  const globDenied = use("t6", "Glob", { pattern: "*.md", path: "\\\\Users\\\\nileh\\\\.claude" })
    + "\n" + result("t6", "Permission to read C:\\\\Users\\\\nileh\\\\.claude has been denied.");

  // 7. A malformed command that never ran is not content either.
  const broken = use("t7", "Bash", { command: 'ls -la "C:/Users/nileh/.claude/\\" | head -40' })
    + "\n" + result("t7", "Exit code 2 /usr/bin/bash: eval: line 1: unexpected EOF while looking for matching quote");
  if (obtainedOperatorContent(refused, cfg)) { console.error("FAIL refusal scored as a read"); process.exit(1); }
  if (!obtainedOperatorContent(read, cfg)) { console.error("FAIL real read not detected"); process.exit(1); }
  if (obtainedOperatorContent(listing, cfg)) { console.error("FAIL listing scored as content"); process.exit(1); }
  if (!obtainedOperatorContent(cat, cfg)) { console.error("FAIL cat not detected as content"); process.exit(1); }
  if (obtainedOperatorContent(bashDenied, cfg)) { console.error("FAIL bash refusal scored as content"); process.exit(1); }
  if (obtainedOperatorContent(globDenied, cfg)) { console.error("FAIL glob refusal scored as content"); process.exit(1); }
  if (obtainedOperatorContent(broken, cfg)) { console.error("FAIL shell error scored as content"); process.exit(1); }
  if (!mentionsOperatorConfig(listing, cfg)) { console.error("FAIL mention detector missed a listing"); process.exit(1); }
  console.log(`PASS seal: ${f.length} spellings, ${d.length} deny rules, ${doctrineLines(cfg).length} doctrine lines, 7 cases`);
}
