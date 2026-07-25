// Monetary primitives. Amounts are integer cents; rates are integer basis
// points. See docs/MONEY.md — the rules there are not negotiable.

/** "12.34" -> 1234 */
export function parseAmount(str) {
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(str).trim());
  if (!m) throw new TypeError(`not an amount: ${str}`);
  const cents = Number(m[2]) * 100 + Number((m[3] ?? "0").padEnd(2, "0"));
  return m[1] === "-" ? -cents : cents;
}

/** 1234 -> "$12.34" */
export function formatCents(cents) {
  assertCents(cents);
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function addCents(...amounts) {
  amounts.forEach(assertCents);
  return amounts.reduce((a, b) => a + b, 0);
}

/**
 * Tax on one extended line amount. `rateBps` is an integer basis-point rate
 * (875 === 8.75%). Half-up rounding via exact integer arithmetic — no floats
 * touch the value, so there is nothing to drift.
 */
export function applyTax(cents, rateBps) {
  assertCents(cents);
  if (!Number.isInteger(rateBps)) throw new TypeError(`rate must be integer basis points, got ${rateBps}`);
  return Math.floor((cents * rateBps + 5000) / 10000);
}

export function assertCents(v) {
  if (!Number.isInteger(v)) throw new TypeError(`amount must be integer cents, got ${v}`);
  return v;
}
