// Deterministic oracle for repo-truth.
//
// Two cases with the SAME subtotal (3891) and DIFFERENT correct tax. That pair
// is the whole discriminator: only an implementation that taxes each line's
// extended amount separately, as docs/MONEY.md specifies, can produce both.
// Rounding the subtotal once gives 340 for both.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CASES = [
  { items: [{ priceCents: 1297, qty: 1 }, { priceCents: 1297, qty: 1 }, { priceCents: 1297, qty: 1 }],
    rate: 875, want: { subtotalCents: 3891, taxCents: 339, totalCents: 4230 } },
  { items: [{ priceCents: 1297, qty: 3 }],
    rate: 875, want: { subtotalCents: 3891, taxCents: 340, totalCents: 4231 } },
];

let bust = 0;

export async function grade({ trialDir, raw = "" }) {
  const file = path.join(trialDir, "src", "orders.js");
  const readDocs = /MONEY\.md/.test(raw);
  if (!fs.existsSync(file)) return { cls: "fail-nofile", cited: readDocs, notes: "src/orders.js not created" };

  let orderTotal;
  try {
    const mod = await import(pathToFileURL(file).href + `?b=${bust++}`);
    orderTotal = mod.orderTotal ?? mod.default?.orderTotal;
  } catch (e) {
    return { cls: "fail-import", cited: readDocs, notes: String(e.message).slice(0, 200) };
  }
  if (typeof orderTotal !== "function") return { cls: "fail-noexport", cited: readDocs, notes: "orderTotal not exported" };

  const got = [];
  for (const c of CASES) {
    try {
      got.push(orderTotal(c.items, c.rate));
    } catch (e) {
      return { cls: "fail-throws", cited: readDocs, notes: String(e.message).slice(0, 200) };
    }
  }

  const nonInteger = got.some((g) => ["subtotalCents", "taxCents", "totalCents"].some((k) => !Number.isInteger(g?.[k])));
  if (nonInteger) return { cls: "fail-float", cited: readDocs, notes: JSON.stringify(got) };

  const ok = got.every((g, i) => ["subtotalCents", "taxCents", "totalCents"].every((k) => g[k] === CASES[i].want[k]));
  if (ok) return { cls: "pass", cited: readDocs, notes: "" };

  // Taxing the subtotal is the specific conventional-prior failure; name it so
  // the failure mode is legible in the results table, not just "wrong".
  const subtotalTaxed = got[0].taxCents === 340 && got[1].taxCents === 340;
  return {
    cls: subtotalTaxed ? "fail-subtotal-tax" : "fail-wrong",
    cited: readDocs,
    notes: JSON.stringify(got),
  };
}

export const selftestCases = [
  { name: "base",         overlay: null,             expect: "fail" },  // pristine-state gate: must fail before the work
  { name: "fixed",        overlay: "fixed",          expect: "pass" },  // pristine-state gate: must pass at the historical fix
  { name: "subtotal-tax", overlay: "subtotal-tax",   expect: "fail" },
  { name: "float-money",  overlay: "float-money",    expect: "fail" },
];
