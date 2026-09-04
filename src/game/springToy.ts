import { vec2, zero } from "../math/index.js";
import { appendTraceStep, createGridBody, createTrace, createWorldDefinition } from "../physics/index.js";

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
  const left = createGridBody({ id: "amber", rows: 2, columns: 2, origin: vec2(105, 80), spacing: 26, radius: 9, stiffness: 70, damping: 5, velocity: vec2(18, 0) });
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
  return Object.freeze({ definition: definition.value, state: trace.state, trace, bodies: Object.freeze([left.value, right.value]) });
}

export function advanceGame(game: any, commands: any[] = []) {
  const advancedTrace = appendTraceStep(game.trace, commands);
  return Object.freeze({ game: Object.freeze({ definition: game.definition, state: advancedTrace.trace.state, trace: advancedTrace.trace, bodies: game.bodies }), result: advancedTrace.result });
}
