import { vec2, zero } from "../math/index.mjs";
import { appendTraceStep, createTrace, createWorldDefinition } from "../physics/index.mjs";

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

export function advanceGame(game, commands = []) {
  const advancedTrace = appendTraceStep(game.trace, commands);
  return Object.freeze({ game: Object.freeze({ definition: game.definition, state: advancedTrace.trace.state, trace: advancedTrace.trace }), result: advancedTrace.result });
}
