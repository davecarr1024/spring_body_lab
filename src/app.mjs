import { energy, exactUndamped, run, solverNames } from "./oscillator.mjs";

const state = { dt: 0.1, solver: "Semi-implicit", time: 2.5 };
const initial = { x: 1, v: 0 };
const parameters = { mass: 1, stiffness: 4, damping: 0 };
const colors = { Euler: "#f15b44", "Semi-implicit": "#42b7a5", RK4: "#7199ff", exact: "#e7c26d" };
const duration = 8;

function path(values, width, height, min, max) {
  return values.map((value, index) => {
    const x = index / Math.max(1, values.length - 1) * width;
    const y = height - (value - min) / (max - min) * height;
    return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function render() {
  const traces = Object.fromEntries(solverNames.map((name) => [name, run({ initial, parameters, dt: state.dt, duration, solver: name })]));
  const active = traces[state.solver];
  const index = Math.min(active.length - 1, Math.round(state.time / state.dt));
  const current = active[index];
  const exact = exactUndamped(current.time, initial, parameters);
  const allValues = [
    ...Array.from({ length: 401 }, (_, i) => exactUndamped(duration * i / 400, initial, parameters).x),
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
  const exactLine = Array.from({ length: 401 }, (_, i) => exactUndamped(duration * i / 400, initial, parameters).x);
  const error = Math.abs(current.state.x - exact.x);
  document.querySelector("#app").innerHTML = `
    <main class="lab-shell">
      <header class="topline"><div><p class="eyebrow">Spring Body Lab · phase 0</p><h1>One equation. Three approximations.</h1></div><div class="equation"><span>dx/dt = v</span><span>dv/dt = −4x</span></div></header>
      <section class="workbench">
        <aside class="controls"><div><p class="panel-label">Integrator</p><div class="solver-list">${solverNames.map((name) => `<button class="solver ${state.solver === name ? "selected" : ""}" data-solver="${name}"><i style="background:${colors[name]}"></i>${name}</button>`).join("")}</div></div>
        <label class="range-control"><span>Step size <b>${state.dt.toFixed(3)} s</b></span><input id="dt" type="range" min="0.01" max="0.25" step="0.01" value="${state.dt}"><small>Make the numerical compromise visible.</small></label>
        <div class="constants"><p class="panel-label">Fixed world</p><div><span>mass</span><b>1.00</b></div><div><span>stiffness</span><b>4.00</b></div><div><span>damping</span><b>0.00</b></div><div><span>initial x</span><b>1.00</b></div></div></aside>
        <section class="instrument-panel"><div class="visual-card"><div class="card-heading"><span>Current state</span><b>t = ${current.time.toFixed(2)} s</b></div><svg class="spring-view" viewBox="0 0 430 220" aria-label="Mass on a spring"><defs><linearGradient id="bob" x1="0" x2="1"><stop stop-color="#f5d67d"/><stop offset="1" stop-color="#e99e5a"/></linearGradient></defs><path d="M42 36 H390" class="ceiling"/><path d="M70 36 V80" class="mount"/><polyline points="${spring}" class="spring"/><line x1="${bobX}" y1="72" x2="${bobX}" y2="144" class="guide"/><circle cx="${bobX}" cy="150" r="35" fill="url(#bob)" class="bob"/><text x="${bobX}" y="157" text-anchor="middle">m</text><line x1="240" y1="201" x2="${bobX}" y2="201" class="measure"/><circle cx="240" cy="201" r="3" class="origin"/></svg><div class="readout"><span>x <b>${current.state.x.toFixed(4)}</b></span><span>v <b>${current.state.v.toFixed(4)}</b></span><span>E <b>${energy(current.state, parameters).toFixed(4)}</b></span></div></div>
        <div class="plot-card"><div class="card-heading"><span>Displacement trace</span><span class="legend"><i style="background:${colors.exact}"></i>exact <i style="background:${colors[state.solver]}"></i>${state.solver}</span></div><svg viewBox="0 0 700 250" class="plot" aria-label="Numerical and exact displacement traces"><line x1="0" x2="700" y1="125" y2="125" class="axis"/><path d="${path(exactLine, 700, 250, min, max)}" fill="none" stroke="${colors.exact}" stroke-width="2" stroke-dasharray="5 5"/><path d="${path(active.map((entry) => entry.state.x), 700, 250, min, max)}" fill="none" stroke="${colors[state.solver]}" stroke-width="3"/><line x1="${current.time / duration * 700}" x2="${current.time / duration * 700}" y1="0" y2="250" class="cursor"/></svg><input id="time" class="timeline" type="range" min="0" max="${duration}" step="${state.dt}" value="${state.time}"><div class="plot-footer"><span>0 s</span><span>4 s</span><span>8 s</span></div></div></section>
        <aside class="evidence"><p class="panel-label">Evidence at this tick</p><div class="metric"><span>exact x</span><b>${exact.x.toFixed(5)}</b></div><div class="metric"><span>absolute error</span><b class="${error > .1 ? "warning" : ""}">${error.toExponential(2)}</b></div><div class="metric"><span>energy drift</span><b>${(energy(current.state, parameters) - 2).toExponential(2)}</b></div><div class="why"><p>Why this matters</p><span>${state.solver === "Euler" ? "Euler samples the old velocity, so its orbit gains energy." : state.solver === "Semi-implicit" ? "Velocity updates before position, which keeps this oscillator bounded much longer." : "RK4 samples the derivative four times, buying accuracy at extra cost."}</span></div></aside>
      </section><footer><span>Undamped harmonic oscillator · analytic reference available</span><span>Headless model • deterministic trace • browser inspector</span></footer></main>`;
  document.querySelectorAll("[data-solver]").forEach((button) => button.addEventListener("click", () => { state.solver = button.dataset.solver; render(); }));
  document.querySelector("#dt").addEventListener("input", (event) => { state.dt = Number(event.target.value); state.time = 2.5; render(); });
  document.querySelector("#time").addEventListener("input", (event) => { state.time = Number(event.target.value); render(); });
}

render();
