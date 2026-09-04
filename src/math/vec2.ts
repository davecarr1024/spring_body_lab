import { defaultTolerance, isFiniteNumber, isNearZero } from "./scalar.js";
import type { PointResult, Tolerance, UnitResult, Vec2 } from "./types.js";

export const vec2 = (x: number, y: number): Vec2 => Object.freeze({ x, y });
export const zero = vec2(0, 0);

export function isFiniteVec2(value: unknown): value is Vec2 {
  return value !== null && typeof value === "object"
    && isFiniteNumber((value as Vec2).x) && isFiniteNumber((value as Vec2).y);
}

export function add(left: Vec2, right: Vec2): Vec2 { return vec2(left.x + right.x, left.y + right.y); }
export function subtract(left: Vec2, right: Vec2): Vec2 { return vec2(left.x - right.x, left.y - right.y); }
export function scale(value: Vec2, amount: number): Vec2 { return vec2(value.x * amount, value.y * amount); }
export function negate(value: Vec2): Vec2 { return scale(value, -1); }
export function dot(left: Vec2, right: Vec2): number { return left.x * right.x + left.y * right.y; }
export function cross(left: Vec2, right: Vec2): number { return left.x * right.y - left.y * right.x; }
export function perpendicular(value: Vec2): Vec2 { return vec2(-value.y, value.x); }
export function lengthSquared(value: Vec2): number { return dot(value, value); }
export function length(value: Vec2): number { return Math.sqrt(lengthSquared(value)); }
export function distance(left: Vec2, right: Vec2): number { return length(subtract(left, right)); }
export function distanceSquared(left: Vec2, right: Vec2): number { return lengthSquared(subtract(left, right)); }
export function lerpVec2(start: Vec2, end: Vec2, amount: number): Vec2 { return add(start, scale(subtract(end, start), amount)); }
export function rotate(value: Vec2, radians: number): Vec2 { const cosine = Math.cos(radians); const sine = Math.sin(radians); return vec2(value.x * cosine - value.y * sine, value.x * sine + value.y * cosine); }
export function fromPolar(radius: number, radians: number): Vec2 { return vec2(radius * Math.cos(radians), radius * Math.sin(radians)); }
export function angle(value: Vec2): number { return Math.atan2(value.y, value.x); }
export function approximatelyEqualVec2(left: Vec2, right: Vec2, tolerance: Tolerance = defaultTolerance): boolean { return Math.abs(left.x - right.x) <= tolerance.absolute + tolerance.relative * Math.max(Math.abs(left.x), Math.abs(right.x)) && Math.abs(left.y - right.y) <= tolerance.absolute + tolerance.relative * Math.max(Math.abs(left.y), Math.abs(right.y)); }

export function normalize(value: Vec2, tolerance: Tolerance = defaultTolerance): UnitResult {
  // Never divide by a near-zero length: callers receive an explicit degeneracy.
  const magnitude = length(value);
  if (isNearZero(magnitude, tolerance)) return Object.freeze({ kind: "degenerate" });
  return Object.freeze({ kind: "unit", value: scale(value, 1 / magnitude) });
}

export function project(value: Vec2, onto: Vec2, tolerance: Tolerance = defaultTolerance): PointResult {
  // Projection is undefined for a zero direction, so it shares normalize's tag.
  const denominator = lengthSquared(onto);
  if (isNearZero(denominator, { absolute: tolerance.absolute ** 2, relative: tolerance.relative })) return Object.freeze({ kind: "degenerate" });
  return Object.freeze({ kind: "point", value: scale(onto, dot(value, onto) / denominator) });
}

export function reject(value: Vec2, onto: Vec2, tolerance: Tolerance = defaultTolerance): PointResult {
  const projected = project(value, onto, tolerance);
  return projected.kind === "degenerate" ? projected : Object.freeze({ kind: "point", value: subtract(value, projected.value) });
}

export function reflect(value: Vec2, normal: Vec2, tolerance: Tolerance = defaultTolerance): UnitResult | PointResult {
  // v - 2 * proj(v,n) mirrors v across the plane whose normal is n.
  const unit = normalize(normal, tolerance);
  return unit.kind === "degenerate" ? unit : Object.freeze({ kind: "point", value: subtract(value, scale(unit.value, 2 * dot(value, unit.value))) });
}
