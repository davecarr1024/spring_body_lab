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
| Physics library | radius-aware particles, fixed segments, bounded correction/velocity repair, grid broad phase, direct-neighbor exclusions, signed strain, tensile fracture, stable components, rectangular and rope recipes, immutable trace/replay | tests prove diagnostics, pin invariance, force/strain evidence, fixed and pair contacts, exclusions, breakage, components, recipe topology, and replay |
| Game | deterministic multi-body lab, weak-wall breach, pinned-rope swing, and pinned-sheet lift with explicit outcome goals | tests prove recipe composition, deterministic commands, returned break IDs, component split, position thresholds, goal achievement, and repeated-result equality |
| Browser | Step, Play, Nudge amber/blue, weak-wall load/Ram, rope load/Swing, sheet load/Lift, and Reset controls rendering state, goals, springs, contacts, normals, breaks, and components | eight Playwright Chromium smoke tests against the built artifact, including end-to-end weak-wall, rope, and sheet goals plus stable Play/Pause controls |

The browser deliberately displays a small real scene rather than numerical
plots. The spring extension and force readouts come from the returned physics
step record, not calculations hidden in the renderer.

## Current limitations

There are not yet persistent trace serialization, game goals, or a general
solver. The two-body arena is a deliberately bounded proof of contact,
generated-body composition, and simple fracture—not yet a complete soft-body
game.

Phase 1 is complete: the math kernel owns a validated, named
absolute/relative tolerance policy and threads it through its relevant
classification queries. New physics behavior must use that public boundary.

## Next smallest work

Phases 1–7 are complete and Phase 8 has named weak-wall and rope scenes. The
next smallest work is a deterministic block goal with the same replay evidence.
See the [roadmap](roadmap.md) for the remaining gate.
