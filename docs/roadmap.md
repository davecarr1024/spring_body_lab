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

## Phase 2 — Physics kernel: one spring (complete)

**Deliverable:** validated immutable definition/state values, fixed-step
semi-implicit Euler, force records, and command-driven impulses for a
pinned/free spring.

**Evidence:** equal-and-opposite spring force, rest-length zero force, pinned
invariance, malformed-world diagnostics, immutable step-indexed trace entries,
and deterministic replay that reconstructs the recorded `StepResult` evidence.

## Phase 3 — First browser game slice (complete)

**Deliverable:** a browser scene whose Step/Play/Kick controls issue game
commands to the physics library and display returned evidence.

**Evidence:** five Playwright Chromium smoke tests run the built static
artifact, cover initial/Step/Kick/Reset/Play-Pause behavior, assert public
evidence, and retain traces/screenshots on failure. The suite found and fixed
an animation re-render that made Pause unstable, proving the browser boundary
rather than merely loading the page.

## Phase 4 — Fixed geometry contact (complete)

**Deliverable:** particle/plane, then particle/fixed-segment contact using the
geometry library, with bounded correction records.

**Evidence:** no persistent penetration beyond declared tolerance, visible
normal/correction records, and bounded bounce/rest cases.

## Phase 5 — Generated soft bodies (complete)

**Deliverable:** deterministic rectangular/triangular-grid body recipes,
validated topology, boundary derivation, and a hanging sheet scene.

**Evidence:** identical recipes/seeds reproduce IDs, geometry, faces, edges,
and trace; structural and diagonal springs remain independently inspectable.

## Phase 6 — Multiple bodies and self-collision (complete)

**Deliverable:** particle-pair contacts, uniform-grid broad phase, and explicit
topology exclusions.

**Evidence:** separate bodies do not retain deep overlap; direct spring
neighbors are excluded from pair contact; a deterministic grid broad phase
feeds the narrow phase; and the browser renders returned contact evidence.

## Phase 7 — Strain and fracture (complete)

**Deliverable:** local strain telemetry, deterministic spring breakage, event
records, and component reporting.

**Evidence:** signed local strain records classify zero-rest/direction edge
cases, a deliberately weak spring breaks on a known post-integration step,
applies no future force, splits stable components, and remains replayable
without non-finite state. The browser renders broken seams and returned break/
component evidence.

## Phase 8 — Soft-body game (first slice complete)

**Deliverable:** named rope, sheet, block, weak-wall, and ram scenes with
player goals, replay, pause/step, diagnostics, and recipe sharing.

**Evidence so far:** the named weak-wall scene carries an explicit set of weak
seam IDs and a breach goal. Its Ram action maps to recorded physics impulses;
one deterministic step returns four break events, splits the wall, marks the
goal achieved, and replays identically. The browser exposes and tests this
path. Named pinned rope/swing and sheet/lift scenes now provide the same
replayable goal evidence. Block and a distinct ram scene remain required to
complete the phase.

## Deferred proposals

3D, fluid/shader work, rich fracture, continuous collision, alternative
integrators, and performance work each require a fresh design and a concrete
need from an existing scene. They inherit no automatic scope from this plan.
