import assert from "node:assert/strict";
import test from "node:test";
import { energy, exactUndamped, run, stepEuler, stepSemiImplicit } from "../src/oscillator.mjs";

const parameters = { mass: 1, stiffness: 4, damping: 0 };
const initial = { x: 1, v: 0 };

test("the analytic oscillator reaches zero displacement at a quarter cycle", () => {
  const state = exactUndamped(Math.PI / 4, initial, parameters);
  assert.ok(Math.abs(state.x) < 1e-12);
  assert.ok(Math.abs(state.v + 2) < 1e-12);
});

test("RK4 closely tracks the analytic solution", () => {
  const actual = run({ initial, parameters, dt: .02, duration: 4, solver: "RK4" }).at(-1).state;
  const exact = exactUndamped(4, initial, parameters);
  assert.ok(Math.hypot(actual.x - exact.x, actual.v - exact.v) < 5e-6);
});

test("smaller RK4 timesteps reduce endpoint error", () => {
  const exact = exactUndamped(4, initial, parameters);
  const error = (dt) => { const state = run({ initial, parameters, dt, duration: 4, solver: "RK4" }).at(-1).state; return Math.hypot(state.x - exact.x, state.v - exact.v); };
  assert.ok(error(.01) < error(.1));
});

test("Euler gains energy while semi-implicit Euler remains comparatively bounded", () => {
  let euler = initial, semi = initial;
  for (let step = 0; step < 100; step += 1) { euler = stepEuler(euler, parameters, .1); semi = stepSemiImplicit(semi, parameters, .1); }
  assert.ok(energy(euler, parameters) > energy(initial, parameters) * 20);
  assert.ok(Math.abs(energy(semi, parameters) - energy(initial, parameters)) < .6);
});
