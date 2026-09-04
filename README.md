# Spring Body Lab

Spring Body Lab is a deterministic TypeScript soft-body game project built in layers: a
tested 2D math/geometry library, a headless physics library, then a browser
game that consumes them. It asks how small explicit rules can create deformable
worlds that remain fun, inspectable, and explainable.

The current vertical slice is an interactable arena containing two generated
soft bodies. Its browser controls issue deterministic game commands; the game
delegates to physics; physics uses the public math layer and returns the
springs, contacts, corrections, and state the browser displays.

## Run locally

```bash
npm test
npm run coverage
npm run typecheck
npm run test:browser
npm run build
npm run check
```

Open `dist/index.html` after building.

## What works now

- immutable typed vector/scalar-tolerance APIs; segments, AABBs, circles,
  polygons, closest-point/distance/containment queries, and classified
  intersections; plus deterministic Euler and RK4 scalar/Vec2 ODE traces;
- validated immutable physics worlds with radius-aware particles, fixed
  segments, grid broad-phase candidates, and one fixed-step transition;
- force/contact evidence, bounded correction, direct-neighbor exclusions,
  command-driven impulses, deterministic tensile-spring fracture, connected
  component reports, and deterministic in-memory trace/replay;
- deterministic rectangular soft-body recipes with structural/diagonal springs
  and faces; and
- an interactable browser arena with two bodies, fixed walls/floor, Nudge,
  Step, Play/Pause, Reset, and returned contact-normal rendering; and
- a named weak-wall breach scene whose Ram action creates a deterministic,
  replayable fracture outcome from returned physics evidence; and
- a named pinned-rope swing scene with a state-derived target goal.
- a named pinned-sheet lift scene with a deterministic lower-edge target.
- a named block-and-ram scene whose outcome requires returned particle contact.

This is not yet a complete soft-body game. Phases 1–7 prove the layers compose
correctly; named playable rope, sheet, block, weak-wall, and ram scenes are
next.

## Read deeper

- [Current status](docs/status.md) is the capability tour, evidence, limits,
  and next question.
- [Technical description](docs/technical-description.md) maps the code,
  public interfaces, data flow, and verification boundaries.
- [Math API](docs/math-api.md) describes the published 2D geometry and ODE
  interface.
- [Math module guide](src/math/README.md) and [physics module guide](src/physics/README.md)
  document the local public boundaries and data flow.
- [Design and roadmap](docs/design.md) is the canonical design and phased
  path to the soft-body game.
- [Roadmap](docs/roadmap.md) records current vertical-slice gates.
- [Browser testing plan](docs/browser-testing.md) defines the Playwright
  evidence required to complete the browser slice.
- [Design review](docs/design-review.md) evaluates the active architecture
  against the cross-repository project standards.
- [Agent guide](AGENTS.md) gives commands and contribution constraints.

## Next small step

Phase 8's named scenes are now in place; the next work is a completion audit
and any evidence-driven physics-library gaps it exposes.
