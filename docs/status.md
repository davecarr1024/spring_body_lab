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
| Physics library | radius-aware particles, fixed segments, bounded correction/velocity repair, grid broad phase, direct-neighbor exclusions, signed strain, tensile fracture, stable components, rectangular and rope recipes, immutable and portable trace/replay | tests prove diagnostics, pin invariance, force/strain evidence, fixed and pair contacts, exclusions, breakage, components, recipe topology, replay, and serialized replay |
| Game | deterministic multi-body lab plus named fracture, rope, sheet, ram, Breach Run, and Mossyard Courier goals | tests prove recipe composition, deterministic commands, returned break IDs, component split, goals, trace replay, and repeated-result equality |
| Browser | lab inspector and a standalone live Mossyard game with keyboard/mouse steering, focused controls, mission feedback, and textured faces | twelve Playwright Chromium tests cover the built artifact, including real-time keyboard/mouse Mossyard play and its standalone route |

The browser deliberately displays a small real scene rather than numerical
plots. The spring extension and force readouts come from the returned physics
step record, not calculations hidden in the renderer.

## Current limitations

Portable trace serialization and game goals now exist. There is still no
general-purpose solver, rich fracture system, or authored progression layer.
Breach Run and Mossyard Courier prove a multi-body physical mission, direct
player action, presentation feedback, and browser objective can compose without
hiding outcome logic in the renderer. Rich progression remains deliberately
out of scope.

Phase 1 is complete: the math kernel owns a validated, named
absolute/relative tolerance policy and threads it through its relevant
classification queries. New physics behavior must use that public boundary.

## Next smallest work

Phases 1–8 are complete. Breach Run is a scene-led extension of that planned
scope; deferred proposals still require a fresh design and a concrete scene
need.
See the [roadmap](roadmap.md) for those deliberate boundaries.
