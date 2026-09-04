import assert from "node:assert/strict";
import test from "node:test";
import { vec2 } from "../../src/math/index.js";
import { advanceGame, createBlockRam, createBreachRun, createMultiBodyLab, createRopeSwing, createSheetLift, createSpringToy, createWeakWallBreach, fireBreachCharge, launchRam, liftSheet, ramWeakWall, shareSceneRecipe, swingRope } from "../../src/game/index.js";
import { replayTrace } from "../../src/physics/index.js";

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

test("the rope scene uses a public impulse to reach its deterministic swing goal", () => {
  const rope = createRopeSwing();
  assert.equal(rope.scene, "rope-swing");
  assert.equal(rope.definition.particles[0].inverseMass, 0);
  assert.equal(rope.goal.achieved, false);
  const swung = swingRope(rope);
  assert.equal(swung.game.goal.achieved, true);
  assert.equal(swung.game.state.particles.find((particle) => particle.id === "rope:p:4").position.x, 175);
  assert.deepEqual(swingRope(createRopeSwing()), swung);
  assert.equal(swingRope(createWeakWallBreach()).result, undefined);
});

test("unknown game goals remain unachieved rather than changing the physics step", () => {
  const rope = createRopeSwing();
  const unknownGoal = Object.freeze({ ...rope, goal: Object.freeze({ kind: "unknown", achieved: true }) });
  assert.equal(advanceGame(unknownGoal).game.goal.achieved, false);
});

test("the sheet scene lifts its lower edge to a deterministic state-derived goal", () => {
  const sheet = createSheetLift();
  const lifted = liftSheet(sheet);
  assert.equal(lifted.game.goal.achieved, true);
  assert.deepEqual(lifted.game.state.particles.filter((particle) => particle.id.startsWith("sheet:p:1:")).map((particle) => particle.position.y), [143, 143]);
  assert.deepEqual(liftSheet(createSheetLift()), lifted);
  assert.equal(liftSheet(createRopeSwing()).result, undefined);
});

test("the block-ram scene derives success from a returned particle contact", () => {
  const block = createBlockRam();
  const rammed = launchRam(block);
  assert.equal(rammed.game.goal.achieved, true);
  assert.equal(rammed.result.contacts.some((contact) => contact.kind === "particle_particle" && contact.particleIds.includes("ram")), true);
  assert.deepEqual(launchRam(createBlockRam()), rammed);
  assert.equal(launchRam(createSheetLift()).result, undefined);
});

test("scene recipes are stable portable definition records", () => {
  const scene = createRopeSwing();
  const recipe = shareSceneRecipe(scene);
  assert.equal(recipe, shareSceneRecipe(createRopeSwing()));
  assert.deepEqual(JSON.parse(recipe), { format: "spring-body-lab/scene@1", scene: "rope-swing", definition: scene.definition });
});

test("Breach Run combines a ram, weak wall, rope, and arena into one goal-driven mission", () => {
  const mission = createBreachRun();
  assert.equal(mission.definition.fixedSegments.length, 3);
  assert.equal(mission.bodies.length, 2);
  assert.equal(mission.goal.requiredSpringIds.length, 4);
  const result = fireBreachCharge(mission);
  assert.equal(result.game.goal.achieved, true);
  assert.deepEqual(result.result.events.map((event) => event.springId), mission.goal.requiredSpringIds);
  assert.deepEqual(replayTrace(result.game.trace), result.game.trace);
  assert.deepEqual(fireBreachCharge(createBreachRun()), result);
});
