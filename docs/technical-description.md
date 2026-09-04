# Technical Description

## Ownership and dependency graph

The implementation follows the canonical design's one-way dependency graph:

```text
src/browser/app.ts
        │
src/game/springToy.ts
        │
src/physics/world.ts
        │
src/math/{scalar,vec2,geometry}.ts
```

`math` has no project dependency. `physics` depends only on math. `game`
creates named deterministic worlds and advances them only through physics.
`browser` turns DOM events into public game commands and renders returned
records. Tests mirror this directory structure. No production module depends
on a test, a renderer, or an ambient clock/random source.

## Math and geometry API

`scalar.ts` owns validated immutable absolute/relative tolerance values,
finite-number checks, scaled approximate comparison, near-zero classification,
and immutable diagnostics. `vec2.ts` exports immutable vector values and pure
arithmetic, dot/cross, length/distance, normalization, and projection.
Normalization and projection return tagged `unit`/`point` or `degenerate`
results and accept the shared tolerance contract.

`geometry.ts` validates `Segment2` and `Aabb2` values and returns structured
success/diagnostic results. Closest-point and intersection queries accept the
same tolerance contract. Its intersection operation returns one of
`none`, `point`, `overlap`, or `degenerate`; a point includes its witness and
whether it is an endpoint touch. This makes contact code a future consumer of
geometry evidence rather than the owner of private segment arithmetic.

The public math entry point also exports immutable `Circle2` and polygon
queries (containment, signed area, bounds, closest points, and distances) plus
typed scalar/vector operations such as interpolation, rotation, rejection, and
reflection. `ode.ts` supplies explicit Euler and classical RK4 for finite
scalar or `Vec2` states. Each solver returns an immutable time/state trace and
evaluation count; malformed settings, shape changes, and non-finite derivative
results return structured diagnostics rather than contaminating a simulation.

## Physics API

`createWorldDefinition` validates a world before it is usable. A successful
definition contains frozen particle/spring/fixed-segment declarations, gravity,
contact settings, and fixed
timestep; failure contains frozen, context-rich diagnostics. A particle has a
stable string ID, `Vec2` position/velocity, non-negative inverse mass, and a
non-negative collision radius. Zero inverse mass is a pin. Springs have distinct existing endpoints and
finite non-negative rest length, stiffness, and damping.

`createInitialState(definition)` creates a separate immutable runtime state.
`step(definition, state, commands)` returns an immutable `StepResult` with:

- next `WorldState` and incremented step index;
- one spring force record per intact spring, including extension and the
  equal-and-opposite endpoint forces, or an explicit `degenerate` record;
- immutable contact records, fracture events, and post-fracture component
  reports plus diagnostics.

The current integration is semi-implicit Euler. Forces accumulate as gravity
and Hooke-plus-axial-damping spring force. The force on `b` is calculated as
the negative of force on `a`; pins retain their exact state. `applyImpulse` is
the only implemented command and converts a finite game impulse to a velocity
change through inverse mass. Malformed/unknown commands are rejected into
structured `invalid_command` diagnostics without advancing an invalid impulse.

`createTrace` owns a definition, initial state, current state, and immutable
ordered entries. `appendTraceStep` freezes a command record alongside the
pre-step index and returned `StepResult`. `replayTrace` starts at the retained
initial state and reconstructs the complete trace from those records. This is
in-memory replay evidence; serialization/persistence is deliberately deferred.

After integration, fixed geometry uses public point-to-segment distance
evidence. Particle-pair candidates come from a deterministic uniform grid;
direct spring neighbors are excluded before narrow phase. Contact records retain
normal, penetration, bounded correction, and velocity repair/impulse.

Each force record includes signed local strain when its rest length is nonzero;
zero-rest and zero-direction cases retain explicit classifications. A spring
may set a finite non-negative `breakStrain`. Once post-integration tensile
strain reaches the threshold, the current `StepResult` emits a `spring_break`
event; future steps omit that spring. Stable declaration-order graph traversal
then reports the remaining connected components. The whole evidence remains in
the immutable trace and is verified by replay.

## Game and browser

`createSpringToy` remains a small compatibility probe. `createMultiBodyLab`
builds two deterministic grid bodies in a floor-and-wall arena. `advanceGame`
preserves the definition, delegates to `step`, and records command facts. The
browser emits `applyImpulse` or no command, then renders returned state,
springs, contacts, and normals.

`scripts/build.mjs` invokes TypeScript into `dist/src/`, copies the browser
stylesheet, and writes the static page. `dist/` is generated and not
source-controlled. Browser source is excluded from headless coverage because
it is platform glue; the required evidence for it is a successful static build
and, at Phase 3 exit, Playwright browser smoke tests. `playwright.config.mjs`
starts the built static artifact with a local `webServer`, drives
role-addressable controls, and retains trace/screenshot artifacts on failures;
see [browser-testing.md](browser-testing.md).

## Verification contract

`npm run typecheck` validates TypeScript source. `npm test` runs tests split by math, physics, and game layer. `npm run
coverage` runs the same suite with Node's coverage report. `npm run
test:browser` runs the five built-artifact Playwright smoke tests. `npm run
check` runs coverage then the browser suite. The current headless
production modules have 100% line/function coverage; branch coverage is
reported and should increase as validation/replay cases are added.

The library tests prove public behavior rather than source-only output:
vectors/geometry classify boundaries, invalid worlds report diagnostics, a
spring's force is equal/opposite and zero at rest, fixed/pair contacts are
bounded and inspectable, direct neighbors are excluded, and a degenerate spring
remains an explicit record. Browser tests prove the initial multi-body arena,
Step/Nudge/Reset, and stable Play/Pause controls without duplicating the physics
model in page code.
