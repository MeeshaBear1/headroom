// The stream schedule: seed in, list of (round, task, instance seed) out.
//
//   node harness/schedule.mjs --tasks probes/rule-drift,probes/retry-discipline \
//     --held probes/repo-truth --seed 0 > schedule.json
//
// Written from the description in Continual-ARC (Unify, 2026), section 2.2 and
// Algorithm 1 of its appendix B, not from its code. An active set holds at most
// `nc` tasks. A task that enters stays for a spell, then rests before it may
// return. Never-seen tasks arrive at intervals and take the next free place.
// Each round draws one active task uniformly and serves it a fresh instance.
//
//   spell   = max(1, round(Exp(mean spell)))
//   rest    = max(1, round(LogNormal(ln rest, sigma)))     median `rest`
//   arrival = Exp(mean arrival)
//
// Their ARC-AGI-1 values are the defaults: four active, spells about three,
// rests about thirty, a new task about every four, eight visits per task.
//
// Same seed, same bytes: every draw comes from one generator seeded by sha256,
// nothing reads a clock, and the output is serialised in a fixed key order.

import crypto from "node:crypto";
import path from "node:path";

// sfc32 seeded from sha256 of the parts. Task generators use it too, so an
// instance is a function of its seed and of nothing else.
export function rng(...parts) {
  const h = crypto.createHash("sha256").update(parts.join(":")).digest();
  let a = h.readInt32LE(0), b = h.readInt32LE(4), c = h.readInt32LE(8), d = h.readInt32LE(12);
  const next = () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = ((c << 21) | (c >>> 11)) + t | 0;
    return (t >>> 0) / 4294967296;
  };
  next.int = (n) => Math.floor(next() * n);
  next.pick = (xs) => xs[next.int(xs.length)];
  next.shuffle = (xs) => {
    const o = [...xs];
    for (let i = o.length - 1; i > 0; i--) { const j = next.int(i + 1); [o[i], o[j]] = [o[j], o[i]]; }
    return o;
  };
  return next;
}

// An instance seed is a hash of the schedule seed, the phase and the slot, so a
// slot yields the same instance in every arm and in every replay.
export function instanceSeed(seed, phase, slot, bump = 0) {
  return crypto.createHash("sha256").update(`${seed}:${phase}:${slot}:${bump}`).digest().readUInt32BE(0);
}

export const DEFAULTS = { seed: 0, nc: 4, spell: 3, rest: 30, sigma: 1, arrival: 4, supply: 8, seen: 4, pilot: 0 };

