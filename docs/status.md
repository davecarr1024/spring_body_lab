# Current Status

Spring Body Lab has been reset around its actual destination: a browser
soft-body game assembled from a headless physics library and a lower-level
math/geometry library. The old oscillator was an exploration spike, not a
foundation that constrained the redesign.

## What works today

The repository now contains the first compositional vertical slice:

```text
browser controls → deterministic game action → physics StepResult → math values
```

| Layer | Current capability | Evidence |
| --- | --- | --- |
| Math/geometry library | immutable vectors, validated absolute/relative tolerance values, segments, AABBs, closest point, orientation, classified intersection | unit tests cover ordinary, boundary, tolerance, overlap, and degenerate cases |
| Physics library | world-definition validation, immutable initial state, semi-implicit one-spring step, force records, impulse command, trace/replay | tests prove diagnostics, pin invariance, rest force, equal/opposite force, and whole-trace replay |
| Game | a two-particle spring-toy scene using the physics public API | test proves command recording and returned force evidence |
| Browser | Step, Play, Kick, and Reset controls rendering the existing game/physics record | static build; the documented Playwright smoke suite is the next missing proof |

The browser deliberately displays a small real scene rather than numerical
plots. The spring extension and force readouts come from the returned physics
step record, not calculations hidden in the renderer.

## Current limitations

There are not yet fixed boundaries, contacts, constraints, generated meshes,
soft-body faces, collision broad phase, self-collision, fracture, persistent
trace serialization, game goals, or browser automation. The two-point spring
is a vertical-slice proof of composition, not yet a soft-body game.

Phase 1 is complete: the math kernel owns a validated, named
absolute/relative tolerance policy and threads it through its relevant
classification queries. New physics behavior must use that public boundary.

## Next smallest work

Finish the Phase 3 boundary before widening the scene: implement the focused
[Playwright browser suite](browser-testing.md), then use the geometry library
to introduce one fixed contact. See the [roadmap](roadmap.md) for the gates.
