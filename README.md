# Spring Body Lab

Spring Body Lab is a deterministic TypeScript soft-body game project built in layers: a
tested 2D math/geometry library, a headless physics library, then a browser
game that consumes them. It asks how small explicit rules can create deformable
worlds that remain fun, inspectable, and explainable.

The current vertical slice is **Mossyard Courier**, a standalone real-time
soft-body delivery game. Steer a textured moss courier to the moon gate with
WASD/arrow keys or a mouse course; its browser controls issue deterministic
game commands while physics returns the springs, contacts, corrections,
fracture, and state the browser displays.

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
Open `dist/mossyard.html` for the focused playable demo.

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
- Breach Run, a composite mission where Fire breach charge physically contacts
  and breaks the goal seam in a multi-body arena.
- Mossyard Courier, a standalone live keyboard/mouse delivery mission with
  renderer-owned texture skins for generated soft-body faces.

This is still a compact soft-body game proof, not a general engine. Phases 1–8
establish the reusable layers; Breach Run proves that those layers can support
a composite player goal without speculative solver expansion.

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

Phases 1–9 are complete; Mossyard Courier is the first game-presentation
extension. Future features begin only from a concrete scene need and a fresh
design, rather than expanding the solver speculatively.
