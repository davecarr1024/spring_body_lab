import assert from "node:assert/strict";
import test from "node:test";
import { vec2, zero } from "../../src/math/index.mjs";
import { createInitialState, createWorldDefinition, step } from "../../src/physics/index.mjs";

function world(overrides = {}) {
  return createWorldDefinition({ gravity: zero, dt: .1, particles: [
    { id: "pin", position: vec2(0, 0), velocity: zero, inverseMass: 0 },
    { id: "free", position: vec2(2, 0), velocity: zero, inverseMass: 1 },
  ], springs: [{ id: "spring", a: "pin", b: "free", restLength: 1, stiffness: 10, damping: 0 }], ...overrides });
}

test("world definitions reject invalid physical structure with diagnostics", () => {
  assert.equal(createWorldDefinition({ particles: [], springs: [] }).ok, false);
  assert.equal(createWorldDefinition({ particles: [{ id: "one", position: zero, velocity: zero, inverseMass: 1 }] }).ok, true);
  assert.equal(world({ dt: 0 }).ok, false);
  assert.equal(world({ particles: [{ id: "a", position: vec2(0, 0), velocity: zero, inverseMass: 1 }, { id: "a", position: vec2(1, 0), velocity: zero, inverseMass: -1 }] }).ok, false);
  assert.equal(world({ springs: [{ id: "bad", a: "pin", b: "missing", restLength: -1, stiffness: -1, damping: -1 }] }).ok, false);
});

test("a spring produces equal and opposite force and leaves a pin unmoved", () => {
  const definition = world().value;
  const initial = createInitialState(definition);
  const result = step(definition, initial);
  const force = result.forces[0];
  assert.equal(force.kind, "force");
  assert.equal(force.extension, 1);
  assert.deepEqual(force.forceOnA, vec2(10, 0));
  assert.equal(force.forceOnA.x + force.forceOnB.x, 0);
  assert.equal(force.forceOnA.y + force.forceOnB.y, 0);
  assert.deepEqual(result.state.particles.find((particle) => particle.id === "pin"), initial.particles[0]);
  assert.deepEqual(result.state.particles.find((particle) => particle.id === "free").position, vec2(1.9, 0));
  assert.equal(result.state.stepIndex, 1);
  assert.equal(Object.isFrozen(result.state), true);
});

test("rest-length, commands, and a degenerate spring have explicit behavior", () => {
  const resting = world({ springs: [{ id: "spring", a: "pin", b: "free", restLength: 2, stiffness: 10, damping: 0 }] }).value;
  const atRest = step(resting, createInitialState(resting));
  assert.deepEqual(atRest.forces[0].forceOnA, zero);
  const kicked = step(resting, createInitialState(resting), [{ kind: "applyImpulse", particleId: "free", impulse: vec2(2, 0) }]);
  assert.equal(kicked.state.particles[1].velocity.x, 2);
  const rejected = step(resting, createInitialState(resting), [{ kind: "applyImpulse", particleId: "missing", impulse: vec2(2, 0) }, { kind: "other" }]);
  assert.equal(rejected.diagnostics.length, 2);
  assert.equal(rejected.state.particles[1].velocity.x, 0);
  const degenerate = world({ particles: [{ id: "pin", position: zero, velocity: zero, inverseMass: 0 }, { id: "free", position: zero, velocity: zero, inverseMass: 1 }] }).value;
  assert.deepEqual(step(degenerate, createInitialState(degenerate)).forces[0], { springId: "spring", kind: "degenerate" });
});
