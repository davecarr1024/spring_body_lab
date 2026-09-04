import assert from "node:assert/strict";
import test from "node:test";
import { vec2, zero } from "../../src/math/index.js";
import { appendTraceStep, createInitialState, createTrace, createWorldDefinition, replayTrace, step } from "../../src/physics/index.js";

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

test("traces retain immutable step-indexed commands and replay their evidence", () => {
  const definition = world().value;
  const initial = createTrace(definition);
  const first = appendTraceStep(initial, [{ kind: "applyImpulse", particleId: "free", impulse: vec2(2, 0) }]);
  const trace = appendTraceStep(first.trace);
  assert.deepEqual(trace.trace.entries.map((entry) => entry.stepIndex), [0, 1]);
  assert.equal(Object.isFrozen(trace.trace.entries[0].commands[0]), true);
  assert.deepEqual(trace.trace.entries[0].commands[0].impulse, vec2(2, 0));
  assert.deepEqual(replayTrace(trace.trace), trace.trace);
});

test("fixed segments return bounded correction and velocity evidence", () => {
  const definition = createWorldDefinition({
    gravity: zero, dt: .1, contact: { tolerance: 1e-6, maxCorrection: 10, restitution: .2, iterations: 1 },
    particles: [{ id: "ball", position: vec2(5, 96), velocity: vec2(0, 10), inverseMass: 1, radius: 10 }],
    springs: [], fixedSegments: [{ id: "floor", start: vec2(0, 100), end: vec2(100, 100) }],
  }).value;
  const result = step(definition, createInitialState(definition));
  const contact = result.contacts[0];
  assert.equal(contact.kind, "particle_segment");
  assert.equal(contact.segmentId, "floor");
  assert.deepEqual(contact.normal, vec2(0, -1));
  assert.equal(contact.penetration, 7);
  assert.deepEqual(contact.correction, vec2(0, -7));
  assert.equal(result.state.particles[0].position.y, 90);
  assert.equal(result.state.particles[0].velocity.y, -2);
  assert.equal(Object.isFrozen(contact), true);
});

test("particle pairs separate deterministically and invalid contact structure is rejected", () => {
  const definition = createWorldDefinition({
    gravity: zero, dt: .1, contact: { tolerance: 1e-6, maxCorrection: 10, restitution: 0, iterations: 1 },
    particles: [
      { id: "left", position: vec2(0, 0), velocity: vec2(10, 0), inverseMass: 1, radius: 12 },
      { id: "right", position: vec2(20, 0), velocity: vec2(-10, 0), inverseMass: 1, radius: 12 },
    ], springs: [],
  }).value;
  const result = step(definition, createInitialState(definition));
  assert.equal(result.contacts[0].kind, "particle_particle");
  assert.equal(result.contacts[0].penetration, 6);
  assert.deepEqual(result.state.particles.map((particle) => particle.position.x), [-2, 22]);
  assert.deepEqual(result.state.particles.map((particle) => particle.velocity.x), [0, 0]);
  assert.equal(createWorldDefinition({ particles: [{ id: "bad", position: zero, velocity: zero, inverseMass: 1, radius: -1 }], contact: { tolerance: -1 } }).ok, false);
  assert.equal(createWorldDefinition({ particles: [{ id: "one", position: zero, velocity: zero, inverseMass: 1 }], fixedSegments: [{ id: "bad", start: zero, end: { x: Infinity, y: 0 } }], springs: [] }).ok, false);
});

test("a particle centered on a degenerate fixed segment gets a deterministic safe normal", () => {
  const definition = createWorldDefinition({
    gravity: zero, dt: .1, contact: { tolerance: 1e-6, maxCorrection: 10, restitution: 0, iterations: 1 },
    particles: [{ id: "ball", position: zero, velocity: zero, inverseMass: 1, radius: 2 }], springs: [],
    fixedSegments: [{ id: "point", start: zero, end: zero }],
  }).value;
  assert.deepEqual(step(definition, createInitialState(definition)).contacts[0].normal, vec2(0, -1));
});

test("direct spring neighbors are excluded from particle-pair contact", () => {
  const definition = createWorldDefinition({
    gravity: zero, dt: .1,
    particles: [
      { id: "a", position: zero, velocity: zero, inverseMass: 1, radius: 10 },
      { id: "b", position: vec2(5, 0), velocity: zero, inverseMass: 1, radius: 10 },
    ],
    springs: [{ id: "join", a: "a", b: "b", restLength: 5, stiffness: 0, damping: 0 }],
  }).value;
  const result = step(definition, createInitialState(definition));
  assert.equal(result.contacts.length, 0);
  assert.deepEqual(result.state.particles.map((particle) => particle.position), [zero, vec2(5, 0)]);
});
