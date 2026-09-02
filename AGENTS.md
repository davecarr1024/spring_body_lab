# Spring Body Lab Guide

## Purpose

This project is an ODE-first, browser-inspected physics learning lab. The
headless model and numerical evidence are authoritative; the browser exposes
them.

## Commands

```bash
npm test
npm run build
npm run check
```

## Invariants

- Solver inputs and output traces are deterministic.
- Every integration claim has an analytic or structured numerical test.
- Rendering must not change simulation state.
- Add abstractions only after two concrete scenarios require them.

See `docs/design.md` and the root developer record at
`davecarr1024/davecarr1024` for the broader project philosophy.
