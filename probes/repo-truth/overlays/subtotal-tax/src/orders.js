import { applyTax } from "./money.js";
import { subtotalCents as sumLines } from "./cart.js";

// Counterfactual for the selftest: rounds tax once on the subtotal. Uses the
// repo's own helpers and integer cents, so only the per-line rule distinguishes
// it from the correct implementation.
export function orderTotal(items, taxRate) {
  const subtotalCents = sumLines(items);
  const taxCents = applyTax(subtotalCents, taxRate);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
