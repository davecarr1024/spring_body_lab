import { EPSILON, isFiniteNumber } from "./scalar.mjs";

export const vec2 = (x, y) => Object.freeze({ x, y });
export const zero = vec2(0, 0);

export function isFiniteVec2(value) {
  return value !== null && typeof value === "object"
    && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

export function add(left, right) { return vec2(left.x + right.x, left.y + right.y); }
export function subtract(left, right) { return vec2(left.x - right.x, left.y - right.y); }
export function scale(value, amount) { return vec2(value.x * amount, value.y * amount); }
export function dot(left, right) { return left.x * right.x + left.y * right.y; }
export function cross(left, right) { return left.x * right.y - left.y * right.x; }
export function perpendicular(value) { return vec2(-value.y, value.x); }
export function lengthSquared(value) { return dot(value, value); }
export function length(value) { return Math.sqrt(lengthSquared(value)); }
export function distance(left, right) { return length(subtract(left, right)); }

export function normalize(value, epsilon = EPSILON) {
  const magnitude = length(value);
  if (magnitude <= epsilon) return Object.freeze({ kind: "degenerate" });
  return Object.freeze({ kind: "unit", value: scale(value, 1 / magnitude) });
}

export function project(value, onto) {
  const denominator = lengthSquared(onto);
  if (denominator <= EPSILON ** 2) return Object.freeze({ kind: "degenerate" });
  return Object.freeze({ kind: "point", value: scale(onto, dot(value, onto) / denominator) });
}
