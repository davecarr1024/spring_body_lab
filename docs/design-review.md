# Design Review Against Project Standards

This review evaluates the rebuilt project against the cross-repository
principles in `davecarr1024`: small deterministic worlds, direct domain models,
composition, verified vertical slices, inspectable evidence, and documentation
that remains synchronized with implementation.

| Principle | Decision in this redesign | Present evidence | Next check |
| --- | --- | --- | --- |
| One concrete world | The target is a 2D soft-body game, not a general physics platform. | Design names rope/sheet/block/wall scenes and excludes ECS/GPU/general colliders. | Reject abstractions that no current scene needs. |
| Composition from simple concepts | Public math → physics → game → browser dependency direction. | Separate directories and public entry points; browser uses game API, game uses physics API. | Keep imports one-way during contact/generation work. |
| Vertical slices | Each phase must create an independently runnable lower-layer artifact before expanding scope. | Fixed-segment contact, generated grid recipes, fracture, named goals, and Breach Run each have headless tests before the browser consumes them. | Keep later progression work tied to an explicit mission need. |
| Determinism | State transition is fixed-step and values/commands are immutable. | World definition/state, step-indexed trace entries, `StepResult`, stable IDs, whole-trace replay tests, and versioned portable trace replay. | Add contact tie-break tests only if a scene demonstrates a need. |
| Inspectable causality | Forces, contacts, and events are first-class output rather than renderer analysis. | Browser renders returned springs, particle state, contact count, fixed-segment normals, breaks, components, and game-owned goal status. | Keep mission outcomes derived from game/physics evidence. |
| Direct domain modelling | The kernel models vectors, geometry, particles, springs, and world state directly. | Validated `Vec2`, segments/AABBs, particle/spring definitions. | Keep mesh topology distinct from spring graph. |
| Tests as deliverable | Public behavior is tested by library layer and browser boundary. | 100% production line/function coverage; fixed/pair contact, grid recipe, fracture, trace serialization, and Breach Run tests plus ten Playwright smoke cases. | Raise branch coverage only where a real validation decision needs it. |
| Clear interfaces | Each layer owns distinct types and uses public index entry points. | `src/math/index.ts`, `src/physics/index.ts`, `src/game/index.ts`; math owns validated absolute/relative tolerance values. | Document semantic-version-like compatibility decisions if external reuse begins. |

## Conclusions

The redesign corrects the old project's main structural risk: treating a
scalar demonstration as a physics architecture. The active code now proves the
intended composition with a deliberately small real multi-body behavior. It is
not yet a complete soft-body engine, and the documentation says so plainly.

The most important remaining risk is premature expansion. Breach Run is enough
to prove a multi-body physical mission, but it does not justify generic
progression, rich fracture, or solver abstractions. Future work needs to name
the scene decision it makes observable.

## Iteration rule

At every phase boundary, repeat this review against `docs/design.md`,
`docs/roadmap.md`, the public entry points, coverage output, and the relevant
browser artifact. Record a new tradeoff when a proposed feature would reverse
a dependency, hide a physical decision, or cannot produce a narrow executable
proof.
