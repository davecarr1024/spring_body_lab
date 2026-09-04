import { advanceGame, createBlockRam, createMultiBodyLab, createRopeSwing, createSheetLift, createWeakWallBreach, launchRam, liftSheet, ramWeakWall, shareSceneRecipe, swingRope } from "../game/index.js";
import { vec2 } from "../math/index.js";

let game: any = createMultiBodyLab();
let playing = false;
let frame: number | undefined;

const particle = (id: string) => game.state.particles.find((entry: any) => entry.id === id);
const colorFor = (id: string) => id.startsWith("amber:") ? "amber" : "blue";
const line = (start: any, end: any, className: string) => `<line class="${className}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
const sceneName = () => game.scene === "weak-wall-breach" ? "Weak wall breach" : game.scene === "rope-swing" ? "Rope swing" : game.scene === "sheet-lift" ? "Sheet lift" : game.scene === "block-ram" ? "Block ram" : "Multi-body contact lab";
const goalStatus = () => !game.goal ? "Inspect forces and contact" : game.goal.kind === "breach" ? (game.goal.achieved ? "Breach achieved" : `Break ${game.goal.requiredSpringIds.length} weak seams`) : game.goal.kind === "reach_y" ? (game.goal.achieved ? "Lift achieved" : "Lift sheet edge to marker") : game.goal.kind === "ram_contact" ? (game.goal.achieved ? "Ram contact achieved" : "Make ram contact") : (game.goal.achieved ? "Swing achieved" : "Move rope tail past marker");

function evidence() {
  const contacts = game.lastResult?.contacts ?? [];
  return Object.freeze({ contacts, latest: contacts.at(-1), events: game.lastResult?.events ?? [], diagnostics: game.lastResult?.diagnostics ?? [] });
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
  const label = game.scene === "weak-wall-breach" ? "Weak wall breach arena" : game.scene === "rope-swing" ? "Rope swing arena" : game.scene === "sheet-lift" ? "Sheet lift arena" : game.scene === "block-ram" ? "Block ram arena" : "Multiple soft bodies in a fixed contact arena";
  return `<svg viewBox="0 0 480 300" role="img" aria-label="${label}">${fixed}${springs}${particles}${normals}</svg>`;
}

function render() {
  const contactEvidence = evidence();
  const latest = contactEvidence.latest;
  const recipe = shareSceneRecipe(game);
  document.querySelector("#app")!.innerHTML = `<main><header><p>Spring Body Lab · ${sceneName()}</p><h1>Deformable bodies, visible causes.</h1><span>Browser → game → physics → math</span></header><section>${sceneMarkup()}<div class="controls"><button id="step">Step</button><button id="play">${playing ? "Pause" : "Play"}</button><button id="nudge-amber">Nudge amber</button><button id="nudge-blue">Nudge blue</button><button id="weak-wall">Load weak wall</button><button id="ram-wall">Ram wall</button><button id="rope">Load rope</button><button id="swing-rope">Swing rope</button><button id="sheet">Load sheet</button><button id="lift-sheet">Lift sheet</button><button id="block-ram">Load block ram</button><button id="launch-ram">Launch ram</button><button id="reset">Reset</button></div><dl><div><dt>scene</dt><dd data-testid="scene-name">${sceneName()}</dd></div><div><dt>goal</dt><dd data-testid="goal-status">${goalStatus()}</dd></div><div><dt>step</dt><dd data-testid="step-value">${game.state.stepIndex}</dd></div><div><dt>bodies</dt><dd data-testid="body-count">${game.bodies.length}</dd></div><div><dt>particles</dt><dd data-testid="particle-count">${game.state.particles.length}</dd></div><div><dt>components</dt><dd data-testid="component-count">${game.state.components.length}</dd></div><div><dt>broken springs</dt><dd data-testid="broken-spring-count">${game.state.brokenSpringIds.length}</dd></div><div><dt>breaks this step</dt><dd data-testid="break-count">${contactEvidence.events.length}</dd></div><div><dt>diagnostics this step</dt><dd data-testid="diagnostic-count">${contactEvidence.diagnostics.length}</dd></div><div><dt>shareable recipe bytes</dt><dd data-testid="recipe-size">${recipe.length}</dd></div><div><dt>contacts this step</dt><dd data-testid="contact-count">${contactEvidence.contacts.length}</dd></div><div><dt>latest contact</dt><dd data-testid="latest-contact">${latest ? latest.kind : "none"}</dd></div></dl><p class="note">Springs, circles, contact normals, diagnostics, strain breaks, components, goals, and portable recipes are returned physics/game evidence. The browser only renders the game record.</p></section></main>`;
  document.querySelector("#step")!.addEventListener("click", () => tick());
  document.querySelector("#play")!.addEventListener("click", () => { playing = !playing; if (playing) frame = requestAnimationFrame(animate); render(); });
  document.querySelector("#nudge-amber")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "amber:p:0:0", impulse: vec2(90, -80) }]));
  document.querySelector("#nudge-blue")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "blue:p:0:0", impulse: vec2(-90, -80) }]));
  document.querySelector("#weak-wall")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = createWeakWallBreach(); render(); });
  document.querySelector("#ram-wall")!.addEventListener("click", () => {
    const advanced = ramWeakWall(game);
    if (!advanced.result) return;
    game = Object.freeze({ ...advanced.game, lastResult: advanced.result });
    render();
  });
  document.querySelector("#rope")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = createRopeSwing(); render(); });
  document.querySelector("#swing-rope")!.addEventListener("click", () => {
    const advanced = swingRope(game);
    if (!advanced.result) return;
    game = Object.freeze({ ...advanced.game, lastResult: advanced.result });
    render();
  });
  document.querySelector("#sheet")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = createSheetLift(); render(); });
  document.querySelector("#lift-sheet")!.addEventListener("click", () => { const advanced = liftSheet(game); if (!advanced.result) return; game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); render(); });
  document.querySelector("#block-ram")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = createBlockRam(); render(); });
  document.querySelector("#launch-ram")!.addEventListener("click", () => { const advanced = launchRam(game); if (!advanced.result) return; game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); render(); });
  document.querySelector("#reset")!.addEventListener("click", () => { playing = false; if (frame) cancelAnimationFrame(frame); game = game.scene === "weak-wall-breach" ? createWeakWallBreach() : game.scene === "rope-swing" ? createRopeSwing() : game.scene === "sheet-lift" ? createSheetLift() : game.scene === "block-ram" ? createBlockRam() : createMultiBodyLab(); render(); });
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
  document.querySelector("[data-testid=diagnostic-count]")!.textContent = String(contactEvidence.diagnostics.length);
  document.querySelector("[data-testid=recipe-size]")!.textContent = String(shareSceneRecipe(game).length);
  document.querySelector("[data-testid=goal-status]")!.textContent = goalStatus();
}

function animate() { if (!playing) return; advance(); updateEvidence(); frame = requestAnimationFrame(animate); }

render();
