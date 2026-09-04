# Math API

`src/math/index.ts` is the only supported public entry point for the
dependency-free math library. It exports both runtime operations and TypeScript
types; consumers do not import implementation files directly.

## Values and classifications

- `Vec2`, `Segment2`, `Aabb2`, `Circle2`, `Polygon2`, `Tolerance`,
  `Diagnostic`, and `Result<T>` are immutable public types.
- `vec2`, `segment`, `aabb`, `circle`, and `createTolerance` construct the
  basic values. Constructors that can reject input return a structured result.
- `normalize`, `project`, `reject`, intersections, and polygon containment
  classify degenerate or boundary cases rather than returning hidden `NaN`s.

## 2D operations

Vectors support arithmetic, dot/cross products, distance, interpolation,
polar conversion, rotation, projection/rejection, reflection, and
tolerance-aware equality. Geometry supports segment bounds/length/midpoint,
AABB union/expansion/containment/distance, circle containment, closest points,
point-to-segment distance, signed polygon area, point-in-polygon
classification, orientation, and classified segment intersections.

All geometric tolerance-bearing operations accept the shared `Tolerance`
value. Exact IDs and discrete indexes remain outside this floating-point policy.

## ODE integration

`integrateEuler` and `integrateRungeKutta4` accept an `OdeProblem<number>` or
`OdeProblem<Vec2>`. They return an immutable trace of time/state samples and
the number of derivative evaluations. Invalid time settings, non-finite state,
shape-changing derivatives, and non-finite derivative output return structured
diagnostics. They do not read clocks, random sources, or browser state.

Euler is retained as an inspectable baseline; RK4 is available when a named
model needs lower truncation error. Neither function is a hidden replacement
for the physics engine's documented semi-implicit Euler transition.
