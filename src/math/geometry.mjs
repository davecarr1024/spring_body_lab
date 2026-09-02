import { approximatelyEqual, defaultTolerance, diagnostic, isFiniteNumber, isNearZero } from "./scalar.mjs";
import { add, cross, distance, dot, isFiniteVec2, lengthSquared, scale, subtract, vec2 } from "./vec2.mjs";

export function segment(start, end) {
  if (!isFiniteVec2(start) || !isFiniteVec2(end)) {
    return Object.freeze({ ok: false, diagnostics: [diagnostic("non_finite_point", "segment", "Segment endpoints must be finite Vec2 values.")] });
  }
  return Object.freeze({ ok: true, value: Object.freeze({ start, end }) });
}

export function aabb(min, max) {
  if (!isFiniteVec2(min) || !isFiniteVec2(max) || min.x > max.x || min.y > max.y) {
    return Object.freeze({ ok: false, diagnostics: [diagnostic("invalid_aabb", "aabb", "AABB bounds must be finite and ordered.")] });
  }
  return Object.freeze({ ok: true, value: Object.freeze({ min, max }) });
}

export function aabbFromPoints(points) {
  if (points.length === 0 || points.some((point) => !isFiniteVec2(point))) return Object.freeze({ kind: "invalid" });
  return Object.freeze({ kind: "box", value: Object.freeze({
    min: vec2(Math.min(...points.map((point) => point.x)), Math.min(...points.map((point) => point.y))),
    max: vec2(Math.max(...points.map((point) => point.x)), Math.max(...points.map((point) => point.y))),
  }) });
}

export function overlaps(left, right) {
  return left.min.x <= right.max.x && left.max.x >= right.min.x
    && left.min.y <= right.max.y && left.max.y >= right.min.y;
}

export function closestPoint(point, line, tolerance = defaultTolerance) {
  const direction = subtract(line.end, line.start);
  const denominator = lengthSquared(direction);
  if (isNearZero(denominator, { absolute: tolerance.absolute ** 2, relative: tolerance.relative })) return Object.freeze({ kind: "degenerate", point: line.start });
  const parameter = Math.max(0, Math.min(1, dot(subtract(point, line.start), direction) / denominator));
  return Object.freeze({ kind: "point", point: add(line.start, scale(direction, parameter)), parameter });
}

export function pointSegmentDistance(point, line, tolerance = defaultTolerance) {
  const closest = closestPoint(point, line, tolerance);
  return Object.freeze({ ...closest, distance: distance(point, closest.point) });
}

export function orientation(a, b, point) {
  return cross(subtract(b, a), subtract(point, a));
}

function within(value, start, end, tolerance) {
  return value >= Math.min(start, end) - tolerance.absolute && value <= Math.max(start, end) + tolerance.absolute;
}

function onSegment(point, line, tolerance) {
  return approximatelyEqual(orientation(line.start, line.end, point), 0, tolerance)
    && within(point.x, line.start.x, line.end.x, tolerance) && within(point.y, line.start.y, line.end.y, tolerance);
}

export function segmentIntersection(left, right, tolerance = defaultTolerance) {
  const leftDirection = subtract(left.end, left.start);
  const rightDirection = subtract(right.end, right.start);
  const denominator = cross(leftDirection, rightDirection);
  const leftLength = lengthSquared(leftDirection);
  const rightLength = lengthSquared(rightDirection);
  const squaredTolerance = { absolute: tolerance.absolute ** 2, relative: tolerance.relative };
  if (isNearZero(leftLength, squaredTolerance) || isNearZero(rightLength, squaredTolerance)) return Object.freeze({ kind: "degenerate" });
  const offset = subtract(right.start, left.start);
  if (approximatelyEqual(denominator, 0, tolerance)) {
    if (!approximatelyEqual(cross(offset, leftDirection), 0, tolerance)) return Object.freeze({ kind: "none" });
    const candidates = [left.start, left.end, right.start, right.end]
      .filter((point) => onSegment(point, left, tolerance) && onSegment(point, right, tolerance))
      .filter((point, index, all) => all.findIndex((other) => approximatelyEqual(other.x, point.x, tolerance) && approximatelyEqual(other.y, point.y, tolerance)) === index);
    if (candidates.length === 0) return Object.freeze({ kind: "none" });
    if (candidates.length === 1) return Object.freeze({ kind: "point", point: candidates[0], touch: true });
    return Object.freeze({ kind: "overlap", segment: Object.freeze({ start: candidates[0], end: candidates.at(-1) }) });
  }
  const t = cross(offset, rightDirection) / denominator;
  const u = cross(offset, leftDirection) / denominator;
  if (!isFiniteNumber(t) || !isFiniteNumber(u) || t < -tolerance.absolute || t > 1 + tolerance.absolute || u < -tolerance.absolute || u > 1 + tolerance.absolute) return Object.freeze({ kind: "none" });
  const point = add(left.start, scale(leftDirection, t));
  return Object.freeze({ kind: "point", point, touch: t <= tolerance.absolute || t >= 1 - tolerance.absolute || u <= tolerance.absolute || u >= 1 - tolerance.absolute });
}
