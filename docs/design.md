# Design

## Thesis

Start with a small, deterministic ODE world and make every numerical
approximation inspectable before adding collision, deformation, or a game.

## Phase 0

`OscillatorState = { x, v }` with:

```text
dx/dt = v
dv/dt = -(k / m) x
```

The model is headless. Integrators consume the same derivative definition.
The browser is an inspector over named deterministic runs, never the source of
simulation truth.

## Boundary

Do not introduce a universal physics engine. When a second concrete scenario
needs the same abstractions, extract only vector math, ODE contracts,
integrators, deterministic traces, and analytic-test helpers.

Future branches are rigid bodies (poses, inertia, impulses, joints) and spring
bodies (particles, bonds, fracture, collision skin), as described in the root
developer record's future-project designs.
