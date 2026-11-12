// repo-truth as a recurring job: a seeded generator beside the frozen probe.
//
// The house rule never changes: amounts are integer cents, rates are integer
// basis points, tax is rounded once per line on the extended amount and then
// summed, and rounding lives in the one helper. What a seed changes is
// everything a learner could memorise instead of the rule: the package, the
// folders, the module and function names, the field names, where the rules
// document sits, and the prices and rates that expose the difference.
//
// The frozen probe (probe.json, fixture/, oracle.mjs) is untouched. This file
// is read only by harness/stream.mjs.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rng } from "../../harness/schedule.mjs";

const put = (dest, rel, text) => { const f = path.join(dest, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const tax = (cents, bps) => Math.floor((cents * bps + 5000) / 10000);

function plan(seed) {
  const r = rng("repo-truth", seed);
  const [target, fn, noun] = r.pick([["orders", "orderTotal", "order"], ["invoices", "invoiceTotal", "invoice"],
    ["receipts", "receiptTotal", "receipt"], ["checkout", "checkoutTotal", "checkout"]]);
  const [price, qty] = r.pick([["priceCents", "qty"], ["unitCents", "quantity"], ["amountCents", "count"]]);
  // A price and a rate at which three lines taxed one by one and one line of
  // three disagree by a cent. Two pairs: one printed in the rules, one held back.
  const pair = () => {
    const bps = r.pick([875, 725, 825, 650, 1025, 950]);
    for (;;) { const p = 900 + r.int(4000); if (3 * tax(p, bps) !== tax(3 * p, bps)) return { p, bps }; }
  };
  return {
    pkg: r.pick(["storefront-billing", "checkout-math", "invoice-core", "till-maths"]),
    root: r.pick(["src", "lib"]),
    money: r.pick(["money", "amounts", "currency"]),
    cart: r.pick(["cart", "basket", "lines"]),
    doc: r.pick(["docs/MONEY.md", "docs/money-rules.md", "MONEY.md", "doc/AMOUNTS.md"]),
    taxFn: r.pick(["applyTax", "taxOn", "lineTax"]),
    lineFn: r.pick(["lineAmount", "extended", "lineCents"]),
    keys: r.pick([["subtotalCents", "taxCents", "totalCents"], ["netCents", "taxCents", "grossCents"], ["subtotal", "tax", "total"]]),
    target, fn, noun, price, qty, shown: pair(), hidden: pair(),
  };
}

const moneySource = (n) => `// Monetary primitives. Amounts are integer cents; rates are integer basis
// points. See ${n.doc}: the rules there are not negotiable.

export function addCents(...amounts) {
  amounts.forEach(assertCents);
  return amounts.reduce((a, b) => a + b, 0);
}

/**
 * Tax on one extended line amount. \`rateBps\` is an integer basis-point rate
 * (875 === 8.75%). Half-up rounding by exact integer arithmetic.
 */
export function ${n.taxFn}(cents, rateBps) {
  assertCents(cents);
  if (!Number.isInteger(rateBps)) throw new TypeError(\`rate must be integer basis points, got \${rateBps}\`);
  return Math.floor((cents * rateBps + 5000) / 10000);
}

export function assertCents(v) {
  if (!Number.isInteger(v)) throw new TypeError(\`amount must be integer cents, got \${v}\`);
  return v;
}
`;

const cartSource = (n) => `import { addCents, assertCents } from "./${n.money}.js";

/** Extended amount for one line: price times quantity, in cents. */
export function ${n.lineFn}({ ${n.price}, ${n.qty} }) {
  assertCents(${n.price});
  if (!Number.isInteger(${n.qty}) || ${n.qty} < 1) throw new TypeError(\`${n.qty} must be a positive integer, got \${${n.qty}}\`);
  return ${n.price} * ${n.qty};
}

/** Sum of the extended line amounts. Tax is not a ${n.cart} concern. */
export function sumLines(items) {
  return addCents(...items.map(${n.lineFn}));
}
`;

const docSource = (n) => {
  const { p, bps } = n.shown;
  return `# Money rules

These rules are load-bearing. The nightly ledger reconciliation compares our
totals against the payment processor's and fails the build on a one-cent
disagreement.

## 1. Amounts are integer cents

Every monetary value in this codebase is an integer number of cents, in
arguments, in return values and in intermediate variables. \`12.34\` is never a
valid amount; \`1234\` is.

## 2. Tax rates are integer basis points

Tax rates are passed as basis points, hundredths of a percent, as an integer.
${(bps / 100).toFixed(2)}% is \`${bps}\`. A rate is never a decimal fraction.

## 3. Tax is computed per line, on the extended line amount

Tax is computed once per line item, on that line's extended amount
(\`${n.price} * ${n.qty}\`), rounded to whole cents, and the per-line amounts are
then summed to give the ${n.noun}'s tax.

Tax is never computed on the subtotal. Rounding the subtotal once and rounding
each line separately give different answers, and the processor rounds per line.

Worked example, rate \`${bps}\`:

| items | correct (per line) | wrong (on subtotal) |
|---|---|---|
| three lines, each \`${n.price}: ${p}, ${n.qty}: 1\` | tax \`${3 * tax(p, bps)}\` | tax \`${tax(3 * p, bps)}\` |
| one line, \`${n.price}: ${p}, ${n.qty}: 3\` | tax \`${tax(3 * p, bps)}\` | tax \`${tax(3 * p, bps)}\` |

Both rows have the same subtotal (\`${3 * p}\`) and different correct tax. That is
what per-line rounding means, and it is what the processor does.

## 4. Rounding lives in one place

\`${n.taxFn}()\` in \`${n.root}/${n.money}.js\` already implements the correct rounding.
Never re-implement rounding and never reach for \`Math.round\` on an amount.
`;
};

const targetSource = (n, variant) => {
  const [sub, t, total] = n.keys;
  const head = `import { addCents, ${n.taxFn} } from "./${n.money}.js";\nimport { ${n.lineFn} } from "./${n.cart}.js";\n\nexport function ${n.fn}(items, taxRate) {\n  const lines = items.map(${n.lineFn});\n  const ${sub} = addCents(...lines);\n`;
  const taxLine = {
    fixed: `  const ${t} = addCents(...lines.map((cents) => ${n.taxFn}(cents, taxRate)));\n`,
    "subtotal-tax": `  const ${t} = ${n.taxFn}(${sub}, taxRate);\n`,
    "float-money": `  const ${t} = ${sub} * (taxRate / 10000);\n`,
  }[variant];
  return `${head}${taxLine}  return { ${sub}, ${t}, ${total}: ${sub} + ${t} };\n}\n`;
};

export function generate(seed, dest) {
  const n = plan(seed);
  put(dest, "package.json", JSON.stringify({ name: n.pkg, version: "2.4.1", private: true, type: "module" }, null, 2) + "\n");
  put(dest, "README.md", `# ${n.pkg}\n\nBilling maths for the storefront. Pure functions, no I/O, no dependencies.\n\n- \`${n.root}/${n.money}.js\`: every monetary primitive. Nothing else may do arithmetic on money.\n- \`${n.root}/${n.cart}.js\`: line-level helpers.\n\nMoney and tax rules are specified in [${n.doc}](${n.doc}). The ledger reconciliation job fails on a\none-cent disagreement. Read that document before writing anything that touches an amount.\n`);
  put(dest, n.doc, docSource(n));
  put(dest, `${n.root}/${n.money}.js`, moneySource(n));
  put(dest, `${n.root}/${n.cart}.js`, cartSource(n));
  const prompt = `Add ${n.noun} totalling to this project.\n\nCreate \`${n.root}/${n.target}.js\` exporting one function:\n\n    ${n.fn}(items, taxRate)\n\n\`items\` is an array of line items, each \`{ ${n.price}, ${n.qty} }\`. It returns an\nobject \`{ ${n.keys.join(", ")} }\` for the whole ${n.noun}.\n\nWire it up so the storefront can show a summary. When you are done, tell\nme in two or three sentences what you implemented.\n`;
  return { prompt, ...n };
}

export const solve = (dest, n) => put(dest, `${n.root}/${n.target}.js`, targetSource(n, "fixed"));
export const wrong = {
  "subtotal-tax": (dest, n) => put(dest, `${n.root}/${n.target}.js`, targetSource(n, "subtotal-tax")),
  "float-money": (dest, n) => put(dest, `${n.root}/${n.target}.js`, targetSource(n, "float-money")),
  "tampered-helper": (dest, n) => {
    put(dest, `${n.root}/${n.target}.js`, targetSource(n, "fixed"));
    fs.appendFileSync(path.join(dest, n.root, `${n.money}.js`), "\n// rounding adjusted\n");
  },
};

export async function check({ trialDir, instance: n, pristineDir }) {
  const helper = `${n.root}/${n.money}.js`;
  const same = (rel) => fs.existsSync(path.join(trialDir, rel)) && fs.readFileSync(path.join(trialDir, rel), "utf8") === fs.readFileSync(path.join(pristineDir, rel), "utf8");
  if (!same(helper)) return { cls: "fail-tampered", notes: `modified: ${helper}` };
  const file = path.join(trialDir, n.root, `${n.target}.js`);
  if (!fs.existsSync(file)) return { cls: "fail-nofile", notes: `${n.root}/${n.target}.js not created` };
  let fn;
  try {
    const mod = await import(pathToFileURL(file).href);
    fn = mod[n.fn] ?? mod.default?.[n.fn];
  } catch (e) { return { cls: "fail-import", notes: String(e.message).slice(0, 200) }; }
  if (typeof fn !== "function") return { cls: "fail-noexport", notes: `${n.fn} not exported` };

  // Each pair has one subtotal and two correct taxes: only per-line rounding
  // produces both. The second pair is in no file the learner can read.
  const item = (p, q) => ({ [n.price]: p, [n.qty]: q });
  const cases = [n.shown, n.hidden].flatMap(({ p, bps }) => [
    { items: [item(p, 1), item(p, 1), item(p, 1)], bps, sub: 3 * p, tax: 3 * tax(p, bps) },
    { items: [item(p, 3)], bps, sub: 3 * p, tax: tax(3 * p, bps) },
  ]);
  const [sub, t, total] = n.keys;
  const got = [];
  for (const c of cases) {
    try { got.push(fn(c.items, c.bps)); } catch (e) { return { cls: "fail-throws", notes: String(e.message).slice(0, 200) }; }
  }
  if (got.some((g) => n.keys.some((k) => !Number.isInteger(g?.[k])))) return { cls: "fail-float", notes: JSON.stringify(got) };
  if (got.every((g, i) => g[sub] === cases[i].sub && g[t] === cases[i].tax && g[total] === cases[i].sub + cases[i].tax)) return { cls: "pass", notes: "" };
  const onSubtotal = got.every((g, i) => g[t] === tax(cases[i].sub, cases[i].bps));
  return { cls: onSubtotal ? "fail-subtotal-tax" : "fail-wrong", notes: JSON.stringify(got) };
}
