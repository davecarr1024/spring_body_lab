import { diagnostic, isFiniteNumber } from "./scalar.js";
import { add, isFiniteVec2, scale, vec2 } from "./vec2.js";
import type { Diagnostic, Result, Vec2 } from "./types.js";

export type OdeValue = number | Vec2;
export type OdeSample<T extends OdeValue> = Readonly<{ time: number; state: T }>;
export type OdeDerivative<T extends OdeValue> = (time: number, state: T) => T;
export type OdeProblem<T extends OdeValue> = Readonly<{ initial: T; time: number; dt: number; steps: number; derivative: OdeDerivative<T> }>;
export type OdeTrace<T extends OdeValue> = Readonly<{ method: "euler" | "rk4"; samples: readonly OdeSample<T>[]; evaluations: number }>;

function freezeList<T>(values: T[]): readonly T[] { return Object.freeze([...values]); }
function failure<T>(diagnostics: readonly Diagnostic[]): Result<T> { return Object.freeze({ ok: false, diagnostics }); }
function isOdeValue(value: unknown): value is OdeValue { return isFiniteNumber(value) || isFiniteVec2(value); }
function sameShape<T extends OdeValue>(left: T, right: unknown): right is T { return typeof left === typeof right || (isFiniteVec2(left) && isFiniteVec2(right)); }
function addValue<T extends OdeValue>(left: T, right: T): T { return (typeof left === "number" ? left + (right as number) : add(left, right as Vec2)) as T; }
function scaleValue<T extends OdeValue>(value: T, amount: number): T { return (typeof value === "number" ? value * amount : scale(value, amount)) as T; }

function validate<T extends OdeValue>(problem: OdeProblem<T>): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!isOdeValue(problem?.initial)) diagnostics.push(diagnostic("invalid_ode_initial", "initial", "ODE initial state must be a finite scalar or Vec2."));
  if (!isFiniteNumber(problem?.time) || !isFiniteNumber(problem?.dt) || problem.dt <= 0 || !Number.isInteger(problem?.steps) || problem.steps < 0) diagnostics.push(diagnostic("invalid_ode_settings", "settings", "ODE time must be finite, dt positive finite, and steps a non-negative integer."));
  if (typeof problem?.derivative !== "function") diagnostics.push(diagnostic("invalid_ode_derivative", "derivative", "ODE derivative must be a function."));
  return freezeList(diagnostics);
}

function derivativeAt<T extends OdeValue>(problem: OdeProblem<T>, time: number, state: T): Result<T> {
  const value = problem.derivative(time, state);
  if (!sameShape(state, value) || !isOdeValue(value)) return Object.freeze({ ok: false, diagnostics: freezeList([diagnostic("invalid_ode_derivative_result", "derivative", "ODE derivatives must return a finite value with the initial state's shape.")]) });
  return Object.freeze({ ok: true, value });
}

function prepare<T extends OdeValue>(method: OdeTrace<T>["method"], problem: OdeProblem<T>): Result<{ samples: OdeSample<T>[]; state: T; time: number; method: OdeTrace<T>["method"] }> {
  const diagnostics = validate(problem);
  if (diagnostics.length > 0) return Object.freeze({ ok: false, diagnostics });
  return Object.freeze({ ok: true, value: { method, samples: [Object.freeze({ time: problem.time, state: problem.initial })], state: problem.initial, time: problem.time } });
}

/** Integrates a finite scalar or Vec2 ODE with explicit Euler steps. */
export function integrateEuler<T extends OdeValue>(problem: OdeProblem<T>): Result<OdeTrace<T>> {
  const prepared = prepare("euler", problem);
  if (prepared.ok === false) return failure(prepared.diagnostics);
  let { state, time } = prepared.value;
  let evaluations = 0;
  for (let step = 0; step < problem.steps; step += 1) {
    const derivative = derivativeAt(problem, time, state);
    evaluations += 1;
    if (derivative.ok === false) return failure(derivative.diagnostics);
    state = addValue(state, scaleValue(derivative.value, problem.dt));
    time += problem.dt;
    prepared.value.samples.push(Object.freeze({ time, state }));
  }
  return Object.freeze({ ok: true, value: Object.freeze({ method: "euler", samples: freezeList(prepared.value.samples), evaluations }) });
}

/** Integrates a finite scalar or Vec2 ODE with classical fourth-order Runge-Kutta. */
export function integrateRungeKutta4<T extends OdeValue>(problem: OdeProblem<T>): Result<OdeTrace<T>> {
  const prepared = prepare("rk4", problem);
  if (prepared.ok === false) return failure(prepared.diagnostics);
  let { state, time } = prepared.value;
  let evaluations = 0;
  for (let step = 0; step < problem.steps; step += 1) {
    const k1 = derivativeAt(problem, time, state); evaluations += 1;
    if (k1.ok === false) return failure(k1.diagnostics);
    const k2 = derivativeAt(problem, time + problem.dt / 2, addValue(state, scaleValue(k1.value, problem.dt / 2))); evaluations += 1;
    if (k2.ok === false) return failure(k2.diagnostics);
    const k3 = derivativeAt(problem, time + problem.dt / 2, addValue(state, scaleValue(k2.value, problem.dt / 2))); evaluations += 1;
    if (k3.ok === false) return failure(k3.diagnostics);
    const k4 = derivativeAt(problem, time + problem.dt, addValue(state, scaleValue(k3.value, problem.dt))); evaluations += 1;
    if (k4.ok === false) return failure(k4.diagnostics);
    const weighted = addValue(addValue(k1.value, scaleValue(k2.value, 2)), addValue(scaleValue(k3.value, 2), k4.value));
    state = addValue(state, scaleValue(weighted, problem.dt / 6));
    time += problem.dt;
    prepared.value.samples.push(Object.freeze({ time, state }));
  }
  return Object.freeze({ ok: true, value: Object.freeze({ method: "rk4", samples: freezeList(prepared.value.samples), evaluations }) });
}
