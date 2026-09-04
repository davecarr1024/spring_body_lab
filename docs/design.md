# Spring Body Lab Design

## Project thesis

Spring Body Lab is a browser-playable soft-body game developed from a small,
deterministic physics library, itself built on a rigorously tested 2D math and
geometry library. The project's question is:

> Can a few clear physical and geometric rules produce deformable worlds that
> are fun to play with and whose behavior remains possible to inspect, test,
> and explain?

The final game is not the reason to skip the foundations; it is the pressure
that makes the foundations honest. Every layer must be useful on its own,
present a deliberate public interface, and earn the next layer through a small
vertical slice.

"Spring Body Lab" is descriptive rather than product-polished: the spring body
is the project's fundamental object, and the lab is the place where the engine
and eventual game remain inspectable.

## The current sketch is not the architecture

The former scalar oscillator/free-fall browser was an exploration spike. It
proved that deterministic traces, numerical comparison, and a visual inspector
are worthwhile. It did **not** prescribe the public physics API, module layout,
timestep contract, vector model, or game design, and has been replaced. Keep
only the lessons that fit the new boundary: rendering cannot alter simulation
state; deterministic runs are replayable; and model claims need executable
evidence.

## Product shape

The eventual experience is a small 2D soft-body game: the player creates,
grabs, drops, launches, compresses, and breaks soft structures in named scenes.
Rope, sheet, block, and weak-wall bodies are the intended early toys.
Mossyard Courier is the first focused presentation: a standalone live delivery
scene where keyboard and pointer steering issue only game-owned impulses, and
a gate goal is derived from physics state. It proves game feel without
introducing a general engine or progression framework.

The first whole-project playable slice is deliberately tiny: step or kick a
two-point spring body in a browser scene and inspect its returned state, spring
force, and extension. That slice is built from the public physics library,
which is built from the public math library; the browser contains no private
simulation shortcut.

## Layered libraries and dependency rule

```text
browser game / browser inspector
              │ uses
              ▼
       soft-body physics library
              │ uses
              ▼
       math and geometry library
```

Dependencies point down only. Each library is headless and has no DOM, canvas,
ambient clock, random generator, scene file, or game dependency. The game is a
consumer of completed physics evidence, not a second implementation of it.

| Layer | Public responsibility | Never owns |
| --- | --- | --- |
| `math` | immutable values, tolerance policy, 2D geometry, classified query results | particles, browser state, game rules |
| `physics` | validated soft-body definitions, world state, fixed stepping, forces, constraints, contacts, traces | DOM events, rendering, level progression |
| `game` | scenes, player commands, goals, display mapping, save/replay choices | vector arithmetic, private force/contact rules |
| `browser` | input adaptation and rendering of game/physics evidence | mutation of physical state outside a physics command |

The source tree should make this visible as those layers arrive:

```text
src/
  math/       public, dependency-free math/geometry library
  physics/    public, headless soft-body library depending on math
  game/       deterministic scene/game model depending on physics
  browser/    browser adapter depending on game and public library APIs
tests/
  math/ physics/ game/ browser/
```

Do not retain a flat `oscillator.mjs` as a compatibility center. It may survive
as a numerical-example consumer of the future libraries, or be deleted.

## Math and geometry library

The math library is the first load-bearing vertical slice. Its first public
types are immutable `Vec2`, `Segment2`, `Aabb2`, and explicit classified result
values. Operations include vector arithmetic, dot/cross products, length and
distance, normalization, projection, clamping, AABB operations, closest point
on a segment, orientation, and segment intersection.

There is one tolerance policy, owned by this library:

- IDs and step numbers use exact comparisons; floating-point geometry does not.
- Named absolute/relative tolerance helpers replace scattered epsilon literals.
- Near-zero normalization and degenerate segments return explicit `degenerate`
  outcomes or fail validation; they never create a hidden `NaN`.
- Segment intersection distinguishes none, endpoint touch, proper crossing,
  collinear overlap, and degeneracy. Results retain the witness point,
  parameters, or overlap segment needed to inspect them.
- Public inputs and outputs are finite, validated values. Invalid construction
  returns context-rich structured diagnostics before physics can consume it.

Geometry is not a convenience helper buried in contact code. It is a trusted,
tested public boundary that makes future contacts explainable.

## Physics library

The physics library uses the math API rather than reimplementing it. It has
three separate public concepts:

```text
WorldDefinition: immutable, validated structure and settings
WorldState:      immutable evolving particle/spring state at a step index
StepResult:      next state plus forces, contacts, corrections, events, diagnostics
```

`step(definition, state, commands) -> StepResult` is the authoritative state
transition. It neither mutates caller-owned values nor consults browser state.
Commands are immutable, step-indexed facts. The current public command is
`applyImpulse`; `setGrabTarget` and `releaseGrab` are later
contact/constraint work. The game may issue commands; it cannot write a
particle's position or velocity directly.

