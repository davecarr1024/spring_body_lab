import { vec2, zero } from "../math/index.mjs";
import { createInitialState, createWorldDefinition, step } from "../physics/index.mjs";

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
  return Object.freeze({ definition: definition.value, state: createInitialState(definition.value), commands: Object.freeze([]) });
}

export function advanceGame(game, commands = []) {
  const result = step(game.definition, game.state, commands);
  const recordedCommands = commands.map((command) => Object.freeze({ ...command }));
  return Object.freeze({ game: Object.freeze({ definition: game.definition, state: result.state, commands: Object.freeze([...game.commands, ...recordedCommands]) }), result });
}
