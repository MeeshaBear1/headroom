import { addCents, assertCents } from "./money.js";

/** Extended amount for one line: price * quantity, in cents. */
export function lineAmount({ priceCents, qty }) {
  assertCents(priceCents);
  if (!Number.isInteger(qty) || qty < 1) throw new TypeError(`qty must be a positive integer, got ${qty}`);
  return priceCents * qty;
}

/** Sum of the extended line amounts. Tax is not a cart concern. */
export function subtotalCents(items) {
  return addCents(...items.map(lineAmount));
}

/** Item count, for the cart badge. */
export function itemCount(items) {
  return items.reduce((n, it) => n + it.qty, 0);
}
