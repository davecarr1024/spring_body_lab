import { vec2, zero } from "../math/index.js";
import { appendTraceStep, createGridBody, createRopeBody, createTrace, createWorldDefinition } from "../physics/index.js";

export function createSpringToy() {
  const definition = createWorldDefinition({
    gravity: vec2(0, 9.8),
    dt: 1 / 60,
    particles: [
      { id: "anchor", position: vec2(180, 90), velocity: zero, inverseMass: 0 },
      { id: "bob", position: vec2(300, 190), velocity: zero, inverseMass: 1 },
    ],
    springs: [{ id: "main", a: "anchor", b: "bob", restLength: 120, stiffness: 24, damping: 2 }],
  });
  if (!definition.ok) throw new Error("The built-in spring toy must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({ definition: definition.value, state: trace.state, trace });
}

export function createMultiBodyLab() {
  // Amber has intentionally weak seams so the lab can expose real break evidence.
  const left = createGridBody({ id: "amber", rows: 2, columns: 2, origin: vec2(105, 80), spacing: 26, radius: 9, stiffness: 70, damping: 5, breakStrain: .04, velocity: vec2(18, 0) });
  const right = createGridBody({ id: "blue", rows: 2, columns: 2, origin: vec2(290, 140), spacing: 26, radius: 9, stiffness: 70, damping: 5, velocity: vec2(-12, 0) });
  if (!left.ok || !right.ok) throw new Error("Built-in body recipes must be valid.");
  const definition = createWorldDefinition({
    gravity: vec2(0, 140), dt: 1 / 60,
    contact: { tolerance: 1e-6, maxCorrection: 12, restitution: .15, iterations: 3 },
    particles: [...left.value.particles, ...right.value.particles],
    springs: [...left.value.springs, ...right.value.springs],
    fixedSegments: [
      { id: "floor", start: vec2(30, 270), end: vec2(450, 270) },
      { id: "left-wall", start: vec2(30, 30), end: vec2(30, 270) },
      { id: "right-wall", start: vec2(450, 30), end: vec2(450, 270) },
    ],
  });
  if (!definition.ok) throw new Error("The built-in multi-body lab must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({ scene: "multi-body-lab", definition: definition.value, state: trace.state, trace, bodies: Object.freeze([left.value, right.value]) });
}

export function advanceGame(game: any, commands: any[] = []) {
  const advancedTrace = appendTraceStep(game.trace, commands);
  const goal = game.goal && Object.freeze({ ...game.goal, achieved: goalAchieved(game.goal, advancedTrace.trace.state, advancedTrace.result) });
  return Object.freeze({ game: Object.freeze({ ...game, state: advancedTrace.trace.state, trace: advancedTrace.trace, ...(goal ? { goal } : {}) }), result: advancedTrace.result });
}

/** Produces a stable, portable scene recipe without serializing mutable runtime state. */
export function shareSceneRecipe(game: any): string {
  return JSON.stringify(Object.freeze({ format: "spring-body-lab/scene@1", scene: game.scene, definition: game.definition }));
}

function goalAchieved(goal: any, state: any, result: any) {
  if (goal.kind === "breach") return goal.requiredSpringIds.every((springId: string) => state.brokenSpringIds.includes(springId));
  if (goal.kind === "reach_x") return state.particles.find((particle: any) => particle.id === goal.particleId)?.position.x >= goal.minimumX;
  if (goal.kind === "reach_y") return state.particles.every((particle: any) => !goal.particleIds.includes(particle.id) || particle.position.y <= goal.maximumY);
  if (goal.kind === "ram_contact") return result.contacts.some((contact: any) => contact.kind === "particle_particle" && contact.particleIds.includes(goal.ramId));
  return false;
}

/** Builds a reproducible player-sized fracture puzzle from a generated wall. */
export function createWeakWallBreach() {
  const recipe = createGridBody({ id: "wall", rows: 2, columns: 3, origin: vec2(230, 120), spacing: 30, radius: 8, stiffness: 85, damping: 5 });
  if (!recipe.ok) throw new Error("The built-in weak wall recipe must be valid.");
  const particles = recipe.value.particles.map((particle) => Object.freeze({ ...particle, inverseMass: particle.id.endsWith(":0") ? 0 : 1 }));
  const requiredSpringIds = recipe.value.springs
    .filter((spring) => /:p:[01]:1$/.test(spring.a) && /:p:[01]:2$/.test(spring.b) || /:p:[01]:2$/.test(spring.a) && /:p:[01]:1$/.test(spring.b))
    .map((spring) => spring.id);
  const springs = recipe.value.springs.map((spring) => Object.freeze({ ...spring, ...(requiredSpringIds.includes(spring.id) ? { breakStrain: .05 } : {}) }));
  const definition = createWorldDefinition({ gravity: zero, dt: 1 / 60, particles, springs });
  if (!definition.ok) throw new Error("The built-in weak wall world must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({
    scene: "weak-wall-breach",
    definition: definition.value,
    state: trace.state,
    trace,
    bodies: Object.freeze([recipe.value]),
    goal: Object.freeze({ kind: "breach", requiredSpringIds: Object.freeze(requiredSpringIds), achieved: false }),
  });
}

/** The game action maps a named ram hit to two public physics impulses. */
export function ramWeakWall(game: any) {
  if (game.scene !== "weak-wall-breach") return Object.freeze({ game, result: undefined });
  return advanceGame(game, [
    { kind: "applyImpulse", particleId: "wall:p:0:2", impulse: vec2(300, 0) },
    { kind: "applyImpulse", particleId: "wall:p:1:2", impulse: vec2(300, 0) },
  ]);
}

/** Builds a pinned rope and a state-derived swing target for a small game goal. */
export function createRopeSwing() {
  const recipe = createRopeBody({ id: "rope", segments: 4, origin: vec2(170, 70), spacing: 24, radius: 7, stiffness: 70, damping: 4 });
  if (!recipe.ok) throw new Error("The built-in rope recipe must be valid.");
  const particles = recipe.value.particles.map((particle, index) => Object.freeze({ ...particle, inverseMass: index === 0 ? 0 : 1 }));
  const definition = createWorldDefinition({ gravity: zero, dt: 1 / 60, particles, springs: recipe.value.springs });
  if (!definition.ok) throw new Error("The built-in rope world must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({
    scene: "rope-swing",
    definition: definition.value,
    state: trace.state,
    trace,
    bodies: Object.freeze([recipe.value]),
    goal: Object.freeze({ kind: "reach_x", particleId: "rope:p:4", minimumX: 175, achieved: false }),
  });
}

