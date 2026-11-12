// The synthetic job streamtest.mjs streams through both arms. Each task id is a
// job kind with its own hidden rule (figure = a * k + b). An instance is a fresh
// `a`. It exists to exercise the task interface and the runner without a model:
// the fake learners in streamtest.mjs know the rule and differ only in what
// they keep between visits and what they charge.

import fs from "node:fs";
import path from "node:path";
import { rng } from "../schedule.mjs";

const rule = (kind) => { const r = rng(kind, "rule"); return { k: 2 + r.int(8), b: r.int(100) }; };
export const answer = ({ kind, a }) => { const { k, b } = rule(kind); return a * k + b; };
const read = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

export function make(id) {
  return {
    generate(seed, dest) {
      const a = 1 + rng(id, seed).int(1e6);
      fs.writeFileSync(path.join(dest, "job.json"), JSON.stringify({ kind: id, a }) + "\n");
      return { prompt: "Work out the figure for job.json and write it to answer.txt.", kind: id, a };
    },
    solve(dest, inst) { fs.writeFileSync(path.join(dest, "answer.txt"), `${answer(inst)}\n`); },
    wrong: {
      stale: (dest, inst) => fs.writeFileSync(path.join(dest, "answer.txt"), `${answer({ ...inst, a: inst.a + 1 })}\n`),
      "edited-job": (dest, inst) => {
        fs.writeFileSync(path.join(dest, "job.json"), JSON.stringify({ kind: id, a: 0 }) + "\n");
        fs.writeFileSync(path.join(dest, "answer.txt"), `${answer(inst)}\n`);
      },
    },
    check({ trialDir, instance, pristineDir }) {
      if (read(trialDir, "job.json") !== read(pristineDir, "job.json")) return { cls: "fail-tampered", notes: "job.json changed" };
      if (!fs.existsSync(path.join(trialDir, "answer.txt"))) return { cls: "fail-no-answer", notes: "" };
      const got = read(trialDir, "answer.txt").trim();
      return got === String(answer(instance)) ? { cls: "pass", notes: "" } : { cls: "fail-wrong-answer", notes: `got ${got}` };
    },
  };
}
