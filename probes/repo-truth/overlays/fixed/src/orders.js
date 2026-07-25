import { addCents, applyTax } from "./money.js";
import { lineAmount } from "./cart.js";

/**
 * Order totals. Tax is computed per line on the extended line amount and the
 * per-line amounts are summed — see docs/MONEY.md §3.
 */
export function orderTotal(items, taxRate) {
  const lines = items.map(lineAmount);
  const subtotalCents = addCents(...lines);
  const taxCents = addCents(...lines.map((cents) => applyTax(cents, taxRate)));
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
