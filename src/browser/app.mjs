import { advanceGame, createSpringToy } from "../game/index.mjs";
import { vec2 } from "../math/index.mjs";

let game = createSpringToy();
let playing = false;
let frame;

function body(gameState) { return gameState.state.particles.find((particle) => particle.id === "bob"); }
function anchor(gameState) { return gameState.state.particles.find((particle) => particle.id === "anchor"); }
function currentForce() { return game.lastResult?.forces.find((entry) => entry.springId === "main"); }

function updateEvidence() {
  const bob = body(game);
  const mount = anchor(game);
  const force = currentForce();
  document.querySelector("#spring-line").setAttribute("x1", mount.position.x);
  document.querySelector("#spring-line").setAttribute("y1", mount.position.y);
  document.querySelector("#spring-line").setAttribute("x2", bob.position.x);
  document.querySelector("#spring-line").setAttribute("y2", bob.position.y);
  document.querySelector("#bob").setAttribute("cx", bob.position.x);
  document.querySelector("#bob").setAttribute("cy", bob.position.y);
  document.querySelector("[data-testid=step-value]").textContent = game.state.stepIndex;
  document.querySelector("[data-testid=bob-position]").textContent = `${bob.position.x.toFixed(2)}, ${bob.position.y.toFixed(2)}`;
  document.querySelector("[data-testid=spring-extension]").textContent = force?.kind === "force" ? force.extension.toFixed(3) : "initial";
  document.querySelector("[data-testid=force-on-anchor]").textContent = force?.kind === "force" ? `${force.forceOnA.x.toFixed(2)}, ${force.forceOnA.y.toFixed(2)}` : "initial";
}

function render() {
  const bob = body(game);
  const mount = anchor(game);
  const force = currentForce();
  document.querySelector("#app").innerHTML = `<main><header><p>Spring Body Lab · engine slice 1</p><h1>A game built from evidence.</h1><span>Browser → game → physics → math</span></header><section><svg viewBox="0 0 480 300" role="img" aria-label="Two particle spring scene"><line id="spring-line" x1="${mount.position.x}" y1="${mount.position.y}" x2="${bob.position.x}" y2="${bob.position.y}" class="spring"/><circle cx="${mount.position.x}" cy="${mount.position.y}" r="12" class="anchor"/><circle id="bob" cx="${bob.position.x}" cy="${bob.position.y}" r="24" class="bob"/></svg><div class="controls"><button id="step">Step</button><button id="play">${playing ? "Pause" : "Play"}</button><button id="kick">Kick</button><button id="reset">Reset</button></div><dl><div><dt>step</dt><dd data-testid="step-value">${game.state.stepIndex}</dd></div><div><dt>bob position</dt><dd data-testid="bob-position">${bob.position.x.toFixed(2)}, ${bob.position.y.toFixed(2)}</dd></div><div><dt>spring extension</dt><dd data-testid="spring-extension">${force?.kind === "force" ? force.extension.toFixed(3) : "initial"}</dd></div><div><dt>force on anchor</dt><dd data-testid="force-on-anchor">${force?.kind === "force" ? `${force.forceOnA.x.toFixed(2)}, ${force.forceOnA.y.toFixed(2)}` : "initial"}</dd></div></dl><p class="note">The controls issue game commands. The displayed force is the physics step record; the browser does not calculate it.</p></section></main>`;
  document.querySelector("#step").addEventListener("click", () => tick());
  document.querySelector("#play").addEventListener("click", () => { playing = !playing; if (playing) frame = requestAnimationFrame(animate); render(); });
  document.querySelector("#kick").addEventListener("click", () => tick([{ kind: "applyImpulse", particleId: "bob", impulse: vec2(0, -80) }]));
  document.querySelector("#reset").addEventListener("click", () => { game = createSpringToy(); render(); });
}
function advance(commands = []) { const advanced = advanceGame(game, commands); game = Object.freeze({ ...advanced.game, lastResult: advanced.result }); }
function tick(commands = []) { advance(commands); render(); }
function animate() { if (!playing) return; advance(); updateEvidence(); frame = requestAnimationFrame(animate); }
render();
