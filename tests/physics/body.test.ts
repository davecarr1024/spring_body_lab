import assert from "node:assert/strict";
import test from "node:test";
import { createGridBody, createRopeBody } from "../../src/physics/index.js";
import { vec2, zero } from "../../src/math/index.js";

test("grid recipes create deterministic particles, structural and diagonal springs, and faces", () => {
  const recipe = { id: "sheet", rows: 2, columns: 3, origin: vec2(10, 20), spacing: 5, velocity: zero };
  const first = createGridBody(recipe);
  const second = createGridBody(recipe);
  assert.equal(first.ok, true);
  assert.equal(first.value.particles.length, 6);
  assert.equal(first.value.springs.filter((spring) => spring.kind === "structural").length, 7);
  assert.equal(first.value.springs.filter((spring) => spring.kind === "diagonal").length, 4);
  assert.equal(first.value.faces.length, 2);
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first.value.faces[0].particleIds), true);
});

test("grid recipes classify invalid topology and numeric settings", () => {
  assert.equal(createGridBody({ id: "", rows: 1, columns: 1, origin: zero, spacing: 0 }).ok, false);
  assert.equal(createGridBody({ rows: 2, columns: 2, origin: { x: Infinity, y: 0 }, spacing: 1 }).ok, false);
  assert.equal(createGridBody({ rows: 2, columns: 2, origin: zero, spacing: 1, inverseMass: -1, radius: -1, stiffness: -1, damping: -1 }).ok, false);
  assert.equal(createGridBody({ rows: 2, columns: 2, origin: zero, spacing: 1, breakStrain: -1 }).ok, false);
});

test("grid recipes propagate an optional break strain to each generated spring", () => {
  const body = createGridBody({ id: "weak", rows: 2, columns: 2, origin: zero, spacing: 1, breakStrain: .25 });
  assert.equal(body.ok, true);
  assert.equal(body.value.springs.every((spring) => spring.breakStrain === .25), true);
});

test("rope recipes create a stable vertical chain and reject invalid settings", () => {
  const first = createRopeBody({ id: "rope", segments: 3, origin: vec2(4, 5), spacing: 7, velocity: zero });
  const second = createRopeBody({ id: "rope", segments: 3, origin: vec2(4, 5), spacing: 7, velocity: zero });
  assert.equal(first.ok, true);
  assert.equal(first.value.particles.length, 4);
  assert.equal(first.value.springs.length, 3);
  assert.deepEqual(first.value.particles.map((particle) => particle.position), [vec2(4, 5), vec2(4, 12), vec2(4, 19), vec2(4, 26)]);
  assert.equal(first.value.springs.every((spring) => spring.kind === "rope"), true);
  assert.deepEqual(first, second);
  assert.equal(createRopeBody({ id: "", segments: 0, origin: zero, spacing: 0, breakStrain: -1 }).ok, false);
});
