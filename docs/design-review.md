# Design Review Against Project Standards

This review evaluates the rebuilt project against the cross-repository
principles in `davecarr1024`: small deterministic worlds, direct domain models,
composition, verified vertical slices, inspectable evidence, and documentation
that remains synchronized with implementation.

| Principle | Decision in this redesign | Present evidence | Next check |
| --- | --- | --- | --- |
| One concrete world | The target is a 2D soft-body game, not a general physics platform. | Design names rope/sheet/block/wall scenes and excludes ECS/GPU/general colliders. | Reject abstractions that no current scene needs. |
| Composition from simple concepts | Public math → physics → game → browser dependency direction. | Separate directories and public entry points; browser uses game API, game uses physics API. | Keep imports one-way during contact/generation work. |
| Vertical slices | Each phase must create an independently runnable lower-layer artifact before expanding scope. | Two-particle spring is a headless physics probe and browser/game slice. | Complete trace/replay evidence before fixed contact. |
| Determinism | State transition is fixed-step and values/commands are immutable. | World definition/state, `StepResult`, stable IDs, and tests. | Add serialized replay and tie-break tests. |
| Inspectable causality | Forces and later contacts/events are first-class output rather than renderer analysis. | Browser renders a physics force record and state returned by `StepResult`. | Add contact candidate/correction records with fixed geometry. |
| Direct domain modelling | The kernel models vectors, geometry, particles, springs, and world state directly. | Validated `Vec2`, segments/AABBs, particle/spring definitions. | Keep mesh topology distinct from spring graph. |
| Tests as deliverable | Public behavior is tested by library layer. | 100% current production line/function coverage; boundary/degenerate cases included. | Raise branch coverage through command/replay validation and implement the planned Playwright browser suite. |
| Clear interfaces | Each layer owns distinct types and uses public index entry points. | `src/math/index.mjs`, `src/physics/index.mjs`, `src/game/index.mjs`. | Document semantic-version-like compatibility decisions if external reuse begins. |

## Conclusions

The redesign corrects the old project's main structural risk: treating a
scalar demonstration as a physics architecture. The active code now proves the
intended composition with a deliberately small real behavior. It is not yet a
soft-body engine, and the documentation says so plainly.

The most important remaining risk is premature expansion. Contact, mesh
generation, and fracture all want more types and algorithms. The roadmap's
gates deliberately require a lower-layer proof and inspectable record before
each is admitted. Browser polish, game goals, and generic solver interfaces
remain deferred until those proofs exist.

## Iteration rule

At every phase boundary, repeat this review against `docs/design.md`,
`docs/roadmap.md`, the public entry points, coverage output, and the relevant
browser artifact. Record a new tradeoff when a proposed feature would reverse
a dependency, hide a physical decision, or cannot produce a narrow executable
proof.
