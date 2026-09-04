import { advanceGame, createBlockRam, createBreachRun, createMossyardCourier, createMultiBodyLab, createRopeSwing, createSheetLift, createWeakWallBreach, driveMossCourier, fireBreachCharge, launchRam, liftSheet, ramWeakWall, shareSceneRecipe, swingRope } from "../game/index.js";
import { vec2 } from "../math/index.js";
import { skinForBody, softBodySkins } from "./skins.js";

const standaloneMossyard = window.location.pathname.endsWith("mossyard.html");
let game: any = standaloneMossyard ? createMossyardCourier() : createMultiBodyLab();
let playing = standaloneMossyard;
let frame: number | undefined;
let pointerTarget: { x: number; y: number } | undefined;
let inputStatus = standaloneMossyard ? "Courier awake — steer toward the moon gate." : "Choose Mossyard Courier to play with keyboard or mouse.";
const pressedKeys = new Set<string>();

const particle = (id: string) => game.state.particles.find((entry: any) => entry.id === id);
const line = (start: any, end: any, className: string) => `<line class="${className}" x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}"/>`;
const sceneName = () => game.scene === "mossyard-courier" ? "Mossyard Courier" : game.scene === "breach-run" ? "Breach Run" : game.scene === "weak-wall-breach" ? "Weak wall breach" : game.scene === "rope-swing" ? "Rope swing" : game.scene === "sheet-lift" ? "Sheet lift" : game.scene === "block-ram" ? "Block ram" : "Multi-body contact lab";
const goalStatus = () => !game.goal ? "Inspect forces and contact" : game.scene === "mossyard-courier" ? (game.goal.achieved ? "Gate reached — delivery complete!" : "Guide the courier to the moon gate") : game.scene === "breach-run" ? (game.goal.achieved ? "Mission complete" : "Objective: breach the weak wall") : game.goal.kind === "breach" ? (game.goal.achieved ? "Breach achieved" : `Break ${game.goal.requiredSpringIds.length} weak seams`) : game.goal.kind === "reach_y" ? (game.goal.achieved ? "Lift achieved" : "Lift sheet edge to marker") : game.goal.kind === "ram_contact" ? (game.goal.achieved ? "Ram contact achieved" : "Make ram contact") : (game.goal.achieved ? "Swing achieved" : "Move rope tail past marker");
const arenaLabel = () => game.scene === "mossyard-courier" ? "Mossyard Courier playable garden" : game.scene === "breach-run" ? "Breach Run arena" : game.scene === "weak-wall-breach" ? "Weak wall breach arena" : game.scene === "rope-swing" ? "Rope swing arena" : game.scene === "sheet-lift" ? "Sheet lift arena" : game.scene === "block-ram" ? "Block ram arena" : "Multiple soft bodies in a fixed contact arena";

function evidence() { const contacts = game.lastResult?.contacts ?? []; return Object.freeze({ contacts, latest: contacts.at(-1), events: game.lastResult?.events ?? [], diagnostics: game.lastResult?.diagnostics ?? [] }); }

function faceMarkup() {
  return game.bodies.flatMap((body: any) => {
    const skin = skinForBody(body.id);
    return body.faces.map((face: any) => `<polygon data-face="${face.id}" class="skin-face" fill="url(#skin-${skin.id})" stroke="${skin.stroke}" points="${face.particleIds.map((id: string) => `${particle(id).position.x},${particle(id).position.y}`).join(" ")}"/>`);
  }).join("");
}

function sceneMarkup() {
  const contactEvidence = evidence();
  const patterns = Object.values(softBodySkins).map((skin) => `<pattern id="skin-${skin.id}" width="${skin.scale}" height="${skin.scale}" patternUnits="userSpaceOnUse"><image href="${skin.texturePath}" width="${skin.scale}" height="${skin.scale}" preserveAspectRatio="xMidYMid slice"/></pattern>`).join("");
  const fixed = game.definition.fixedSegments.map((fixed: any) => line(fixed.start, fixed.end, "fixed")).join("");
  const springs = game.definition.springs.map((spring: any) => `<line data-spring="${spring.id}" class="spring ${game.state.brokenSpringIds.includes(spring.id) ? "broken" : ""}" x1="${particle(spring.a).position.x}" y1="${particle(spring.a).position.y}" x2="${particle(spring.b).position.x}" y2="${particle(spring.b).position.y}"/>`).join("");
  const particles = game.definition.particles.map((definition: any) => { const skin = skinForBody(definition.id.split(":")[0]); const state = particle(definition.id); return `<circle data-particle="${definition.id}" class="particle" fill="${skin.particleFill}" cx="${state.position.x}" cy="${state.position.y}" r="${definition.radius}"/>`; }).join("");
  const normals = contactEvidence.contacts.filter((contact: any) => contact.kind === "particle_segment").map((contact: any) => line(contact.point, { x: contact.point.x + contact.normal.x * 18, y: contact.point.y + contact.normal.y * 18 }, "normal")).join("");
  const gate = game.scene === "mossyard-courier" ? `<g class="moon-gate"><path d="M365 246V192 Q390 154 415 192V246"/><text x="390" y="178">MOON GATE</text></g>` : "";
  return `<svg id="arena" viewBox="0 0 480 300" role="img" aria-label="${arenaLabel()}"><defs>${patterns}</defs><rect class="sky" width="480" height="300"/>${gate}${fixed}${faceMarkup()}${springs}${particles}${normals}</svg>`;
}

