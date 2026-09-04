# Current Status

Spring Body Lab has been reset around its actual destination: a browser
soft-body game assembled from a headless physics library and a lower-level
math/geometry library. The old oscillator was an exploration spike, not a
foundation that constrained the redesign.

## What works today

The repository now contains an interactable multi-body compositional slice:

```text
browser controls → deterministic game action → physics StepResult → math values
```

| Layer | Current capability | Evidence |
| --- | --- | --- |
| Math/geometry library | typed immutable vectors/scalars, segments, AABBs, circles, polygon containment, classified intersections, and Euler/RK4 scalar/Vec2 ODE traces | unit tests cover ordinary, boundary, tolerance, overlap, degeneracy, numerical order, and invalid derivative cases |
| Physics library | radius-aware particles, fixed segments, bounded correction/velocity repair, grid broad phase, direct-neighbor exclusions, immutable trace/replay | tests prove diagnostics, pin invariance, spring forces, fixed and pair contacts, exclusions, and replay |
| Game | deterministic recipes for two two-by-two soft bodies in a fixed arena | test proves recipe composition and deterministic command result |
| Browser | Step, Play, Nudge amber/blue, and Reset controls rendering state, springs, contacts, and normals | five Playwright Chromium smoke tests against the built artifact, including stable Play/Pause controls |

The browser deliberately displays a small real scene rather than numerical
plots. The spring extension and force readouts come from the returned physics
step record, not calculations hidden in the renderer.

## Current limitations

There are not yet fracture, persistent trace serialization, game goals, or a
general solver. The two-body arena is a deliberately bounded proof of contact
and generated-body composition, not yet a complete soft-body game.

Phase 1 is complete: the math kernel owns a validated, named
absolute/relative tolerance policy and threads it through its relevant
classification queries. New physics behavior must use that public boundary.

## Next smallest work

Phases 1–6 are complete through one small multi-body arena. The next smallest
work is Phase 7: local strain telemetry and deterministic breakage. See the
[roadmap](roadmap.md) for the gate.
