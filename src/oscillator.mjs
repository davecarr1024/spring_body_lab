export const solverNames = ["Euler", "Semi-implicit", "Midpoint (RK2)", "Velocity Verlet", "RK4"];

export function derivative(state, { mass, stiffness, damping, gravity = 0 }) {
  return { x: state.v, v: (-stiffness * state.x - damping * state.v) / mass + gravity };
}

function add(state, delta, scale) {
  return { x: state.x + delta.x * scale, v: state.v + delta.v * scale };
}

export function stepEuler(state, parameters, dt) {
  return add(state, derivative(state, parameters), dt);
}

export function stepSemiImplicit(state, parameters, dt) {
  const v = state.v + derivative(state, parameters).v * dt;
  return { x: state.x + v * dt, v };
}

export function stepMidpoint(state, parameters, dt) {
  const half = add(state, derivative(state, parameters), dt / 2);
  return add(state, derivative(half, parameters), dt);
}

export function stepVelocityVerlet(state, parameters, dt) {
  const acceleration = derivative(state, parameters).v;
  const x = state.x + state.v * dt + 0.5 * acceleration * dt ** 2;
  const nextAcceleration = derivative({ x, v: state.v }, parameters).v;
  return { x, v: state.v + 0.5 * (acceleration + nextAcceleration) * dt };
}

export function stepRk4(state, parameters, dt) {
  const k1 = derivative(state, parameters);
  const k2 = derivative(add(state, k1, dt / 2), parameters);
  const k3 = derivative(add(state, k2, dt / 2), parameters);
  const k4 = derivative(add(state, k3, dt), parameters);
  return {
    x: state.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    v: state.v + (dt / 6) * (k1.v + 2 * k2.v + 2 * k3.v + k4.v),
  };
}

export const solvers = {
  Euler: stepEuler,
  "Semi-implicit": stepSemiImplicit,
  "Midpoint (RK2)": stepMidpoint,
  "Velocity Verlet": stepVelocityVerlet,
  RK4: stepRk4,
};

export function energy(state, { mass, stiffness, gravity = 0 }) {
  return 0.5 * mass * state.v ** 2 + 0.5 * stiffness * state.x ** 2 - mass * gravity * state.x;
}

export function exactUndamped(time, initial, { mass, stiffness }) {
  const omega = Math.sqrt(stiffness / mass);
  return {
    x: initial.x * Math.cos(omega * time) + (initial.v / omega) * Math.sin(omega * time),
    v: -initial.x * omega * Math.sin(omega * time) + initial.v * Math.cos(omega * time),
  };
}

export function exactGravity(time, initial, { gravity = -9.81 }) {
  return {
    x: initial.x + initial.v * time + 0.5 * gravity * time ** 2,
    v: initial.v + gravity * time,
  };
}

export function run({ initial, parameters, dt, duration, solver }) {
  let state = initial;
  let time = 0;
  const trace = [{ time, state, energy: energy(state, parameters) }];
  for (let step = 0; step < Math.round(duration / dt); step += 1) {
    state = solvers[solver](state, parameters, dt);
    time += dt;
    trace.push({ time, state, energy: energy(state, parameters) });
  }
  return trace;
}
