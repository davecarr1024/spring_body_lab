/** A finite, immutable point or free vector in the project's 2D coordinate system. */
export type Vec2 = Readonly<{ x: number; y: number }>;

/** Shared absolute/relative policy for floating-point classifications. */
export type Tolerance = Readonly<{ absolute: number; relative: number }>;

/** A stable, inspectable explanation for a rejected public input. */
export type Diagnostic = Readonly<{ code: string; subject: string; message: string }>;

export type Result<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; diagnostics: readonly Diagnostic[] }>;

export type Segment2 = Readonly<{ start: Vec2; end: Vec2 }>;
export type Aabb2 = Readonly<{ min: Vec2; max: Vec2 }>;
export type Circle2 = Readonly<{ center: Vec2; radius: number }>;
export type Polygon2 = readonly Vec2[];

export type UnitResult = Readonly<{ kind: "unit"; value: Vec2 }> | Readonly<{ kind: "degenerate" }>;
export type PointResult = Readonly<{ kind: "point"; value: Vec2 }> | Readonly<{ kind: "degenerate" }>;
