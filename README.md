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

- immutable vector, scalar-tolerance, segment, AABB, closest-point, and
  classified-intersection APIs;
- validated immutable physics worlds with radius-aware particles, fixed
  segments, grid broad-phase candidates, and one fixed-step transition;
- force/contact evidence, bounded correction, direct-neighbor exclusions,
  command-driven impulses, and deterministic in-memory trace/replay;
- deterministic rectangular soft-body recipes with structural/diagonal springs
  and faces; and
- an interactable browser arena with two bodies, fixed walls/floor, Nudge,
  Step, Play/Pause, Reset, and returned contact-normal rendering.

This is not yet fracture or a complete soft-body game. Phases 1–6 prove the
layers compose correctly; strain and deterministic spring breakage are next.

## Read deeper

- [Current status](docs/status.md) is the capability tour, evidence, limits,
  and next question.
- [Technical description](docs/technical-description.md) maps the code,
  public interfaces, data flow, and verification boundaries.
- [Design and roadmap](docs/design.md) is the canonical design and phased
  path to the soft-body game.
- [Roadmap](docs/roadmap.md) records current vertical-slice gates.
- [Browser testing plan](docs/browser-testing.md) defines the Playwright
  evidence required to complete the browser slice.
- [Design review](docs/design-review.md) evaluates the active architecture
  against the cross-repository project standards.
- [Agent guide](AGENTS.md) gives commands and contribution constraints.

## Next small step

Add local strain telemetry and one deterministic spring-break event, while
keeping the multi-body arena and its replay evidence stable.
