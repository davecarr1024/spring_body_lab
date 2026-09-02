# Engine Roadmap

Each phase is a vertical slice. It is complete only when its public library
interface, headless proof, focused tests, documentation, and inspectable
artifact exist. A browser feature never substitutes for lower-layer evidence.

## Phase 1 — Math and geometry kernel (complete)

**Deliverable:** immutable `Vec2`, scalar/tolerance helpers, segments, AABBs,
closest-point/distance, orientation, and classified segment intersections.

**Evidence:** table-driven geometric boundary cases, diagnostic results,
explicit absolute/relative tolerance values threaded through vector/geometry
queries, and 100% production line/function coverage. The physics layer now
consumes this completed public boundary rather than reimplementing geometry.

## Phase 2 — Physics kernel: one spring (active)

**Deliverable:** validated immutable definition/state values, fixed-step
semi-implicit Euler, force records, and command-driven impulses for a
pinned/free spring.

**Evidence:** equal-and-opposite spring force, rest-length zero force, pinned
invariance, malformed-world diagnostics, deterministic replay, and a readable
step record. The first implementation exists; its next bite is explicit trace
and replay artifacts rather than more scene features.

## Phase 3 — First browser game slice (active)

**Deliverable:** a browser scene whose Step/Play/Kick controls issue game
commands to the physics library and display returned evidence.

**Evidence:** a built static artifact plus Playwright smoke tests showing that
each control changes the public game/physics state, never browser-owned state.
The minimal scene exists; implement the focused
[browser-testing plan](browser-testing.md) as its remaining exit evidence.

## Phase 4 — Fixed geometry contact

**Deliverable:** particle/plane, then particle/fixed-segment contact using the
geometry library, with bounded correction records.

**Evidence:** no persistent penetration beyond declared tolerance, visible
normal/correction records, and bounded bounce/rest cases.

## Phase 5 — Generated soft bodies

**Deliverable:** deterministic rectangular/triangular-grid body recipes,
validated topology, boundary derivation, and a hanging sheet scene.

**Evidence:** identical recipes/seeds reproduce IDs, geometry, faces, edges,
and trace; structural and diagonal springs remain independently inspectable.

## Phase 6 — Multiple bodies and self-collision

**Deliverable:** particle-pair contacts, uniform-grid broad phase, and explicit
topology exclusions.

**Evidence:** separate bodies do not retain deep overlap; adjacent particles do
not explode; selected particles report candidates, exclusions, and contacts.

## Phase 7 — Strain and fracture

**Deliverable:** local strain telemetry, deterministic spring breakage, event
records, and component reporting.

**Evidence:** a deliberately weak spring breaks on a known step, applies no
future force, and remains replayable without non-finite state.

## Phase 8 — Soft-body game

**Deliverable:** named rope, sheet, block, weak-wall, and ram scenes with
player goals, replay, pause/step, diagnostics, and recipe sharing.

**Evidence:** a player can create a reproducible breach or construction result
whose action trace and physics evidence explain the outcome.

## Deferred proposals

3D, fluid/shader work, rich fracture, continuous collision, alternative
integrators, and performance work each require a fresh design and a concrete
need from an existing scene. They inherit no automatic scope from this plan.
