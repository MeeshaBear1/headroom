// Counterfactual for the selftest: the conventional float-dollars prior,
// ignoring both the integer-cents rule and the basis-points rule.
export function orderTotal(items, taxRate) {
  const subtotal = items.reduce((s, it) => s + (it.priceCents / 100) * it.qty, 0);
  const tax = subtotal * taxRate;
  return { subtotalCents: subtotal, taxCents: tax, totalCents: subtotal + tax };
}
