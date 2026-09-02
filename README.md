# Spring Body Lab

An interactive laboratory for learning how ordinary differential equations
become simulated motion.

The first world is one undamped mass on a spring. It compares explicit Euler,
semi-implicit Euler, and RK4 against the analytic solution, and makes error
and energy drift visible in the browser.

## Run locally

```bash
npm test
npm run build
```

Open `dist/index.html` after building.

## Current proof

- exact quarter-cycle result for the harmonic oscillator;
- RK4 accuracy against that analytic reference;
- lower RK4 error with a smaller timestep;
- intentional explicit-Euler energy growth compared with semi-implicit Euler.

## Next

Add a gravity scenario through the same model/solver boundary, then extract
only the shared ODE and vector-math pieces that both scenarios honestly need.

See [docs/design.md](docs/design.md) for the first-phase design.
