import assert from "node:assert/strict";
import test from "node:test";
import { add, approximatelyEqual, cross, diagnostic, distance, dot, isFiniteNumber, isFiniteVec2, length, normalize, perpendicular, project, scale, subtract, vec2, zero } from "../../src/math/index.mjs";

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
  assert.deepEqual(diagnostic("bad", "thing", "explain"), { code: "bad", subject: "thing", message: "explain" });
});
