# Spring Body Lab Guide

## Purpose

This project builds a browser soft-body game from a headless physics library
built on a tested math/geometry library. The lower layers and their numerical
evidence are authoritative; the browser only adapts input and exposes results.

Read `README.md`, `docs/status.md`, `docs/technical-description.md`, and
`docs/design.md` before changing the model. The design document owns the
roadmap; status is the reader-facing capability record; the technical
description owns the implementation map and numerical contracts. Read
`docs/roadmap.md` for the active phase gate and `docs/design-review.md` at a
phase boundary.

## Commands

```bash
npm test
npm run coverage
npm run build
npm run check
```

`npm run check` is the presubmit command. It produces the Node test-coverage
report and runs the Playwright static-artifact browser smoke suite.

## Architecture

- `src/math/`: dependency-free immutable math and geometry library.
- `src/physics/`: validated headless soft-body state transition depending only
  on `math`.
- `src/game/`: deterministic scenes and game actions depending on `physics`.
- `src/browser/`: DOM adapter and renderer depending on public game APIs.
- `tests/`: matching layer tests; model-library code must remain at 100% line
  and function coverage.
- `scripts/build.mjs`: deterministic static-artifact builder; `dist/` is
  generated output.

## Invariants

- Simulation inputs and output records are deterministic.
- Every mathematical or physical claim has a structured numerical test.
- Rendering must not change simulation state.
- Add abstractions only after two concrete scenarios require them.
- Dependencies point down: browser → game → physics → math. Never reverse
  them or duplicate lower-layer behavior in an upper layer.
- Public math/geometry results classify degeneracy rather than hiding `NaN` or
  using magic values. Numeric claims require structured test evidence.
- State changes use immutable commands and `StepResult`; the browser/game never
  mutate a particle directly.

## Testing and documentation

Treat tests as the proof of the model. Keep production math, physics, and game
coverage at 100% line/function where the Node coverage runner can measure it;
browser rendering is a thin interactive adapter and is verified by the
Playwright suite described in [`docs/browser-testing.md`](docs/browser-testing.md).
Update the README plus every affected document under
`docs/` whenever model behavior, evidence, commands, or phase state changes.

Use the developer guide at `/home/davecarr1024/projects/davecarr1024` as the
cross-repository standard and promote reusable workflow findings there.

Every push requires the root workflow's local checks, fresh-context review,
and read-only `agy` code-and-design review. `agy` may use file-reading tools
only—never terminal, shell, Git, test, or editing commands.

See `docs/design.md` for the model and roadmap.
