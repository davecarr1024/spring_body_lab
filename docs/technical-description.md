# Technical Description

## Ownership and dependency graph

The implementation follows the canonical design's one-way dependency graph:

```text
src/browser/app.mjs
        │
src/game/springToy.mjs
        │
src/physics/world.mjs
        │
src/math/{scalar,vec2,geometry}.mjs
```

`math` has no project dependency. `physics` depends only on math. `game`
creates named deterministic worlds and advances them only through physics.
`browser` turns DOM events into public game commands and renders returned
records. Tests mirror this directory structure. No production module depends
on a test, a renderer, or an ambient clock/random source.

## Math and geometry API

`scalar.mjs` owns validated immutable absolute/relative tolerance values,
finite-number checks, scaled approximate comparison, near-zero classification,
and immutable diagnostics. `vec2.mjs` exports immutable vector values and pure
arithmetic, dot/cross, length/distance, normalization, and projection.
Normalization and projection return tagged `unit`/`point` or `degenerate`
results and accept the shared tolerance contract.

`geometry.mjs` validates `Segment2` and `Aabb2` values and returns structured
success/diagnostic results. Closest-point and intersection queries accept the
same tolerance contract. Its intersection operation returns one of
`none`, `point`, `overlap`, or `degenerate`; a point includes its witness and
whether it is an endpoint touch. This makes contact code a future consumer of
geometry evidence rather than the owner of private segment arithmetic.

## Physics API

`createWorldDefinition` validates a world before it is usable. A successful
definition contains frozen particle/spring declarations, gravity, and fixed
timestep; failure contains frozen, context-rich diagnostics. A particle has a
stable string ID, `Vec2` position/velocity, and non-negative inverse mass.
Zero inverse mass is a pin. Springs have distinct existing endpoints and
finite non-negative rest length, stiffness, and damping.

`createInitialState(definition)` creates a separate immutable runtime state.
`step(definition, state, commands)` returns an immutable `StepResult` with:

- next `WorldState` and incremented step index;
- one spring force record per intact spring, including extension and the
  equal-and-opposite endpoint forces, or an explicit `degenerate` record;
- empty diagnostics/events collections reserved for later constraints,
  contacts, and fracture.

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

## Game and browser

`createSpringToy` supplies one named scene with a pin, bob, gravity, and a
spring. `advanceGame` preserves the definition, delegates to `step`, and
records command facts. The browser has no force/integration implementation:
its buttons emit `applyImpulse` or no command, then render the returned state
and spring force record.

`scripts/build.mjs` is deliberately thin build glue. It copies `src/` to
`dist/src/` and rewrites the static page paths. `dist/` is generated and not
source-controlled. Browser source is excluded from headless coverage because
it is platform glue; the required evidence for it is a successful static build
and, at Phase 3 exit, Playwright browser smoke tests. The planned configuration
starts the built static artifact with Playwright's local `webServer`, drives
role-addressable controls, and retains trace/screenshot artifacts on failures;
see [browser-testing.md](browser-testing.md).

## Verification contract

`npm test` runs tests split by math, physics, and game layer. `npm run
coverage` runs the same suite with Node's coverage report. `npm run check`
runs coverage then produces the browser artifact. The current headless
production modules have 100% line/function coverage; branch coverage is
reported and should increase as validation/replay cases are added.

The library tests prove public behavior rather than source-only output:
vectors/geometry classify boundaries, invalid worlds report diagnostics, a
spring's force is equal/opposite and zero at rest, pins remain fixed, impulses
pass through the game/physics boundary, and a degenerate spring remains an
explicit record. The missing browser automation is documented in the roadmap,
not silently treated as model coverage.
