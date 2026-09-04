import { createTrailDriver, driveTrailCar } from "../game/index.js";

let game: any = createTrailDriver();
const keys = new Set<string>();
const viewportWidth = 480;
const viewportHeight = 300;

const particle = (id: string) => game.state.particles.find((entry: any) => entry.id === id);
const pointsFor = (ids: readonly string[]) => ids.map((id) => `${particle(id).position.x},${particle(id).position.y}`).join(" ");
const centroid = (body: any) => body.particles.reduce((total: any, definition: any) => ({ x: total.x + particle(definition.id).position.x / body.particles.length, y: total.y + particle(definition.id).position.y / body.particles.length }), { x: 0, y: 0 });
const cameraX = () => Math.max(0, Math.min(120, particle("chassis:front").position.x - 190));

function terrainMarkup(camera: number) {
  const ridge = game.terrain.points.map((point: any) => `${point.x},${point.y}`).join(" ");
  const first = game.terrain.points[0]; const last = game.terrain.points.at(-1);
  return `<g transform="translate(${-camera} 0)"><polygon class="trail-ground" fill="url(#ground-skin)" points="${ridge} ${last.x},${viewportHeight} ${first.x},${viewportHeight}"/><polyline class="trail-ridge" points="${ridge}"/><g class="lantern-ridge"><line x1="390" y1="214" x2="390" y2="166"/><path d="M381 172h18l-4 18h-10z"/><text x="390" y="157">RIDGE</text></g></g>`;
}

function wheelMarkup(camera: number) {
  return game.bodies.map((body: any) => {
    const center = centroid(body);
    const face = body.faces[0];
    // The per-body translation is recomputed from physics state, so this
    // texture follows the soft polygon instead of sitting in screen space.
    const pattern = `<pattern id="wheel-skin-${body.id}" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="translate(${center.x - camera} ${center.y}) rotate(12)"><image href="./src/browser/assets/stylized-rock.png" width="18" height="18" preserveAspectRatio="xMidYMid slice"/></pattern>`;
    return Object.freeze({ definition: pattern, markup: `<polygon class="trail-wheel" data-wheel="${body.id}" fill="url(#wheel-skin-${body.id})" points="${pointsFor(face.particleIds)}"/>` });
  });
}

function render() {
  const camera = cameraX();
  const wheels = wheelMarkup(camera);
  const rear = particle("chassis:rear"); const front = particle("chassis:front"); const roof = particle("chassis:roof");
  const speed = Math.round((rear.velocity.x + front.velocity.x) / 2);
  document.querySelector("#app")!.innerHTML = `<style>.trail-page{max-width:760px}.trail-driver{background:#19222a}.trail-driver svg{cursor:default;aspect-ratio:8/5}.trail-sky{fill:url(#trail-sky)}.trail-clouds path{fill:none;stroke:#fff7df;stroke-opacity:.45;stroke-width:14;stroke-linecap:round}.trail-hills path{fill:#456d65;stroke:#31574f;stroke-width:3}.trail-ground{stroke:none}.trail-ridge{fill:none;stroke:#d9d2a5;stroke-width:4;stroke-linejoin:round}.lantern-ridge line{stroke:#493d2a;stroke-width:3}.lantern-ridge path{fill:#ffd776;stroke:#6b5124;stroke-width:2}.lantern-ridge text{fill:#44371f;font:700 8px system-ui;letter-spacing:.12em;text-anchor:middle}.trail-chassis{fill:#c74f3a;stroke:#511f26;stroke-width:3;stroke-linejoin:round}.trail-axle{stroke:#332b29;stroke-width:4;stroke-linecap:round}.trail-wheel{stroke:#24201d;stroke-width:3;stroke-linejoin:round}.trail-hud{display:flex;justify-content:space-between;gap:1rem;padding:.65rem .85rem;background:#0d131d;color:#cddccf;font:700 .78rem ui-monospace,monospace;letter-spacing:.05em}.trail-hud b{color:#f1d07c}@media(max-width:600px){.trail-hud{font-size:.65rem}}</style><main class="trail-page"><header><p>SPRING BODY LAB · PLAYABLE DEMO</p><h1>Trail Driver</h1><span>Lantern Ridge · a soft-wheel road test</span></header><section class="game-shell trail-driver"><div class="mission"><strong>CHECKPOINT 01</strong><span data-testid="trail-goal">${game.goal.achieved ? "Ridge reached!" : "Drive to the lantern ridge"}</span><span class="feedback">Arrow keys drive · release to coast</span></div><svg viewBox="0 0 ${viewportWidth} ${viewportHeight}" role="img" aria-label="Trail Driver heightfield"><defs><linearGradient id="trail-sky" x2="0" y2="1"><stop stop-color="#78b7d1"/><stop offset="1" stop-color="#e7c78c"/></linearGradient><pattern id="ground-skin" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="translate(${-camera} 0)"><image href="./src/browser/assets/stone-wall.jpg" width="28" height="28" preserveAspectRatio="xMidYMid slice"/></pattern>${wheels.map((wheel: any) => wheel.definition).join("")}</defs><rect class="trail-sky" width="${viewportWidth}" height="${viewportHeight}"/><g class="trail-clouds" transform="translate(${-camera * .18} 0)"><path d="M-70 86Q-35 42 0 86T70 86T140 86T210 86T280 86T350 86T420 86T490 86T560 86"/></g><g class="trail-hills" transform="translate(${-camera * .42} 0)"><path d="M-90 230L0 174 76 218 170 150 258 220 350 166 448 222 540 154 650 226V300H-90Z"/></g>${terrainMarkup(camera)}<g class="trail-world" transform="translate(${-camera} 0)"><polygon class="trail-chassis" points="${rear.position.x},${rear.position.y} ${front.position.x},${front.position.y} ${roof.position.x},${roof.position.y}"/><line class="trail-axle" x1="${rear.position.x}" y1="${rear.position.y}" x2="${particle("rear-wheel:p:0:0").position.x}" y2="${particle("rear-wheel:p:0:0").position.y}"/><line class="trail-axle" x1="${front.position.x}" y1="${front.position.y}" x2="${particle("front-wheel:p:0:0").position.x}" y2="${particle("front-wheel:p:0:0").position.y}"/>${wheels.map((wheel: any) => wheel.markup).join("")}</g></svg><div class="trail-hud"><span>Speed <b data-testid="trail-speed">${speed}</b></span><span data-testid="trail-camera">Camera ${Math.round(camera)}</span><span>Soft-wheel grip</span></div><p class="control-hint">Arrow keys drive · the chassis is firm; each textured wheel is a deformable collision shape.</p></section></main>`;
}

function tick() {
  const direction = keys.has("ArrowLeft") ? -1 : keys.has("ArrowRight") ? 1 : 0;
  game = driveTrailCar(game, direction).game;
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); keys.add(event.key); } });
window.addEventListener("keyup", (event) => keys.delete(event.key));
window.addEventListener("blur", () => keys.clear());
render();
requestAnimationFrame(tick);
