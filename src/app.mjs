import { energy, exactGravity, exactUndamped, run, solverNames } from "./oscillator.mjs";

const state = {
  dt: 0.1,
  solver: "Semi-implicit",
  scenario: "spring",
  time: 2.5,
  playing: false,
  parameters: { mass: 1, stiffness: 4, damping: 0 },
  initial: { x: 1, v: 0 },
};
const colors = { Euler: "#f15b44", "Semi-implicit": "#42b7a5", "Midpoint (RK2)": "#c980ff", "Velocity Verlet": "#67c4dc", RK4: "#7199ff", exact: "#e7c26d" };
const scenarios = {
  spring: { label: "Spring", duration: 8, parameters: { mass: 1, stiffness: 4, damping: 0, gravity: 0 }, initial: { x: 1, v: 0 } },
  gravity: { label: "Free fall", duration: 1.4, parameters: { mass: 1, stiffness: 0, damping: 0, gravity: -9.81 }, initial: { x: 1, v: 0 } },
};
let animationFrame;
let lastFrame;
let lastRenderFrame;

function path(values, width, height, min, max) {
  return values.map((value, index) => {
    const x = index / Math.max(1, values.length - 1) * width;
    const y = height - (value - min) / (max - min) * height;
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function explanation() {
  switch (state.solver) {
    case "Euler": return "Euler samples the old velocity, so its orbit gains energy.";
    case "Semi-implicit": return "Velocity updates before position, which keeps this oscillator bounded much longer.";
    case "Midpoint (RK2)": return "Midpoint samples the slope halfway through the step: a cheap taste of higher-order integration.";
    case "Velocity Verlet": return "Velocity Verlet is built for conservative mechanics and keeps energy behavior remarkably honest.";
    default: return "RK4 samples the derivative four times, buying accuracy at extra cost.";
  }
}

function control(id, label, value, min, max, step, suffix = "") {
  return `<label class="range-control"><span>${label} <b>${Number(value).toFixed(step < 1 ? 2 : 1)}${suffix}</b></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></label>`;
}

function render() {
  const { parameters, initial } = state;
  const scenario = scenarios[state.scenario];
  const duration = scenario.duration;
  const exactAt = state.scenario === "gravity" ? exactGravity : exactUndamped;
  const traces = Object.fromEntries(solverNames.map((name) => [name, run({ initial, parameters, dt: state.dt, duration, solver: name })]));
  const active = traces[state.solver];
  const index = Math.min(active.length - 1, Math.round(state.time / state.dt));
  const current = active[index];
  const exact = exactAt(current.time, initial, parameters);
  const allValues = [
    ...Array.from({ length: 401 }, (_, i) => exactAt(duration * i / 400, initial, parameters).x),
    ...Object.values(traces).flatMap((trace) => trace.map((entry) => entry.state.x)),
  ];
  const min = Math.min(-1.5, ...allValues);
  const max = Math.max(1.5, ...allValues);
  const displayX = Math.max(-1.25, Math.min(1.25, current.state.x));
  const bobX = 240 + displayX * 92;
  const spring = Array.from({ length: 25 }, (_, i) => {
    const p = i / 24;
    return `${80 + (bobX - 98 - 80) * p},${108 + (i === 0 || i === 24 ? 0 : i % 2 ? -17 : 17)}`;
  }).join(" ");
  const exactLine = Array.from({ length: 401 }, (_, i) => exactAt(duration * i / 400, initial, parameters).x);
  const error = Math.abs(current.state.x - exact.x);
  const omega = parameters.stiffness ? Math.sqrt(parameters.stiffness / parameters.mass) : null;
  document.querySelector("#app").innerHTML = `
    <main class="lab-shell">
      <header class="topline"><div><p class="eyebrow">Spring Body Lab · phase 0</p><h1>One equation. Five approximations.</h1></div><div class="equation"><span>dx/dt = v</span><span>dv/dt = ${state.scenario === "gravity" ? parameters.gravity.toFixed(2) : `−${(parameters.stiffness / parameters.mass).toFixed(2)}x`}</span></div></header>
      <section class="workbench">
        <aside class="controls"><div><p class="panel-label">World</p><div class="solver-list">${Object.entries(scenarios).map(([key, item]) => `<button class="solver ${state.scenario === key ? "selected" : ""}" data-scenario="${key}">${item.label}</button>`).join("")}</div></div><div><p class="panel-label">Integrator</p><div class="solver-list">${solverNames.map((name) => `<button class="solver ${state.solver === name ? "selected" : ""}" data-solver="${name}"><i style="background:${colors[name]}"></i>${name}</button>`).join("")}</div></div>
        <div class="control-group"><p class="panel-label">Experiment</p>${control("dt", "step size", state.dt, .01, .25, .01, " s")}${control("mass", "mass", parameters.mass, .25, 4, .25)}${state.scenario === "spring" ? control("stiffness", "stiffness", parameters.stiffness, .5, 12, .5) : control("gravity", "gravity", parameters.gravity, -20, -1, .25)}${control("initial-x", "initial x", initial.x, -1.5, 10, .1)}${control("initial-v", "initial v", initial.v, -4, 4, .25)}</div>
        <div class="constants"><p class="panel-label">Derived</p><div><span>${omega ? "natural ω" : "acceleration"}</span><b>${omega ? omega.toFixed(3) : `${parameters.gravity.toFixed(2)} m/s²`}</b></div><div><span>${omega ? "period" : "reference"}</span><b>${omega ? `${(2 * Math.PI / omega).toFixed(3)} s` : "constant acceleration"}</b></div><div><span>damping</span><b>0.00</b></div></div></aside>
        <section class="instrument-panel"><div class="visual-card"><div class="card-heading"><span>Current state</span><b>t = ${current.time.toFixed(2)} s</b></div><svg class="spring-view" viewBox="0 0 430 220" aria-label="Mass on a spring"><defs><linearGradient id="bob" x1="0" x2="1"><stop stop-color="#f5d67d"/><stop offset="1" stop-color="#e99e5a"/></linearGradient></defs><path d="M42 36 H390" class="ceiling"/><path d="M70 36 V80" class="mount"/><polyline points="${spring}" class="spring"/><line x1="${bobX}" y1="72" x2="${bobX}" y2="144" class="guide"/><circle cx="${bobX}" cy="150" r="35" fill="url(#bob)" class="bob"/><text x="${bobX}" y="157" text-anchor="middle">m</text><line x1="240" y1="201" x2="${bobX}" y2="201" class="measure"/><circle cx="240" cy="201" r="3" class="origin"/></svg><div class="readout"><span>x <b>${current.state.x.toFixed(4)}</b></span><span>v <b>${current.state.v.toFixed(4)}</b></span><span>E <b>${energy(current.state, parameters).toFixed(4)}</b></span></div></div>
        <div class="plot-card"><div class="card-heading"><span>Displacement trace</span><span class="legend"><i style="background:${colors.exact}"></i>exact <i style="background:${colors[state.solver]}"></i>${state.solver}</span></div><svg viewBox="0 0 700 250" class="plot" aria-label="Numerical and exact displacement traces"><line x1="0" x2="700" y1="125" y2="125" class="axis"/><path d="${path(exactLine, 700, 250, min, max)}" fill="none" stroke="${colors.exact}" stroke-width="2" stroke-dasharray="5 5"/><path d="${path(active.map((entry) => entry.state.x), 700, 250, min, max)}" fill="none" stroke="${colors[state.solver]}" stroke-width="3"/><line x1="${current.time / duration * 700}" x2="${current.time / duration * 700}" y1="0" y2="250" class="cursor"/></svg><div class="transport"><button id="play" class="play">${state.playing ? "❚❚ Pause" : "▶ Play"}</button><button id="reset" class="reset">Reset</button><input id="time" class="timeline" type="range" min="0" max="${duration}" step="${state.dt}" value="${state.time}"></div><div class="plot-footer"><span>0 s</span><span>4 s</span><span>8 s</span></div></div></section>
        <aside class="evidence"><p class="panel-label">Evidence at this tick</p><div class="metric"><span>exact x</span><b>${exact.x.toFixed(5)}</b></div><div class="metric"><span>absolute error</span><b class="${error > .1 ? "warning" : ""}">${error.toExponential(2)}</b></div><div class="metric"><span>energy drift</span><b>${(energy(current.state, parameters) - energy(initial, parameters)).toExponential(2)}</b></div><div class="why"><p>Why this matters</p><span>${explanation()}</span></div></aside>
      </section><footer><span>Undamped harmonic oscillator · analytic reference available</span><span>Headless model • deterministic trace • browser inspector</span></footer></main>`;
  document.querySelectorAll("[data-solver]").forEach((button) => button.addEventListener("click", () => { state.solver = button.dataset.solver; state.playing = false; render(); }));
  document.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
    const next = scenarios[button.dataset.scenario];
    state.scenario = button.dataset.scenario;
    state.parameters = { ...next.parameters };
    state.initial = { ...next.initial };
    state.time = 0;
    state.playing = false;
    render();
  }));
  const update = (id, setter) => document.querySelector(`#${id}`).addEventListener("input", (event) => { setter(Number(event.target.value)); state.playing = false; state.time = 0; render(); });
  update("dt", (value) => { state.dt = value; });
  update("mass", (value) => { parameters.mass = value; });
  update("stiffness", (value) => { parameters.stiffness = value; });
  if (state.scenario === "gravity") update("gravity", (value) => { parameters.gravity = value; });
  update("initial-x", (value) => { initial.x = value; });
  update("initial-v", (value) => { initial.v = value; });
  document.querySelector("#time").addEventListener("input", (event) => { state.playing = false; state.time = Number(event.target.value); render(); });
  document.querySelector("#play").addEventListener("click", () => { state.playing = !state.playing; if (state.playing) { lastFrame = undefined; lastRenderFrame = undefined; animationFrame = requestAnimationFrame(animate); } else { cancelAnimationFrame(animationFrame); } render(); });
  document.querySelector("#reset").addEventListener("click", () => { state.playing = false; state.time = 0; cancelAnimationFrame(animationFrame); render(); });
}

function animate(now) {
  if (!state.playing) return;
  if (lastFrame !== undefined) state.time = (state.time + (now - lastFrame) / 1000) % duration;
  lastFrame = now;
  if (lastRenderFrame === undefined || now - lastRenderFrame >= 200) {
    lastRenderFrame = now;
    render();
  }
  animationFrame = requestAnimationFrame(animate);
}

render();
