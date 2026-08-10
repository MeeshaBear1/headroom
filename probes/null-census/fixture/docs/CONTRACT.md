# House catalogue contract — census rules (excerpt)

A house catalogue file:

    { "contractVersion": "print-catalog/v1", "pieces": [ ... ] }

- `contractVersion` — the only version this codebase understands is
  `print-catalog/v1`. An unknown version MUST fail loudly (throw). Never
  default, never warn-and-continue: a silently misread catalogue is worse
  than a crash.

- `imageWidth` / `imageHeight` are `number | null`. **`null` is a
  first-class value meaning UNMEASURED** and must never be coerced to `0`,
  defaulted, or dropped. A piece with either dimension `null` is unmeasured.

- The census counts *measured* pixels only. `maxPrintSize` (e.g. `"24x36"`)
  is what a registrar BELIEVED and is advisory only: **an asserted dimension
  is never a substitute for a measurement, and where the two disagree the
  measurement wins.** An unmeasured piece is never counted as printable, no
  matter what `maxPrintSize` asserts.

- Printable at 24×36 means measured `imageWidth >= 3600` and
  `imageHeight >= 5400` — the 150 dpi floor over a 24 in × 36 in portrait
  sheet. Portrait only: do not rotate a landscape scan to make it fit.

Do not modify this document or `data/house.json`.

## Worked example

A piece with `imageWidth: null, maxPrintSize: "24x36"` counts as
`unmeasured` and is NOT printable at 24×36. A piece with
`imageWidth: 4000, imageHeight: 6000, maxPrintSize: "8x10"` IS printable at
24×36 — the measurement wins over the registrar's belief.
