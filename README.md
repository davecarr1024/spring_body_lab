# Spring Body Lab

Spring Body Lab is a deterministic soft-body game project built in layers: a
tested 2D math/geometry library, a headless physics library, then a browser
game that consumes them. It asks how small explicit rules can create deformable
worlds that remain fun, inspectable, and explainable.

The current vertical slice is a two-particle spring toy. Its browser controls
issue deterministic game commands; the game delegates to physics; physics uses
the public math layer and returns the forces and state the browser displays.

## Run locally

```bash
npm test
npm run coverage
npm run build
npm run check
```

Open `dist/index.html` after building.

## What works now

- immutable vector, scalar-tolerance, segment, AABB, closest-point, and
  classified-intersection APIs;
- validated immutable physics worlds with one fixed-step spring transition;
- force evidence, pin handling, and command-driven impulses;
- a headless game slice plus a browser view of its returned physics evidence.

This is not yet collision or a complete soft-body game. The current slice is a
proof that the layers compose correctly; fixed geometry contact is next.

## Read deeper

- [Current status](docs/status.md) is the capability tour, evidence, limits,
  and next question.
- [Technical description](docs/technical-description.md) maps the code,
  public interfaces, data flow, and verification boundaries.
- [Design and roadmap](docs/design.md) is the canonical design and phased
  path to the soft-body game.
- [Roadmap](docs/roadmap.md) records current vertical-slice gates.
- [Design review](docs/design-review.md) evaluates the active architecture
  against the cross-repository project standards.
- [Agent guide](AGENTS.md) gives commands and contribution constraints.

## Next small step

Finish explicit trace/replay evidence for the physics step, then introduce one
fixed geometry contact through the public math API. No new browser feature
should precede that headless proof.
