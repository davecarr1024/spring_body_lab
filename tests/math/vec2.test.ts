import assert from "node:assert/strict";
import test from "node:test";
import { add, angle, approximatelyEqual, approximatelyEqualVec2, clamp, createTolerance, cross, defaultTolerance, diagnostic, distance, distanceSquared, dot, fromPolar, isFiniteNumber, isFiniteVec2, isNearZero, length, lerp, lerpVec2, negate, normalize, perpendicular, project, reflect, reject, rotate, scale, subtract, vec2, zero } from "../../src/math/index.js";

test("Vec2 values are finite immutable values with composable arithmetic", () => {
  const left = vec2(3, 4);
  const right = vec2(-2, 5);
  assert.equal(Object.isFrozen(left), true);
  assert.deepEqual(add(left, right), vec2(1, 9));
  assert.deepEqual(subtract(left, right), vec2(5, -1));
  assert.deepEqual(scale(left, 2), vec2(6, 8));
  assert.equal(dot(left, right), 14);
  assert.equal(cross(left, right), 23);
  assert.deepEqual(perpendicular(left), vec2(-4, 3));
  assert.equal(length(left), 5);
  assert.equal(distance(left, zero), 5);
  assert.equal(isFiniteVec2(left), true);
  assert.equal(isFiniteVec2({ x: Infinity, y: 0 }), false);
});

test("normalization and projection classify degenerate inputs", () => {
  assert.deepEqual(normalize(zero), { kind: "degenerate" });
  const unit = normalize(vec2(3, 4));
  assert.equal(unit.kind, "unit");
  assert.equal(approximatelyEqual(unit.value.x, .6), true);
  assert.equal(approximatelyEqual(unit.value.y, .8), true);
  assert.deepEqual(project(vec2(4, 2), zero), { kind: "degenerate" });
  assert.deepEqual(project(vec2(4, 2), vec2(2, 0)).value, vec2(4, 0));
});

test("scalar helpers centralize numeric and diagnostic policy", () => {
  assert.equal(isFiniteNumber(3), true);
  assert.equal(isFiniteNumber(Number.NaN), false);
  assert.equal(isFiniteNumber("3"), false);
  assert.equal(approximatelyEqual(1, 1 + 1e-10), true);
  assert.equal(approximatelyEqual(1, 1.1), false);
  const tolerance = createTolerance({ absolute: .01, relative: .001 });
  assert.equal(tolerance.ok, true);
  assert.equal(Object.isFrozen(tolerance.value), true);
  assert.equal(approximatelyEqual(100, 100.05, tolerance.value), true);
  assert.equal(isNearZero(.009, tolerance.value), true);
  assert.equal(isNearZero(.02, tolerance.value), false);
  assert.equal(defaultTolerance.absolute, 1e-9);
  assert.equal(createTolerance({ absolute: -1 }).ok, false);
  assert.deepEqual(diagnostic("bad", "thing", "explain"), { code: "bad", subject: "thing", message: "explain" });
  assert.equal(lerp(10, 20, .25), 12.5);
  assert.equal(clamp(3, 4, 8), 4);
  assert.equal(clamp(9, 4, 8), 8);
});

test("Vec2 interpolation, polar, rotation, rejection, and reflection retain explicit degeneracy", () => {
  assert.deepEqual(negate(vec2(2, -3)), vec2(-2, 3));
  assert.equal(distanceSquared(vec2(3, 4), zero), 25);
  assert.deepEqual(lerpVec2(zero, vec2(8, 4), .25), vec2(2, 1));
  assert.equal(approximatelyEqualVec2(rotate(vec2(1, 0), Math.PI / 2), vec2(0, 1)), true);
  assert.equal(approximatelyEqualVec2(fromPolar(2, Math.PI / 2), vec2(0, 2)), true);
  assert.equal(approximatelyEqual(angle(vec2(0, 1)), Math.PI / 2), true);
  assert.equal(approximatelyEqualVec2(vec2(1, 1), vec2(1 + 1e-10, 1)), true);
  assert.deepEqual(reject(vec2(3, 4), vec2(1, 0)).value, vec2(0, 4));
  assert.deepEqual(reject(vec2(3, 4), zero), { kind: "degenerate" });
  assert.deepEqual(reflect(vec2(2, -3), vec2(0, 1)).value, vec2(2, 3));
  assert.deepEqual(reflect(vec2(2, -3), zero), { kind: "degenerate" });
});
