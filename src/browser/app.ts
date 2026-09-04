import { advanceGame, createMultiBodyLab } from "../game/index.js";
import { vec2 } from "../math/index.js";

let game: any = createMultiBodyLab();
let playing = false;
let frame: number | undefined;

const particle = (id: string) => game.state.particles.find((entry: any) => entry.id === id);
const colorFor = (id: string) => id.startsWith("amber:") ? "amber" : "blue";
const line = (start: any, end: any, className: string) => `<line class="${className}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;

function evidence() {
  const contacts = game.lastResult?.contacts ?? [];
  return Object.freeze({ contacts, latest: contacts.at(-1), events: game.lastResult?.events ?? [] });
}

function sceneMarkup() {
  const contactEvidence = evidence();
  const fixed = game.definition.fixedSegments.map((fixed: any) => line(fixed.start, fixed.end, "fixed")).join("");
  const springs = game.definition.springs.map((spring: any) => `<line data-spring="${spring.id}" class="spring ${colorFor(spring.a)} ${game.state.brokenSpringIds.includes(spring.id) ? "broken" : ""}" x1="${particle(spring.a).position.x}" y1="${particle(spring.a).position.y}" x2="${particle(spring.b).position.x}" y2="${particle(spring.b).position.y}"/>`).join("");
  const particles = game.definition.particles.map((definition: any) => {
    const state = particle(definition.id);
    return `<circle data-particle="${definition.id}" class="particle ${colorFor(definition.id)}" cx="${state.position.x}" cy="${state.position.y}" r="${definition.radius}"/>`;
  }).join("");
  const normals = contactEvidence.contacts.filter((contact: any) => contact.kind === "particle_segment").map((contact: any) => line(contact.point, { x: contact.point.x + contact.normal.x * 18, y: contact.point.y + contact.normal.y * 18 }, "normal")).join("");
  return `<svg viewBox="0 0 480 300" role="img" aria-label="Multiple soft bodies in a fixed contact arena">${fixed}${springs}${particles}${normals}</svg>`;
}

function render() {
  const contactEvidence = evidence();
  const latest = contactEvidence.latest;
  document.querySelector("#app")!.innerHTML = `<main><header><p>Spring Body Lab · multi-body physics</p><h1>Deformable bodies, visible causes.</h1><span>Browser → game → physics → math</span></header><section>${sceneMarkup()}<div class="controls"><button id="step">Step</button><button id="play">${playing ? "Pause" : "Play"}</button><button id="nudge-amber">Nudge amber</button><button id="nudge-blue">Nudge blue</button><button id="reset">Reset</button></div><dl><div><dt>step</dt><dd data-testid="step-value">${game.state.stepIndex}</dd></div><div><dt>bodies</dt><dd data-testid="body-count">${game.bodies.length}</dd></div><div><dt>particles</dt><dd data-testid="particle-count">${game.state.particles.length}</dd></div><div><dt>components</dt><dd data-testid="component-count">${game.state.components.length}</dd></div><div><dt>broken springs</dt><dd data-testid="broken-spring-count">${game.state.brokenSpringIds.length}</dd></div><div><dt>breaks this step</dt><dd data-testid="break-count">${contactEvidence.events.length}</dd></div><div><dt>contacts this step</dt><dd data-testid="contact-count">${contactEvidence.contacts.length}</dd></div><div><dt>latest contact</dt><dd data-testid="latest-contact">${latest ? latest.kind : "none"}</dd></div></dl><p class="note">Springs, circles, contact normals, strain breaks, and component counts are returned physics evidence. The browser only renders the game record.</p></section></main>`;
  document.querySelector("#step")!.addEventListener("click", () => tick());
  document.querySelector("#play")!.addEventListener("click", () => { playing = !playing; if (playing) frame = requestAnimationFrame(animate); render(); });
  document.querySelector("#nudge-amber")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "amber:p:0:0", impulse: vec2(90, -80) }]));
  document.querySelector("#nudge-blue")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "blue:p:0:0", impulse: vec2(-90, -80) }]));
  document.querySelector("#reset")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = createMultiBodyLab(); render(); });
}

function advance(commands: any[] = []) {
  const advanced = advanceGame(game, commands);
  game = Object.freeze({ ...advanced.game, lastResult: advanced.result });
}

function tick(commands: any[] = []) { advance(commands); render(); }

function updateEvidence() {
  for (const definition of game.definition.particles) {
    const state = particle(definition.id);
    const circle = document.querySelector(`[data-particle="${definition.id}"]`);
    circle?.setAttribute("cx", state.position.x);
    circle?.setAttribute("cy", state.position.y);
  }
  for (const spring of game.definition.springs) {
    const element = document.querySelector(`[data-spring="${spring.id}"]`);
    const a = particle(spring.a);
    const b = particle(spring.b);
    element?.setAttribute("x1", a.position.x);
    element?.setAttribute("y1", a.position.y);
    element?.setAttribute("x2", b.position.x);
    element?.setAttribute("y2", b.position.y);
    element?.classList.toggle("broken", game.state.brokenSpringIds.includes(spring.id));
  }
  const contactEvidence = evidence();
  document.querySelector("[data-testid=step-value]")!.textContent = String(game.state.stepIndex);
  document.querySelector("[data-testid=contact-count]")!.textContent = String(contactEvidence.contacts.length);
  document.querySelector("[data-testid=latest-contact]")!.textContent = contactEvidence.latest ? contactEvidence.latest.kind : "none";
  document.querySelector("[data-testid=component-count]")!.textContent = String(game.state.components.length);
  document.querySelector("[data-testid=broken-spring-count]")!.textContent = String(game.state.brokenSpringIds.length);
  document.querySelector("[data-testid=break-count]")!.textContent = String(contactEvidence.events.length);
}

function animate() { if (!playing) return; advance(); updateEvidence(); frame = requestAnimationFrame(animate); }

render();