// tasks and held are lists of { id, dir }. Returns the whole plan: the stream,
// the two frozen tests, and (when asked) pilot slots for fixing the cap.
export function makeSchedule(opts) {
  const p = { ...DEFAULTS, ...opts };
  const { seed, nc, spell, rest, sigma, arrival, supply, tasks, held = [] } = p;
  if (!tasks?.length) throw new Error("schedule needs at least one stream task");
  const ids = [...tasks, ...held].map((t) => t.id);
  if (new Set(ids).size !== ids.length) throw new Error("a task id appears twice, or in both the stream and the held-out test");

  const r = rng(seed, "workstreams");
  const exp = (mean) => -mean * Math.log(1 - r());
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const drawSpell = () => Math.max(1, Math.floor(exp(spell) + 0.5));
  const drawRest = () => Math.max(1, Math.floor(Math.exp(Math.log(rest) + sigma * normal()) + 0.5));

  const queue = r.shuffle(tasks.map((t) => t.id));     // never seen
  const left = Object.fromEntries(queue.map((id) => [id, supply]));
  const seenCount = Object.fromEntries(queue.map((id) => [id, 0]));
  const active = new Map();                             // id -> rounds left in this spell
  const dormant = new Map();                            // id -> round it wakes
  let ready = [];
  let nextArrival = 0;
  const used = Object.fromEntries(ids.map((id) => [id, new Set()]));
  const fresh = (id, phase, slot) => {                  // a seed this task has not been served
    for (let bump = 0; ; bump++) {
      const s = instanceSeed(seed, phase, slot, bump);
      if (!used[id].has(s)) { used[id].add(s); return s; }
    }
  };

  const stream = [];
  const length = tasks.length * supply;
  for (let t = 0; t < length; t++) {
    for (const [id, wake] of [...dormant]) if (wake <= t) { dormant.delete(id); ready.push(id); }
    while (active.size < nc) {
      let id;
      if (queue.length && t >= nextArrival) { id = queue.shift(); nextArrival = t + exp(arrival); }
      else if (ready.length) { id = ready.splice(r.int(ready.length), 1)[0]; }
      else if (dormant.size) {                          // nothing ready: wake the soonest sleeper early
        id = [...dormant].sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1))[0][0];
        dormant.delete(id);
      }
      else if (queue.length) { id = queue.shift(); }    // nothing else exists: pull an arrival forward
      else break;
      active.set(id, Math.min(drawSpell(), left[id]));
    }
    if (active.size > nc || active.size === 0) throw new Error(`schedule invariant broken at round ${t}`);
    const id = [...active.keys()][r.int(active.size)];
    stream.push({ round: t, task: id, instanceSeed: fresh(id, "stream", t), exposure: seenCount[id]++ });
    active.set(id, active.get(id) - 1);
    left[id]--;
    if (active.get(id) === 0) {
      active.delete(id);
      if (left[id] > 0) dormant.set(id, t + 1 + drawRest());
    }
  }

  // The tests are served after the stream, to a frozen learner: fresh instances
  // of every stream task, and every held-out task once.
  const perTask = (phase, n) => tasks.flatMap((t, i) => Array.from({ length: n }, (_, k) => {
    const slot = i * n + k;
    return { slot, task: t.id, instanceSeed: fresh(t.id, phase, slot) };
  }));
  return {
    params: { seed, nc, spell, rest, sigma, arrival, supply, seen: p.seen, pilot: p.pilot },
    tasks: tasks.map(({ id, dir }) => ({ id, dir })),
    held: held.map(({ id, dir }) => ({ id, dir })),
    stream,
    seen: perTask("seen", p.seen),
    heldout: held.map((t, slot) => ({ slot, task: t.id, instanceSeed: fresh(t.id, "heldout", slot) })),
    pilot: perTask("pilot", p.pilot),
  };
}

// One row per line, keys in the order they were built. This is the byte form
// that gets hashed into a pre-registration.
export function serialise(s) {
  const rows = (xs) => (xs.length ? "[\n" + xs.map((x) => "  " + JSON.stringify(x)).join(",\n") + "\n ]" : "[]");
  return "{\n" + ["params", "tasks", "held"].map((k) => ` ${JSON.stringify(k)}: ${JSON.stringify(s[k])}`).join(",\n") + ",\n"
    + ["stream", "seen", "heldout", "pilot"].map((k) => ` ${JSON.stringify(k)}: ${rows(s[k])}`).join(",\n") + "\n}\n";
}

// "probes/rule-drift" or "name=dir"; the id defaults to the folder name.
export function taskSpec(s) {
  const [a, b] = s.split("=");
  const dir = (b ?? a).replace(/\\/g, "/").replace(/\/$/, "");
  return { id: b ? a : path.posix.basename(dir), dir };
}

if (path.basename(process.argv[1] ?? "") === "schedule.mjs") {
  const flags = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) flags[argv[i].slice(2)] = argv[++i];
  if (!flags.tasks) { console.error("usage: schedule.mjs --tasks <dir,dir,...> [--held <dir,...>] [--seed 0] [--nc 4] [--spell 3] [--rest 30] [--sigma 1] [--arrival 4] [--supply 8] [--seen 4] [--pilot 0]"); process.exit(2); }
  const list = (s) => (s ? s.split(",").filter(Boolean).map(taskSpec) : []);
  const num = Object.fromEntries(Object.keys(DEFAULTS).filter((k) => flags[k] !== undefined).map((k) => [k, Number(flags[k])]));
  process.stdout.write(serialise(makeSchedule({ ...num, tasks: list(flags.tasks), held: list(flags.held) })));
}