function render() {
  const contactEvidence = evidence(); const latest = contactEvidence.latest; const recipe = shareSceneRecipe(game); const mossyard = game.scene === "mossyard-courier";
  document.querySelector("#app")!.innerHTML = `<main><header><p>Spring Body Lab · ${sceneName()}</p><h1>${mossyard ? "Mossyard Courier" : "Deformable bodies, visible causes."}</h1><span>${mossyard ? "Guide a living moss parcel through the old garden." : "Browser → game → physics → math"}</span></header><section class="game-shell ${mossyard ? "mossyard" : ""}"><div class="mission"><strong data-testid="mission-title">${mossyard ? "DELIVERY 01 · MOON GATE" : sceneName()}</strong><span data-testid="goal-status">${goalStatus()}</span><span class="feedback" data-testid="input-status">${mossyard ? inputStatus : "Named actions use deterministic physics commands."}</span></div>${sceneMarkup()}<div class="controls"><button id="mossyard">Play Mossyard</button><button id="step">Step</button><button id="play">${playing ? "Pause" : "Play"}</button><button id="nudge-amber">Nudge amber</button><button id="nudge-blue">Nudge blue</button><button id="weak-wall">Load weak wall</button><button id="ram-wall">Ram wall</button><button id="rope">Load rope</button><button id="swing-rope">Swing rope</button><button id="sheet">Load sheet</button><button id="lift-sheet">Lift sheet</button><button id="block-ram">Load block ram</button><button id="launch-ram">Launch ram</button><button id="breach-run">Start Breach Run</button><button id="fire-breach">Fire breach charge</button><button id="reset">Reset</button></div><p class="control-hint" data-testid="control-hint">${mossyard ? "Steer: WASD or arrow keys · Click the garden to set a course · Simulation runs live" : "Choose Play Mossyard for live keyboard and mouse steering."}</p><dl><div><dt>scene</dt><dd data-testid="scene-name">${sceneName()}</dd></div><div><dt>step</dt><dd data-testid="step-value">${game.state.stepIndex}</dd></div><div><dt>bodies</dt><dd data-testid="body-count">${game.bodies.length}</dd></div><div><dt>particles</dt><dd data-testid="particle-count">${game.state.particles.length}</dd></div><div><dt>components</dt><dd data-testid="component-count">${game.state.components.length}</dd></div><div><dt>broken springs</dt><dd data-testid="broken-spring-count">${game.state.brokenSpringIds.length}</dd></div><div><dt>breaks this step</dt><dd data-testid="break-count">${contactEvidence.events.length}</dd></div><div><dt>diagnostics this step</dt><dd data-testid="diagnostic-count">${contactEvidence.diagnostics.length}</dd></div><div><dt>shareable recipe bytes</dt><dd data-testid="recipe-size">${recipe.length}</dd></div><div><dt>contacts this step</dt><dd data-testid="contact-count">${contactEvidence.contacts.length}</dd></div><div><dt>latest contact</dt><dd data-testid="latest-contact">${latest ? latest.kind : "none"}</dd></div></dl><p class="note">Faces select renderer-owned skins; springs, contact normals, fracture, controls, and completion remain returned game/physics evidence.</p></section></main>`;
  document.querySelector("#step")!.addEventListener("click", () => tick());
  document.querySelector("#play")!.addEventListener("click", () => { playing = !playing; if (playing) frame = requestAnimationFrame(animate); render(); });
  document.querySelector("#nudge-amber")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "amber:p:0:0", impulse: vec2(90, -80) }]));
  document.querySelector("#nudge-blue")!.addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "blue:p:0:0", impulse: vec2(-90, -80) }]));
  document.querySelector("#mossyard")!.addEventListener("click", () => loadScene(createMossyardCourier(), true, "Courier awake — steer toward the moon gate."));
  document.querySelector("#weak-wall")!.addEventListener("click", () => loadScene(createWeakWallBreach()));
  document.querySelector("#ram-wall")!.addEventListener("click", () => applyNamed(ramWeakWall));
  document.querySelector("#rope")!.addEventListener("click", () => loadScene(createRopeSwing()));
  document.querySelector("#swing-rope")!.addEventListener("click", () => applyNamed(swingRope));
  document.querySelector("#sheet")!.addEventListener("click", () => loadScene(createSheetLift()));
  document.querySelector("#lift-sheet")!.addEventListener("click", () => applyNamed(liftSheet));
  document.querySelector("#block-ram")!.addEventListener("click", () => loadScene(createBlockRam()));
  document.querySelector("#launch-ram")!.addEventListener("click", () => applyNamed(launchRam));
  document.querySelector("#breach-run")!.addEventListener("click", () => loadScene(createBreachRun()));
  document.querySelector("#fire-breach")!.addEventListener("click", () => applyNamed(fireBreachCharge));
  document.querySelector("#arena")!.addEventListener("click", (event) => {
    if (game.scene !== "mossyard-courier") return;
    const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect();
    const pointer = event as MouseEvent;
    pointerTarget = { x: (pointer.clientX - rect.left) * 480 / rect.width, y: (pointer.clientY - rect.top) * 300 / rect.height };
    inputStatus = "Pointer course set — the courier is following it."; updateEvidence();
  });
  document.querySelector("#reset")!.addEventListener("click", () => loadScene(game.scene === "mossyard-courier" ? createMossyardCourier() : game.scene === "breach-run" ? createBreachRun() : game.scene === "weak-wall-breach" ? createWeakWallBreach() : game.scene === "rope-swing" ? createRopeSwing() : game.scene === "sheet-lift" ? createSheetLift() : game.scene === "block-ram" ? createBlockRam() : createMultiBodyLab(), game.scene === "mossyard-courier", game.scene === "mossyard-courier" ? "Courier reset — choose a fresh course." : ""));
}

