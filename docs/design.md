# Spring Body Lab design

## Purpose

Spring Body Lab grows from an ODE laboratory into a small, interactive 2D
deformable-body simulation. Its subject is the chain:

```text
state → derivative → integrator → forces → constraints → contact → fracture
```

The eventual toy is a browser scene of point-mass-and-spring bodies that can be
grabbed, dropped, compressed, launched, and broken. A late capstone is a
sandbox with a weak wall and a ram, falling mass, or catapult-like launcher.

Every world has a deterministic headless model. The browser is a review and
interaction adapter; it is never the authority for physics.

## Scope boundaries

- Start in 2D. 3D is an optional later branch after a trustworthy 2D breach
  sandbox.
- Do not build a generic engine, ECS, arbitrary concave collider, GPU solver,
  or engineering-grade finite-element tool.
- Springs are a legible approximation, not a claim that this models masonry or
  rubber faithfully.
- Do not conceal instability with tuning. Measure and display it.

## Current foundation

### Phase 0 — oscillator

`{ x, v }` follows `dx/dt = v`, `dv/dt = -(k/m)x`. The browser compares Euler,
semi-implicit Euler, midpoint/RK2, velocity Verlet, and RK4 with an analytic
reference and visible error/energy drift.

### Phase 1 — free fall

Free fall follows the same solver boundary with `dv/dt = g` and its own exact
solution. Spring and Free fall remain selectable worlds in one lab. This is the
first proof that the integrators are not spring-specific.

## Core contracts

The first shared extraction stays small:

```text
Vec2       = { x, y }
Particle   = { id, position, velocity, mass, inverseMass, force, radius }
Integrator.step(derivative, state, dt) -> nextState
Scenario.step(world, fixedDt) -> nextWorld
Trace      = immutable fixed-step snapshots plus events
```

`inverseMass = 0` means pinned. Clear accumulated force once per fixed step.
Use internally consistent metre/second/kilogram-like units. Render interpolation
may smooth a trace, but may not introduce an independent timestep.

## Soft-body representation

A body has a physical graph and geometric skin. They are related, not identical.

```text
SoftBody
  particles: Particle[]
  springs: Spring[]
  faces: Face[]
  material: MaterialPreset
  collision: CollisionPolicy
  topology: BodyTopology
```

Particles are the only dynamically integrated elements. Faces are boundary
edges and optional render triangles in 2D; in 3D they become triangle faces.
Faces reference particle IDs, so they deform with the body. Springs define
stiffness; faces define visible/collidable shape.

```text
Spring
  a, b: ParticleId
  restLength, stiffness, damping
  tensionLimit, compressionLimit
  state: intact | yielded | broken
```

Starter force is Hooke plus axial damping. For `direction = normalize(pb-pa)`,
`extension = length(pb-pa)-restLength`, and relative axial speed `s`, apply
`direction * (stiffness * extension + damping * s)` to one endpoint and its
negative to the other. Broken bonds apply no force and emit `BondBroken`.

A material preset is a named recipe, not a physical guarantee:

```text
particleMass/density
edge, diagonal, bend stiffness and damping
tensile, compressive, shear strength
collisionRadius, restitution, friction
```

Useful early presets: rubbery sheet, stiff frame, rope/chain, weak wall.

## Deterministic generation

Generation records its recipe and seed so a satisfying collapse can be replayed.

```text
shape → sample points → connect spring graph → make faces/boundary
      → assign material → validate topology → create SoftBody
```

Start with rectangle, disc, rope, and rectangular wall primitives. Point
distribution parameters include grid spacing, density/mass, jitter seed, and
pinned regions. Begin with square and triangular grids because they are easy to
inspect.

Spring patterns are named:

- structural: horizontal/vertical neighbors;
- triangulated: structural plus alternating diagonals;
- cross-braced: both diagonals;
- radial/ring: disc and rope experiments;
- sparse wall: cell edges plus weak mortar-like cross-links.

Derive two render triangles per grid cell and boundary edges from triangle edges
used once. Keep face tessellation independent from diagonal spring choices.
Reject duplicate springs, self-edges, unexpected disconnected graphs, and
non-manifold boundaries.

## Fixed-step simulation

```text
1. clear forces
2. add gravity/drag
3. add spring forces
4. add mouse and joint forces
5. integrate particles
6. solve positional constraints and contacts for bounded iterations
7. update corrected velocities where required
8. evaluate yield/breakage and emit events
9. record snapshot
```

Begin with semi-implicit Euler and velocity Verlet. Keep RK4 as a lesson, not
the presumed contact solver: collision and fracture are discontinuous. Expose
fixed timestep, substeps, and solver choice. Add substeps before experimenting
with implicit Euler or position-based methods; show warnings when a recipe is
outside a measured stable range.

## Constraints and contact

Collision is a constraint/contact phase, not a disguised spring force.

### First constraints

- pinned particle;
- distance/anchor joint;
- temporary mouse target constraint with capped force;
- later: 2D hinge and driven-rest-length actuator.

Scene commands create/remove constraints deterministically. The UI never writes
particle positions directly.

