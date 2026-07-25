# Money rules

These rules are load-bearing. The nightly ledger reconciliation compares our
totals against the payment processor's and fails the build on a one-cent
disagreement, so "close enough" is a broken build.

## 1. Amounts are integer cents

Every monetary value in this codebase is an **integer number of cents**. There
are no floating-point amounts anywhere, not in arguments, not in return values,
not in intermediate variables. `12.34` is never a valid amount; `1234` is.

Reason: binary floating point cannot represent most decimal cent values, so
float amounts drift, and the reconciliation job catches the drift days later.

## 2. Tax rates are integer basis points

Tax rates are passed as **basis points** (bps) — hundredths of a percent, as an
integer. 8.75% is `875`. A rate is never a decimal fraction like `0.0875`.

Reason: the processor's API reports rates in bps, and converting back and forth
was the source of two reconciliation failures.

## 3. Tax is computed per line, on the extended line amount

Tax is computed **once per line item**, on that line's extended amount
(`priceCents * qty`), rounded to whole cents, and the per-line tax amounts are
then summed to give the order's tax.

Tax is **never** computed on the order subtotal. Rounding the subtotal once and
rounding each line separately give different answers, and the processor rounds
per line, so we must too.

Worked example, rate `875` (8.75%):

| items | correct (per line) | wrong (on subtotal) |
|---|---|---|
| three lines, each `priceCents: 1297, qty: 1` | tax `339` | tax `340` |
| one line, `priceCents: 1297, qty: 3`         | tax `340` | tax `340` |

The first two rows have the same subtotal (`3891`) and different correct tax.
That is not a bug — it is what per-line rounding means, and it is what the
processor does.

## 4. Rounding lives in one place

`applyTax()` in `src/money.js` already implements the correct rounding
(half-up, exact integer arithmetic). Never re-implement rounding; never reach
for `Math.round` on an amount. Call the helper.