function loadScene(nextGame: any, shouldPlay = false, message = "") { playing = shouldPlay; pointerTarget = undefined; inputStatus = message || "Simulation paused. Press Play to advance."; if (frame) cancelAnimationFrame(frame); game = nextGame; render(); if (playing) frame = requestAnimationFrame(animate); }
function applyNamed(action: (value: any) => any) { const advanced = action(game); if (!advanced.result) return; game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); render(); }
function advance(commands: any[] = []) { const advanced = advanceGame(game, commands); game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); }
function tick(commands: any[] = []) { advance(commands); render(); }

function courierDirection() {
  let x = (pressedKeys.has("ArrowRight") || pressedKeys.has("d") ? 1 : 0) - (pressedKeys.has("ArrowLeft") || pressedKeys.has("a") ? 1 : 0);
  let y = (pressedKeys.has("ArrowDown") || pressedKeys.has("s") ? 1 : 0) - (pressedKeys.has("ArrowUp") || pressedKeys.has("w") ? 1 : 0);
  if (x || y) { pointerTarget = undefined; inputStatus = "Keyboard steering active."; return vec2(x, y); }
  if (!pointerTarget) return undefined;
  const leader = particle("courier:p:0:0"); x = Math.sign(pointerTarget.x - leader.position.x); y = Math.sign(pointerTarget.y - leader.position.y);
  return x || y ? vec2(x, y) : undefined;
}

function updateEvidence() {
  for (const definition of game.definition.particles) { const state = particle(definition.id); const circle = document.querySelector(`[data-particle="${definition.id}"]`); circle?.setAttribute("cx", state.position.x); circle?.setAttribute("cy", state.position.y); }
  for (const body of game.bodies) for (const face of body.faces) document.querySelector(`[data-face="${face.id}"]`)?.setAttribute("points", face.particleIds.map((id: string) => `${particle(id).position.x},${particle(id).position.y}`).join(" "));
  for (const spring of game.definition.springs) { const element = document.querySelector(`[data-spring="${spring.id}"]`); const a = particle(spring.a); const b = particle(spring.b); element?.setAttribute("x1", a.position.x); element?.setAttribute("y1", a.position.y); element?.setAttribute("x2", b.position.x); element?.setAttribute("y2", b.position.y); element?.classList.toggle("broken", game.state.brokenSpringIds.includes(spring.id)); }
  const contactEvidence = evidence(); const set = (id: string, value: string) => { const element = document.querySelector(`[data-testid=${id}]`); if (element) element.textContent = value; };
  set("step-value", String(game.state.stepIndex)); set("contact-count", String(contactEvidence.contacts.length)); set("latest-contact", contactEvidence.latest ? contactEvidence.latest.kind : "none"); set("component-count", String(game.state.components.length)); set("broken-spring-count", String(game.state.brokenSpringIds.length)); set("break-count", String(contactEvidence.events.length)); set("diagnostic-count", String(contactEvidence.diagnostics.length)); set("recipe-size", String(shareSceneRecipe(game).length)); set("goal-status", goalStatus()); set("input-status", inputStatus);
}

function animate() { if (!playing) return; if (game.scene === "mossyard-courier") { const direction = courierDirection(); if (direction) { const advanced = driveMossCourier(game, direction); game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); } else advance(); } else advance(); updateEvidence(); frame = requestAnimationFrame(animate); }
window.addEventListener("keydown", (event) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) { event.preventDefault(); pressedKeys.add(event.key); } });
window.addEventListener("keyup", (event) => pressedKeys.delete(event.key));
window.addEventListener("blur", () => pressedKeys.clear());
render();
if (playing) frame = requestAnimationFrame(animate);
