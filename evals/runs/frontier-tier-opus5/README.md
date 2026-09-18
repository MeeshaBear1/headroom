# frontier-tier-opus5 — the 2026-09-18 census out-dir

One `--out` directory holding every phase of the study, because the runner
resumes by trial id and arm A of the contrast is the gate's own rows plus twenty
more. Split by trial id, not by directory:

| Phase | Rows | What |
|---|---|---|
| G, the gate | `*-A-001` … `*-A-010`, all 13 probes | arm A, `claude-opus-5`, n = 10 |
| R, routing | `null-census-B-001` … `-B-010` | arm B, `provenance-print-houses` mounted with `--skill` |
| C, contrast | `motion-undocumented-{A,B,C}-*`, `motion-no-js-mandated-{A,B}-*` | arm A extended to 30, arm B 30, arm C 10 at `claude-fable-5` |

`built/` carries the `site/` tree each motion trial actually produced. It is what
M1 is computed from — `site/main.js` against the fixture's 17-byte baseline — so
the mechanism is re-derivable without reading a transcript.

Freezes: [census](../../prereg/2026-09-18-frontier-tier-census.md) ·
[Phase C](../../prereg/2026-09-18-frontier-tier-phase-c.md) ·
[Phase R](../../prereg/2026-09-18-frontier-tier-phase-r.md).