### Collision progression

1. particle versus fixed ground plane: project penetration out, then apply
   normal restitution and tangential friction;
2. particle versus particle across different bodies;
3. uniform-grid spatial hash broad phase;
4. point versus boundary segment contact;
5. opt-in self-collision.

Contact corrections/impulses are equal and opposite. Begin with discrete contact
and substeps; show tunnelling as a known limitation rather than pretending to
support continuous collision detection.

### Exclusions and self-collision

Filter candidates using the topology graph before narrow phase: exclude self,
direct spring neighbors, particles sharing a face/cell, and optionally particles
within two graph hops. Keep distinct bodies eligible. This makes self-collision
a graph-plus-geometry problem rather than a universal pairwise-force toggle.

## Stress, fracture, and bodies after breakage

The first failure model breaks a spring when normalized tension or compression
crosses a limit, optionally after a small accumulated-damage window. Later add
local shear from changing cell angle/diagonal relation and bending from adjacent
face angle.

This is sufficient to explore a wall: weak inter-cell links can let a ram open a
hole; gravity then loads the unsupported region until it rotates, tears, and
falls. That behavior must be earned through named regression scenes, not
assumed from the lattice.

After breakage, recompute connected components for selection/rendering and
optionally split logical sub-bodies. Preserve particle IDs and event history.

## Browser review lab

The browser should be an illustrated instrument panel:

- select named scene: hanging sheet, dropped block, rope, weak wall, ram;
- create body from shape, generation pattern, material, and seed;
- pause, single-step, reset, replay, and scrub traces;
- expose gravity, solver, fixed dt, substeps, and material parameters;
- independently overlay particles, springs, faces, collision radii, spatial
  cells, contacts/normals, constraints, stress, and broken bonds;
- display energy (with caveats for contact/friction), max penetration, max
  strain, bond counts, constraint iterations, and event timeline.

Click selection uses the same spatial query as simulation. Drag creates a
temporary mouse constraint; release removes it. Shift-drag can later apply a
displayed finite launch impulse. Record `grab`, `moveTarget`, `release`, and
`launch` as step-indexed scene commands so an interactive failure is replayable
headlessly.

## Implementation phases and gates

### Phase 2 — damping and shared ODE core

Add damping/drag; extract only vector math, derivative contracts, integrators,
and trace helpers used by both worlds.

**Gate:** zero damping preserves existing tests; damping lowers energy; browser
compares parameter values without scenario-specific solver code.

### Phase 3 — 2D particle and ground

Add `Vec2`, gravity, a fixed plane, and fixed stepping.

**Gate:** dropped particle never remains below the plane after solve; bounce and
rest are bounded; browser can step/reset and show contact.

### Phase 4 — two particles and one spring

Build a pinned/free/grabbed pair and expose extension, force, and energy.

**Gate:** internal force is equal/opposite; rest length yields zero force; mouse
uses a capped constraint, not direct mutation.

### Phase 5 — generated sheets

Implement deterministic shapes, point distributions, named spring patterns,
render triangles, and topology validation.

**Gate:** same recipe/seed reproduces IDs and geometry; a sheet hangs/sags and
can be dragged in browser review.

### Phase 6 — contacts and multiple bodies

Add spatial hash, cross-body contacts, then opt-in self-collision exclusions.

**Gate:** bodies separate without persistent deep overlap; adjacent particles
do not explode; selected particle can show excluded/contact candidates.

### Phase 7 — joints, stress, and fracture

Add anchors, strain telemetry, break thresholds, event logs, components.

**Gate:** deliberately weak bond breaks reproducibly with no NaNs; a named weak
wall opens and drops an unsupported section.

### Phase 8 — breach sandbox

Package scenes around wall, ram, projectile, and launcher.

**Gate:** user can create/reset/drag/launch, inspect failure cause, replay a
seed/action trace, and share a compact scene recipe.

### Phase 9 — optional 3D

Keep 2D as reference/debugger. Add parallel `Vec3`, triangle collision faces,
and one tessellated block only after Phase 8 is solid.

## Test and browser strategy

Unit-test vector math, integrators, force laws, generation, topology validation,
spatial hashing, narrow phase, constraints, and fracture thresholds.

Property/invariant tests use seeds to check finite state, equal/opposite internal
forces, immobile pins, contact tolerance, zero force at rest length, deterministic
trace/event replay, and no force from broken springs.

Keep small scenario regressions: falling ball settles, hanging sheet remains in a
range, rope breaks at chosen load, colliding blocks separate, and weak wall drops
below a chosen height. Compare checkpoints/events, not giant frame dumps.

Browser tests run a local static build where the browser can access it. Test
scene selection, reset, stepping, controls, overlays, grab/release, replay, and
visible metrics. They complement—not replace—headless physics tests. CI gates
deployment on headless tests/build and browser smoke tests where supported.

## Later sibling: fluid and shaders

Fluid is a later sibling adventure: begin with grid dye/velocity, then explore
shader advection and pressure projection. It shares numerical-stability and
visible-explanation values, but earns its own model and test suite.
