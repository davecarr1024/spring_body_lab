import assert from "node:assert/strict";
import test from "node:test";
import { vec2 } from "../../src/math/index.js";
import { advanceGame, createMultiBodyLab, createSpringToy, createWeakWallBreach, ramWeakWall } from "../../src/game/index.js";

test("the game slice consumes a valid physics world and records its command", () => {
  const game = createSpringToy();
  assert.equal(game.definition.particles.length, 2);
  const advanced = advanceGame(game, [{ kind: "applyImpulse", particleId: "bob", impulse: vec2(0, -5) }]);
  assert.equal(advanced.game.state.stepIndex, 1);
  assert.equal(advanced.game.trace.entries.length, 1);
  assert.equal(Object.isFrozen(advanced.game.trace.entries[0].commands[0]), true);
  assert.equal(advanced.result.forces[0].kind, "force");
});

test("identical game commands produce an identical deterministic step", () => {
  const command = { kind: "applyImpulse", particleId: "bob", impulse: vec2(2, -5) };
  const first = advanceGame(createSpringToy(), [command]);
  const second = advanceGame(createSpringToy(), [command]);
  assert.deepEqual(first.result, second.result);
  assert.deepEqual(first.game.trace, second.game.trace);
});

test("the multi-body lab combines deterministic grid recipes with fixed geometry", () => {
  const game = createMultiBodyLab();
  assert.equal(game.bodies.length, 2);
  assert.equal(game.definition.particles.length, 8);
  assert.equal(game.definition.fixedSegments.length, 3);
  assert.equal(game.definition.springs.length, 12);
  const command = { kind: "applyImpulse", particleId: "amber:p:0:0", impulse: vec2(25, -10) };
  assert.deepEqual(advanceGame(game, [command]), advanceGame(createMultiBodyLab(), [command]));
});

test("the weak-wall scene records a reproducible ram breach from public physics evidence", () => {
  const wall = createWeakWallBreach();
  assert.equal(wall.scene, "weak-wall-breach");
  assert.equal(wall.goal.requiredSpringIds.length, 4);
  assert.equal(wall.goal.achieved, false);
  const breached = ramWeakWall(wall);
  assert.equal(breached.game.goal.achieved, true);
  assert.deepEqual(breached.result.events.map((event) => event.springId), wall.goal.requiredSpringIds);
  assert.deepEqual(breached.game.state.brokenSpringIds, wall.goal.requiredSpringIds);
  assert.equal(breached.game.state.components.length, 2);
  assert.deepEqual(ramWeakWall(createWeakWallBreach()), breached);
  assert.equal(ramWeakWall(createMultiBodyLab()).result, undefined);
});