/** The named swing action stays a game adapter over the public impulse command. */
export function swingRope(game: any) {
  if (game.scene !== "rope-swing") return Object.freeze({ game, result: undefined });
  return advanceGame(game, [{ kind: "applyImpulse", particleId: "rope:p:4", impulse: vec2(300, 0) }]);
}

/** Builds a pinned sheet whose lower edge can be lifted through game commands. */
export function createSheetLift() {
  const recipe = createGridBody({ id: "sheet", rows: 2, columns: 2, origin: vec2(250, 120), spacing: 28, radius: 7, stiffness: 80, damping: 5 });
  if (!recipe.ok) throw new Error("The built-in sheet recipe must be valid.");
  const particles = recipe.value.particles.map((particle) => Object.freeze({ ...particle, inverseMass: particle.id.startsWith("sheet:p:0:") ? 0 : 1 }));
  const definition = createWorldDefinition({ gravity: zero, dt: 1 / 60, particles, springs: recipe.value.springs });
  if (!definition.ok) throw new Error("The built-in sheet world must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({ scene: "sheet-lift", definition: definition.value, state: trace.state, trace, bodies: Object.freeze([recipe.value]), goal: Object.freeze({ kind: "reach_y", particleIds: Object.freeze(["sheet:p:1:0", "sheet:p:1:1"]), maximumY: 143, achieved: false }) });
}

export function liftSheet(game: any) {
  if (game.scene !== "sheet-lift") return Object.freeze({ game, result: undefined });
  return advanceGame(game, [{ kind: "applyImpulse", particleId: "sheet:p:1:0", impulse: vec2(0, -300) }, { kind: "applyImpulse", particleId: "sheet:p:1:1", impulse: vec2(0, -300) }]);
}

/** Builds a deformable block and a separate ram particle for contact inspection. */
export function createBlockRam() {
  const recipe = createGridBody({ id: "block", rows: 2, columns: 2, origin: vec2(270, 140), spacing: 28, radius: 10, stiffness: 90, damping: 5 });
  if (!recipe.ok) throw new Error("The built-in block recipe must be valid.");
  const definition = createWorldDefinition({ gravity: zero, dt: 1 / 60, contact: { tolerance: 1e-6, maxCorrection: 20, restitution: 0, iterations: 2 }, particles: [...recipe.value.particles, { id: "ram", position: vec2(235, 154), velocity: zero, inverseMass: 1, radius: 12 }], springs: recipe.value.springs });
  if (!definition.ok) throw new Error("The built-in block ram world must be valid.");
  const trace = createTrace(definition.value);
  return Object.freeze({ scene: "block-ram", definition: definition.value, state: trace.state, trace, bodies: Object.freeze([recipe.value]), goal: Object.freeze({ kind: "ram_contact", ramId: "ram", achieved: false }) });
}

/** Launches the distinct ram particle; success comes from a returned narrow-phase contact. */
export function launchRam(game: any) {
  if (game.scene !== "block-ram") return Object.freeze({ game, result: undefined });
  return advanceGame(game, [{ kind: "applyImpulse", particleId: "ram", impulse: vec2(1800, 0) }]);
}
