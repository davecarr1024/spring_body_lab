import assert from "node:assert/strict";
import test from "node:test";
import { integrateEuler, integrateRungeKutta4, vec2 } from "../../src/math/index.js";

test("Euler integration records a deterministic scalar trace", () => {
  const result = integrateEuler({ initial: 1, time: 0, dt: .25, steps: 4, derivative: (_time, state) => state });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value.samples.map((sample) => sample.time), [0, .25, .5, .75, 1]);
  assert.equal(result.value.samples.at(-1)?.state, 2.44140625);
  assert.equal(result.value.evaluations, 4);
  assert.equal(Object.isFrozen(result.value.samples), true);
});

test("RK4 solves scalar and Vec2 exponential growth with fourth-order evidence", () => {
  const scalar = integrateRungeKutta4({ initial: 1, time: 0, dt: .1, steps: 10, derivative: (_time, state) => state });
  assert.equal(scalar.ok, true);
  assert.ok(Math.abs((scalar.value.samples.at(-1)?.state as number) - Math.E) < .00001);
  assert.equal(scalar.value.evaluations, 40);
  const vector = integrateRungeKutta4({ initial: vec2(1, -2), time: 0, dt: .5, steps: 1, derivative: (_time, state) => state });
  assert.equal(vector.ok, true);
  assert.ok(Math.abs(vector.value.samples[1].state.x - 1.6484375) < 1e-12);
  assert.ok(Math.abs(vector.value.samples[1].state.y + 3.296875) < 1e-12);
});

test("ODE solvers reject invalid settings and derivative shape/non-finite output", () => {
  assert.equal(integrateEuler({ initial: 0, time: 0, dt: 0, steps: 1, derivative: () => 0 }).ok, false);
  assert.equal(integrateRungeKutta4({ initial: vec2(0, 0), time: 0, dt: 1, steps: 1, derivative: () => 3 as never }).ok, false);
  assert.equal(integrateEuler({ initial: 0, time: 0, dt: 1, steps: 1, derivative: () => Number.NaN }).ok, false);
  assert.equal(integrateEuler({ initial: 0, time: 0, dt: 1, steps: -1, derivative: () => 0 }).ok, false);
});
