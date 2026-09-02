import assert from "node:assert/strict";
import test from "node:test";
import { vec2 } from "../../src/math/index.mjs";
import { advanceGame, createSpringToy } from "../../src/game/index.mjs";

test("the game slice consumes a valid physics world and records its command", () => {
  const game = createSpringToy();
  assert.equal(game.definition.particles.length, 2);
  const advanced = advanceGame(game, [{ kind: "applyImpulse", particleId: "bob", impulse: vec2(0, -5) }]);
  assert.equal(advanced.game.state.stepIndex, 1);
  assert.equal(advanced.game.commands.length, 1);
  assert.equal(Object.isFrozen(advanced.game.commands[0]), true);
  assert.equal(advanced.result.forces[0].kind, "force");
});

test("identical game commands produce an identical deterministic step", () => {
  const command = { kind: "applyImpulse", particleId: "bob", impulse: vec2(2, -5) };
  const first = advanceGame(createSpringToy(), [command]);
  const second = advanceGame(createSpringToy(), [command]);
  assert.deepEqual(first.result, second.result);
  assert.deepEqual(first.game.commands, second.game.commands);
});
