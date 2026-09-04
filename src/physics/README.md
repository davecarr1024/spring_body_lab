# Physics module

`src/physics/` is a headless, deterministic 2D soft-body library. Its public
entry point is `src/physics/index.ts`; it depends only on `math` and never
reads browser state, clocks, or randomness.

```mermaid
flowchart TD
  Definition[WorldDefinition\nimmutable particles, springs, contacts] --> Initial[createInitialState]
  Initial --> Step[step(definition, state, commands)]
  Commands[immutable applyImpulse commands] --> Step
  Step --> Forces[gravity + Hooke/damping forces]
  Forces --> Integrate[semi-implicit Euler]
  Integrate --> Contacts[fixed + pair contact solve]
  Contacts --> Fracture[strain telemetry + tensile breakage]
  Fracture --> Result[StepResult\nstate, forces, contacts, events, components]
  Result --> Trace[immutable trace/replay]
```

## Public concepts

`types.ts` names the typed interface: validated `WorldDefinition`, evolving
`WorldState`, `StepResult`, commands, spring strain/force records, fracture
events, and connected components. The library is data-oriented: each step
returns a new frozen state rather than mutating a world object.

Spring strain is signed `(currentLength - restLength) / restLength`. It is
explicitly `undefined_rest_length` for a zero-rest spring. A spring with an
optional `breakStrain` breaks only under tensile strain at or above that
threshold. Force-record strain describes the beginning-of-step force sample;
fracture evaluates the completed post-contact state, so it still contributes
force on its breaking step and is omitted from all future steps. The returned
component report is recalculated from intact springs in stable declaration
order.

`body.ts` provides deterministic rectangular recipes, while `trace.ts` records
normalized commands and recomputes the full sequence for replay verification.
