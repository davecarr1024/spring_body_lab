import assert from "node:assert/strict";
import test from "node:test";
import { aabb, aabbFromPoints, circle, closestPoint, closestPointAabb, containsPointAabb, containsPointCircle, createTolerance, distanceAabb, expandAabb, orientation, overlaps, pointInPolygon, pointSegmentDistance, segment, segmentBounds, segmentIntersection, segmentLength, segmentMidpoint, signedPolygonArea, unionAabb, vec2 } from "../../src/math/index.js";

const makeSegment = (start, end) => segment(vec2(...start), vec2(...end)).value;

test("geometry constructors validate their finite ordered values", () => {
  assert.equal(segment(vec2(0, 0), { x: Infinity, y: 0 }).ok, false);
  assert.equal(segment(vec2(0, 0), vec2(2, 0)).ok, true);
  assert.equal(aabb(vec2(2, 0), vec2(1, 1)).ok, false);
  const box = aabb(vec2(0, 0), vec2(2, 2)).value;
  assert.equal(overlaps(box, aabb(vec2(2, 2), vec2(3, 3)).value), true);
  assert.equal(overlaps(box, aabb(vec2(3, 3), vec2(4, 4)).value), false);
  assert.deepEqual(aabbFromPoints([]), { kind: "invalid" });
  assert.deepEqual(aabbFromPoints([vec2(-1, 2), vec2(3, -4)]).value, { min: vec2(-1, -4), max: vec2(3, 2) });
});

test("closest-point and orientation results retain useful witnesses", () => {
  const line = makeSegment([0, 0], [4, 0]);
  assert.deepEqual(closestPoint(vec2(2, 3), line), { kind: "point", point: vec2(2, 0), parameter: .5 });
  assert.deepEqual(closestPoint(vec2(2, 3), makeSegment([1, 1], [1, 1])), { kind: "degenerate", point: vec2(1, 1) });
  assert.equal(pointSegmentDistance(vec2(2, 3), line).distance, 3);
  assert.equal(orientation(vec2(0, 0), vec2(1, 0), vec2(0, 1)), 1);
});

test("segment intersections classify crossing, touch, overlap, none, and degeneracy", () => {
  assert.deepEqual(segmentIntersection(makeSegment([0, 0], [2, 2]), makeSegment([0, 2], [2, 0])), { kind: "point", point: vec2(1, 1), touch: false });
  assert.deepEqual(segmentIntersection(makeSegment([0, 0], [1, 0]), makeSegment([1, 0], [2, 0])), { kind: "point", point: vec2(1, 0), touch: true });
  assert.equal(segmentIntersection(makeSegment([0, 0], [3, 0]), makeSegment([1, 0], [2, 0])).kind, "overlap");
  assert.deepEqual(segmentIntersection(makeSegment([0, 0], [1, 0]), makeSegment([0, 1], [1, 1])), { kind: "none" });
  assert.deepEqual(segmentIntersection(makeSegment([0, 0], [1, 0]), makeSegment([2, 0], [3, 0])), { kind: "none" });
  assert.deepEqual(segmentIntersection(makeSegment([0, 0], [0, 0]), makeSegment([0, 0], [1, 1])), { kind: "degenerate" });
});

test("geometry queries apply the caller's explicit tolerance policy", () => {
  const tolerance = createTolerance({ absolute: .1, relative: 0 }).value;
  assert.equal(closestPoint(vec2(1, 1), makeSegment([0, 0], [.05, 0]), tolerance).kind, "degenerate");
  assert.equal(segmentIntersection(makeSegment([0, 0], [1, 0]), makeSegment([1.05, 0], [2, 0]), tolerance).kind, "point");
});

test("circle, segment, AABB, and polygon public queries retain exact witnesses", () => {
  const line = makeSegment([0, 0], [4, 0]);
  assert.equal(circle(vec2(0, 0), -1).ok, false);
  const disk = circle(vec2(1, 1), 2).value;
  assert.equal(containsPointCircle(disk, vec2(3, 1)), true);
  assert.equal(containsPointCircle(disk, vec2(3.1, 1)), false);
  assert.equal(segmentLength(line), 4);
  assert.deepEqual(segmentMidpoint(line), vec2(2, 0));
  assert.deepEqual(segmentBounds(line), { min: vec2(0, 0), max: vec2(4, 0) });
  const box = aabb(vec2(0, 0), vec2(2, 2)).value;
  assert.equal(containsPointAabb(box, vec2(2, 2)), true);
  assert.deepEqual(closestPointAabb(vec2(3, -2), box), vec2(2, 0));
  assert.equal(distanceAabb(vec2(3, -2), box), Math.sqrt(5));
  assert.deepEqual(unionAabb(box, aabb(vec2(-1, 1), vec2(3, 4)).value), { min: vec2(-1, 0), max: vec2(3, 4) });
  assert.deepEqual(expandAabb(box, 1), { min: vec2(-1, -1), max: vec2(3, 3) });
  const square = [vec2(0, 0), vec2(2, 0), vec2(2, 2), vec2(0, 2)];
  assert.equal(signedPolygonArea(square), 4);
  assert.equal(pointInPolygon(vec2(1, 1), square).kind, "inside");
  assert.equal(pointInPolygon(vec2(3, 1), square).kind, "outside");
  assert.equal(pointInPolygon(vec2(0, 1), square).kind, "boundary");
  assert.equal(pointInPolygon(vec2(1, 1), [vec2(0, 0)]).kind, "invalid");
});
