#!/usr/bin/env node
// Reach check — what a trial reached, as opposed to what reached the trial.
//
//   node harness/reachcheck.mjs <transcripts-dir> [--config-dir <path>]
//
// `sealprobe.mjs` asks what is handed to a trial session. This asks the other
// half, and the answer on 2026-09-18 was worse: nothing stops a trial READING
// the operator's real home configuration off disk. Trials run with
// `--allowedTools ...,Bash,Read,...` and `--permission-mode acceptEdits` in a
// staged fixture, and `GIT_CEILING_DIRECTORIES` bounds git traversal only. A
// throwaway CLAUDE_CONFIG_DIR stops the operator's skills being LOADED; it does
// not stop `ls ~/.claude` from working.
//
// Measured on the 2026-09-18 census, 140 trials: 54 reached `~/.claude`, and 19
// read `slipway:motion`'s SKILL.md — the operator's own motion doctrine, on the
// probes measuring motion conventions. `motion-undocumented` declares in its
// probe.json that "nothing anywhere states the two-layer rule, names
// animation-timeline, or mentions browser support". Inside the fixture that is
// true. Nine of its ten trials went outside the fixture and found a rule.
//
// So: run this over any run's transcripts before believing its fixture was
// sealed. Exits 1 if any transcript reached the operator's config directory.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const dir = process.argv[2];
if (!dir) { console.error("usage: reachcheck.mjs <transcripts-dir> [--config-dir <path>]"); process.exit(2); }
const i = process.argv.indexOf("--config-dir");
const cfg = i > -1 ? process.argv[i + 1] : path.join(os.homedir(), ".claude");

// The path as a transcript could spell it: JSON-escaped backslashes, forward
// slashes, and the MSYS form all denote the same directory.
const base = cfg.replace(/\\/g, "/");
const drive = base.match(/^([A-Za-z]):\/(.*)$/);
const forms = new Set([base, cfg, base.replace(/\//g, "\\"), base.replace(/\//g, "\\\\")]);
if (drive) forms.add(`/${drive[1].toLowerCase()}/${drive[2]}`);
const needles = [...forms].map((s) => s.toLowerCase());

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")).sort();
const hit = [];
for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), "utf8").toLowerCase();
  if (needles.some((n) => s.includes(n))) hit.push(f);
}

// Group by probe so a single contaminated fixture is visible, not averaged away.
const by = new Map();
for (const f of files) {
  const p = f.replace(/-[ABC]-\d+\.jsonl$/, "");
  const r = by.get(p) ?? { n: 0, reached: 0 };
  r.n++; if (hit.includes(f)) r.reached++;
  by.set(p, r);
}

console.log(`config dir checked: ${cfg}`);
console.log(`transcripts:        ${files.length}`);
console.log("");
console.log("| probe | reached operator config / trials |");
console.log("|---|---|");
for (const [p, r] of [...by].sort((a, b) => b[1].reached - a[1].reached || a[0].localeCompare(b[0]))) {
  console.log(`| \`${p}\` | ${r.reached} / ${r.n}${r.reached ? "" : "  (clean)"} |`);
}
console.log("");
console.log(`TOTAL reached: ${hit.length} / ${files.length}`);
if (hit.length) {
  console.error(`\nFAIL: ${hit.length} trial(s) reached ${cfg}. The fixture was not sealed from the`);
  console.error(`operator's filesystem, so "unaided" in this run means "without a mounted skill",`);
  console.error(`not "without access to house doctrine". Report it; do not average it away.`);
  process.exit(1);
}
console.log("PASS: no transcript reached the operator's config directory.");
