import { approximatelyEqual, defaultTolerance, diagnostic, isFiniteNumber, isNearZero } from "./scalar.js";
import { add, cross, distance, dot, isFiniteVec2, lengthSquared, scale, subtract, vec2 } from "./vec2.js";
import type { Aabb2, Circle2, Polygon2, Segment2, Tolerance, Vec2 } from "./types.js";

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
  // Clamp the line parameter so this remains a segment query, not a ray query.
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
    // Parallel lines either miss or need the separate collinear overlap path.
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

/** Validates a finite circle used by containment and proximity queries. */
export function circle(center: Vec2, radius: number) {
  if (!isFiniteVec2(center) || !isFiniteNumber(radius) || radius < 0) return Object.freeze({ ok: false, diagnostics: [diagnostic("invalid_circle", "circle", "Circles need a finite center and non-negative finite radius.")] });
  return Object.freeze({ ok: true, value: Object.freeze({ center, radius }) as Circle2 });
}

export function segmentLength(line: Segment2): number { return distance(line.start, line.end); }
export function segmentMidpoint(line: Segment2): Vec2 { return scale(add(line.start, line.end), .5); }
export function segmentBounds(line: Segment2): Aabb2 { return Object.freeze({ min: vec2(Math.min(line.start.x, line.end.x), Math.min(line.start.y, line.end.y)), max: vec2(Math.max(line.start.x, line.end.x), Math.max(line.start.y, line.end.y)) }); }

export function containsPointAabb(box: Aabb2, point: Vec2, tolerance: Tolerance = defaultTolerance): boolean {
  return point.x >= box.min.x - tolerance.absolute && point.x <= box.max.x + tolerance.absolute && point.y >= box.min.y - tolerance.absolute && point.y <= box.max.y + tolerance.absolute;
}

export function closestPointAabb(point: Vec2, box: Aabb2): Vec2 {
  return vec2(Math.max(box.min.x, Math.min(box.max.x, point.x)), Math.max(box.min.y, Math.min(box.max.y, point.y)));
}

export function distanceAabb(point: Vec2, box: Aabb2): number { return distance(point, closestPointAabb(point, box)); }
export function unionAabb(left: Aabb2, right: Aabb2): Aabb2 { return Object.freeze({ min: vec2(Math.min(left.min.x, right.min.x), Math.min(left.min.y, right.min.y)), max: vec2(Math.max(left.max.x, right.max.x), Math.max(left.max.y, right.max.y)) }); }
export function expandAabb(box: Aabb2, amount: number): Aabb2 { return Object.freeze({ min: vec2(box.min.x - amount, box.min.y - amount), max: vec2(box.max.x + amount, box.max.y + amount) }); }

export function containsPointCircle(value: Circle2, point: Vec2, tolerance: Tolerance = defaultTolerance): boolean {
  return distance(value.center, point) <= value.radius + tolerance.absolute;
}

export function signedPolygonArea(points: Polygon2): number {
  // Shoelace accumulation preserves winding: counter-clockwise areas are positive.
  if (points.length < 3) return 0;
  return points.reduce((twiceArea, point, index) => {
    const next = points[(index + 1) % points.length];
    return twiceArea + point.x * next.y - point.y * next.x;
  }, 0) / 2;
}

/** Classifies a finite point against a simple polygon without hiding boundary cases. */
export function pointInPolygon(point: Vec2, polygon: Polygon2, tolerance: Tolerance = defaultTolerance) {
  if (polygon.length < 3 || polygon.some((vertex) => !isFiniteVec2(vertex)) || !isFiniteVec2(point)) return Object.freeze({ kind: "invalid" });
  let inside = false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    // Boundary is a first-class answer, rather than an arbitrary inside/outside tie-break.
    if (pointSegmentDistance(point, { start, end }, tolerance).distance <= tolerance.absolute) return Object.freeze({ kind: "boundary" });
    if ((start.y > point.y) !== (end.y > point.y) && point.x < (end.x - start.x) * (point.y - start.y) / (end.y - start.y) + start.x) inside = !inside;
  }
  return Object.freeze({ kind: inside ? "inside" : "outside" });
}
