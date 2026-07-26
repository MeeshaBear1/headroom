# retry-discipline fixture

Six notification-send functions live in `src/ops/`. Each one calls out to
`send()` in `../gateway`.

**None of them records a failed delivery attempt yet, and the fix must
follow the convention documented in `docs/CONVENTIONS.md` — read it before
touching `src/ops/`.**

Run `npm test` for a basic sanity check of the operations themselves (it
does not check the convention).
