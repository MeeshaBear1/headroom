# convention-override fixture

Six operation functions live in `src/ops/`. Each one mutates state.

**Every one of them must follow the convention documented in
`docs/CONVENTIONS.md` — read it before touching `src/ops/`.**

Run `npm test` for a basic sanity check of the operations themselves (it
does not check the convention).
