# storefront-billing

Billing maths for the storefront. Pure functions, no I/O, no dependencies.

- `src/money.js` — every monetary primitive. Nothing else may do arithmetic on money.
- `src/cart.js` — cart-level helpers.
- `src/orders.js` — order-level helpers.

**Money and tax rules are specified in [docs/MONEY.md](docs/MONEY.md). They are not
optional conventions — the ledger reconciliation job fails on a one-cent
disagreement. Read that document before writing anything that touches an amount.**

Tests: `npm test`
