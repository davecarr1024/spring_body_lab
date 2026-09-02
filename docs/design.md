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

## Phase 1: gravity

Add free fall as a second `x, v` world. It supplies constant acceleration
through the same derivative contract and has its own analytic reference:

```text
dx/dt = v
dv/dt = g
```

This is the first proof that the integrators belong to a reusable ODE boundary,
rather than being special-purpose spring code. Do not extract a general library
yet: first add damping, then make the smallest honest extraction.

## Boundary

Do not introduce a universal physics engine. When a second concrete scenario
needs the same abstractions, extract only vector math, ODE contracts,
integrators, deterministic traces, and analytic-test helpers.

Future branches are rigid bodies (poses, inertia, impulses, joints) and spring
bodies (particles, bonds, fracture, collision skin), as described in the root
developer record's future-project designs.

## Later Shader and Fluid Chapter

Fluid simulation is a later sibling adventure, not the next feature. Begin it
as an accessible grid-based dye-and-velocity experiment, then use fragment or
compute shaders for advection and pressure projection. It shares the project's
energy, numerical-stability, deterministic-scenario, and visualization values,
but should earn its own model and tests before sharing implementation details
with solids.