The first body is a graph of particles and springs. Current particle
definitions carry a stable ID, position, velocity, and inverse mass; radius is
introduced with the first contact phase. `inverseMass = 0` means pinned; any
non-pinned inverse mass is finite and positive. Spring definitions name two
distinct declared particle IDs, rest length, stiffness, and damping.
Definitions reject duplicate IDs, unknown endpoints, non-finite numbers, and
invalid bounds before a simulation step occurs.

For an intact spring, with `d = pb - pa`, unit direction `n`, extension
`|d| - restLength`, and axial speed `dot(vb - va, n)`, its endpoint force is:

```text
n * (stiffness * extension + damping * axialSpeed)
```

The opposite endpoint receives the exact negative. Zero-length/degenerate
directions take an explicitly recorded safe path; the engine never invents a
normal.

The initial integration contract is one documented fixed timestep and
semi-implicit Euler. It is a baseline chosen for a clear first proof, not a
pluggable solver framework. Another integrator is admitted only when a named
scene establishes a need and tests show its tradeoff.

The fixed step has one inspectable order:

```text
validate commands → external forces → internal forces → integrate
→ generate contacts → bounded constraint/contact solve → velocity repair
→ damage/breakage → StepResult evidence
```

## Contacts, topology, and fracture

Contacts build outward from the geometry library: particle/ground plane,
particle/fixed segment, particle/particle across bodies, then a uniform-grid
broad phase. Candidate generation, filtering, narrow-phase classification,
and correction remain separate records in `StepResult`.

Soft-body geometry and its spring graph are related but distinct. A generated
sheet records particles, structural/diagonal springs, faces, and boundary
edges. The generator has stable IDs, a recorded seed, and topology validation.
It starts with rectangular/triangular grids only. Self-collision later excludes
self, direct graph neighbors, and particles sharing a face/cell; each
exclusion is inspectable.

Fracture begins with a local signed tensile-strain threshold on a spring.
Breakage emits an event after the completed step and removes only that spring's
future force. Stable component recomputation preserves IDs and history. Shear,
bending, mesh splitting, 3D, and continuous collision are future hypotheses,
not hidden requirements.

## Game and browser boundary

The game layer names scenes, recipes, objectives, and player-facing commands.
It should have a deterministic headless scene state so a game action sequence
can be replayed without a browser. The browser maps pointer input to game
commands, advances/display-scrubs recorded results, and renders only facts
already computed by the game and physics libraries. A renderer-owned skin maps
a generated body's face IDs to textures and colors; it never changes the body
recipe or physics state.

The browser inspector exposes particles, springs, faces, forces, contact
normals, broad-phase cells, constraints, strain, events, energy caveats, and
step timing. It is a debugging/game-explanation surface, not merely a demo.

## Determinism and interfaces

All definition order, IDs, commands, contact tie breaks, and generator seeds
are explicit. A replay records a world recipe, engine settings, ordered
commands, and the resulting step evidence. Any API that can fail uses a
structured diagnostic/result type with the offending ID/value and operation;
it does not silently repair invalid worlds.

The desired interface quality is compositional: a reader can use `Vec2`
without physics, use a physics probe without the game, and use a game scene
without the browser. Each layer's types say which layer owns the fact.

## Scope boundaries

- Start in 2D, with small finite scenes and deterministic fixed steps.
- Do not build an ECS, plug-in solver system, generic collider, GPU solver,
  arbitrary concave decomposition, or engineering-grade finite-element tool.
- Do not hide instability with tuning; expose bounds, diagnostics, and known
  limitations.
- Do not make real-material claims for named spring recipes.
- Do not begin game progression or rich controls before the same physics slice
  exists headlessly and is proved.

## Phased vertical slices

The detailed gates are in [roadmap.md](roadmap.md). The sequence deliberately
builds composition from simple conceptual pieces:

1. a tested math/geometry library and diagnostic probe;
2. a tested physics library with one spring and a textual trace;
3. the first browser/game slice consuming that library;
4. ground contact and a single-body scene;
5. deterministic generated sheets;
6. multiple bodies and self-collision;
7. strain, fracture, and a weak wall;
8. a soft-body game built from these completed pieces;
9. a composite Breach Run mission; and
10. a standalone real-time Mossyard Courier game with direct controls and
    renderer-owned textured face skins.

A phase is complete only with its headless artifact, public interface tests,
documentation, and a visible proof. No browser polish or generic abstraction
may outrun a smaller lower-layer proof.

## Testing standard

The default goal is 100% coverage for production code in `math`, `physics`,
and `game`. Coverage is only the floor. Tests must prove each layer's contracts:

- math identities, tolerance boundaries, and geometry classifications;
- definition validation and structured diagnostics;
- equal-and-opposite spring forces, rest-length zero force, pin invariance,
  finite state, and deterministic replay;
- contact tolerance, visible normal/correction, topology exclusions, and
  deterministic generation;
- game commands yielding the expected replayable physics events;
- Playwright browser controls and overlays displaying existing evidence rather
  than performing private analysis; see
  [browser-testing.md](browser-testing.md).

Use named, small scenario regressions: one spring, dropped body, hanging
sheet, colliding blocks, and weak wall. Compare selected states, events, and
bounds—not opaque frame dumps.
