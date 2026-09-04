import { diagnostic, isFiniteNumber } from "../math/scalar.js";
import { pointSegmentDistance, segment } from "../math/geometry.js";
import { add, dot, isFiniteVec2, length, normalize, perpendicular, scale, subtract, vec2, zero } from "../math/vec2.js";
import type { Component, PhysicsCommand, StepResult, WorldDefinition, WorldDefinitionResult, WorldState } from "./types.js";

const freezeList = (values) => Object.freeze([...values]);
const negate = (value) => scale(value, -1);
const defaultContact = Object.freeze({ tolerance: 1e-6, maxCorrection: 20, restitution: 0.2, friction: .7, iterations: 2, cellSize: 32 });

function validContactSettings(contact) {
  return contact && isFiniteNumber(contact.tolerance) && contact.tolerance >= 0
    && isFiniteNumber(contact.maxCorrection) && contact.maxCorrection > 0
    && isFiniteNumber(contact.restitution) && contact.restitution >= 0 && contact.restitution <= 1
    && isFiniteNumber(contact.friction) && contact.friction >= 0 && contact.friction <= 1
    && Number.isInteger(contact.iterations) && contact.iterations > 0
    && isFiniteNumber(contact.cellSize) && contact.cellSize > 0;
}

export function createWorldDefinition({ particles = [], springs = [], constraints = [], fixedSegments = [], gravity = zero, dt = 1 / 60, contact = defaultContact }: any = {}): WorldDefinitionResult {
  const resolvedContact = { ...defaultContact, ...contact };
  const diagnostics = [];
  const ids = new Set();
  if (!Array.isArray(particles) || particles.length === 0) diagnostics.push(diagnostic("missing_particles", "particles", "A world needs at least one particle."));
  if (!isFiniteVec2(gravity) || !isFiniteNumber(dt) || dt <= 0) diagnostics.push(diagnostic("invalid_settings", "settings", "Gravity and a positive finite timestep are required."));
  if (!validContactSettings(resolvedContact)) diagnostics.push(diagnostic("invalid_contact_settings", "contact", "Contact tolerance, correction bound, restitution, friction, iterations, and cell size must be valid."));
  for (const particle of particles) {
    if (typeof particle.id !== "string" || ids.has(particle.id)) diagnostics.push(diagnostic("duplicate_or_invalid_particle", particle.id ?? "particle", "Particle IDs must be unique strings."));
    else ids.add(particle.id);
    if (!isFiniteVec2(particle.position) || !isFiniteVec2(particle.velocity) || !isFiniteNumber(particle.inverseMass) || particle.inverseMass < 0 || !isFiniteNumber(particle.radius ?? 0) || (particle.radius ?? 0) < 0) diagnostics.push(diagnostic("invalid_particle", particle.id ?? "particle", "Particle values, radius, and inverse mass must be finite and non-negative."));
  }
  const springIds = new Set();
  for (const spring of springs) {
    if (typeof spring.id !== "string" || springIds.has(spring.id)) diagnostics.push(diagnostic("duplicate_or_invalid_spring", spring.id ?? "spring", "Spring IDs must be unique strings."));
    else springIds.add(spring.id);
    if (!ids.has(spring.a) || !ids.has(spring.b) || spring.a === spring.b || !isFiniteNumber(spring.restLength) || spring.restLength < 0 || !isFiniteNumber(spring.stiffness) || spring.stiffness < 0 || !isFiniteNumber(spring.damping) || spring.damping < 0 || (spring.breakStrain !== undefined && (!isFiniteNumber(spring.breakStrain) || spring.breakStrain < 0))) diagnostics.push(diagnostic("invalid_spring", spring.id ?? "spring", "Springs need distinct known endpoints, finite non-negative parameters, and an optional finite non-negative break strain."));
  }
  const constraintIds = new Set();
  for (const constraint of constraints) {
    if (typeof constraint.id !== "string" || constraintIds.has(constraint.id)) diagnostics.push(diagnostic("duplicate_or_invalid_constraint", constraint.id ?? "constraint", "Constraint IDs must be unique strings."));
    else constraintIds.add(constraint.id);
    if (!ids.has(constraint.a) || !ids.has(constraint.b) || constraint.a === constraint.b || !isFiniteNumber(constraint.restLength) || constraint.restLength < 0 || !isFiniteNumber(constraint.stiffness) || constraint.stiffness < 0 || constraint.stiffness > 1) diagnostics.push(diagnostic("invalid_constraint", constraint.id ?? "constraint", "Constraints need distinct known endpoints, a finite non-negative rest length, and stiffness from zero through one."));
  }
  const segmentIds = new Set();
  for (const fixed of fixedSegments) {
    if (typeof fixed.id !== "string" || segmentIds.has(fixed.id)) diagnostics.push(diagnostic("duplicate_or_invalid_segment", fixed.id ?? "segment", "Fixed segment IDs must be unique strings."));
    else segmentIds.add(fixed.id);
    if (!segment(fixed.start, fixed.end).ok) diagnostics.push(diagnostic("invalid_fixed_segment", fixed.id ?? "segment", "Fixed segments need finite endpoints."));
  }
  if (diagnostics.length > 0) return Object.freeze({ ok: false, diagnostics: freezeList(diagnostics) });
  return Object.freeze({ ok: true, value: Object.freeze({ particles: freezeList(particles.map((particle) => Object.freeze({ ...particle, radius: particle.radius ?? 0 }))), springs: freezeList(springs.map((spring) => Object.freeze({ ...spring }))), constraints: freezeList(constraints.map((constraint) => Object.freeze({ ...constraint }))), fixedSegments: freezeList(fixedSegments.map((fixed) => Object.freeze({ ...fixed }))), gravity, dt, contact: Object.freeze(resolvedContact) }) }) as WorldDefinitionResult;
}

export function connectedComponents(definition: WorldDefinition, brokenSpringIds: readonly string[] = []): readonly Component[] {
  // Components use definition order and FIFO traversal, making reports/replays stable.
  const broken = new Set(brokenSpringIds);
  const intactSprings = definition.springs.filter((spring) => !broken.has(spring.id));
  const neighbors = new Map(definition.particles.map((particle) => [particle.id, [] as string[]]));
  for (const spring of intactSprings) {
    neighbors.get(spring.a)!.push(spring.b);
    neighbors.get(spring.b)!.push(spring.a);
  }
  const visited = new Set<string>();
  const components: Component[] = [];
  for (const particle of definition.particles) {
    if (visited.has(particle.id)) continue;
    const pending = [particle.id];
    const particleIds: string[] = [];
    visited.add(particle.id);
    while (pending.length > 0) {
      const id = pending.shift()!;
      particleIds.push(id);
      for (const neighbor of neighbors.get(id)!) if (!visited.has(neighbor)) {
        visited.add(neighbor);
        pending.push(neighbor);
      }
    }
    const memberIds = new Set(particleIds);
    components.push(Object.freeze({ particleIds: freezeList(particleIds), springIds: freezeList(intactSprings.filter((spring) => memberIds.has(spring.a) && memberIds.has(spring.b)).map((spring) => spring.id)) }));
  }
  return freezeList(components);
}

export function createInitialState(definition: WorldDefinition): WorldState {
  // Runtime state starts distinct from the immutable recipe and includes intact topology.
  return Object.freeze({ stepIndex: 0, particles: freezeList(definition.particles.map((particle) => Object.freeze({ id: particle.id, position: particle.position, velocity: particle.velocity }))), brokenSpringIds: freezeList([]), components: connectedComponents(definition) });
}

function commandVelocityDelta(command: any, particle: any) {
  if (command.particleId !== particle.id) return zero;
  return particle.inverseMass === 0 ? zero : scale(command.impulse, particle.inverseMass);
}

function normalFromSegment(particle: any, fixed: any, closest: any) {
  const unit = normalize(subtract(particle.position, closest.point));
  if (unit.kind === "unit") return unit.value;
  const edgeNormal = normalize(perpendicular(subtract(fixed.end, fixed.start)));
  // A point-like segment has no edge normal; choose one documented, deterministic fallback.
  if (edgeNormal.kind === "degenerate") return vec2(0, -1);
  return dot(particle.velocity, edgeNormal.value) > 0 ? negate(edgeNormal.value) : edgeNormal.value;
}

function repairVelocity(velocity: any, normal: any, restitution: number) {
  // Only remove/reflect inward normal velocity; tangential velocity is untouched.
  const normalSpeed = dot(velocity, normal);
  return normalSpeed < 0 ? add(velocity, scale(normal, -(1 + restitution) * normalSpeed)) : velocity;
}

function frictionVelocity(velocity: any, normal: any, friction: number) {
  const tangent = perpendicular(normal);
  // Tangential damping is an explicit contact response, not renderer drag.
  return add(velocity, scale(tangent, -dot(velocity, tangent) * friction));
}

function resolveFixedContact(particle: any, definitionParticle: any, fixed: any, settings: any) {
  if (definitionParticle.inverseMass === 0 || definitionParticle.radius === 0) return null;
  const closest = pointSegmentDistance(particle.position, fixed);
  const penetration = definitionParticle.radius - closest.distance;
  if (penetration < -settings.tolerance) return null;
  const normal = normalFromSegment(particle, fixed, closest);
  const correction = scale(normal, Math.min(settings.maxCorrection, Math.max(0, penetration)));
  const velocity = frictionVelocity(repairVelocity(particle.velocity, normal, settings.restitution), normal, settings.friction);
  return Object.freeze({ particle: Object.freeze({ ...particle, position: add(particle.position, correction), velocity }), contact: Object.freeze({ kind: "particle_segment", particleId: particle.id, segmentId: fixed.id, point: closest.point, normal, penetration, correction, velocityDelta: subtract(velocity, particle.velocity) }) });
}

function resolvePair(left: any, right: any, leftDefinition: any, rightDefinition: any, settings: any) {
  const totalRadius = leftDefinition.radius + rightDefinition.radius;
  if (totalRadius === 0) return null;
  const separation = subtract(right.position, left.position);
  const penetration = totalRadius - length(separation);
  if (penetration < -settings.tolerance) return null;
  const unit = normalize(separation);
  const normal = unit.kind === "unit" ? unit.value : vec2(1, 0);
  const inverseMass = leftDefinition.inverseMass + rightDefinition.inverseMass;
  if (inverseMass === 0) return null;
  const correctionAmount = Math.min(settings.maxCorrection, Math.max(0, penetration));
  // Split positional correction and impulse by inverse mass so pins stay fixed.
  const leftCorrection = scale(normal, -correctionAmount * leftDefinition.inverseMass / inverseMass);
  const rightCorrection = scale(normal, correctionAmount * rightDefinition.inverseMass / inverseMass);
  const relativeNormalSpeed = dot(subtract(right.velocity, left.velocity), normal);
  const impulse = relativeNormalSpeed < 0 ? -(1 + settings.restitution) * relativeNormalSpeed / inverseMass : 0;
  const leftNormalVelocity = add(left.velocity, scale(normal, -impulse * leftDefinition.inverseMass));
  const rightNormalVelocity = add(right.velocity, scale(normal, impulse * rightDefinition.inverseMass));
  const tangent = perpendicular(normal);
  const tangentImpulse = -dot(subtract(rightNormalVelocity, leftNormalVelocity), tangent) * settings.friction / inverseMass;
  const leftVelocity = add(leftNormalVelocity, scale(tangent, -tangentImpulse * leftDefinition.inverseMass));
  const rightVelocity = add(rightNormalVelocity, scale(tangent, tangentImpulse * rightDefinition.inverseMass));
  return Object.freeze({ left: Object.freeze({ ...left, position: add(left.position, leftCorrection), velocity: leftVelocity }), right: Object.freeze({ ...right, position: add(right.position, rightCorrection), velocity: rightVelocity }), contact: Object.freeze({ kind: "particle_particle", particleIds: freezeList([left.id, right.id]), normal, penetration, corrections: freezeList([leftCorrection, rightCorrection]), impulse, tangentImpulse }) });
}

function pairKey(left: string, right: string) { return left < right ? `${left}|${right}` : `${right}|${left}`; }

function broadPhasePairs(particles: any[], definition: any) {
  // Insert each radius-expanded particle into every occupied grid cell.
  const cells = new Map<string, number[]>();
  particles.forEach((particle, index) => {
    const radius = definition.particles.find((entry: any) => entry.id === particle.id).radius;
    const minX = Math.floor((particle.position.x - radius) / definition.contact.cellSize);
    const maxX = Math.floor((particle.position.x + radius) / definition.contact.cellSize);
    const minY = Math.floor((particle.position.y - radius) / definition.contact.cellSize);
    const maxY = Math.floor((particle.position.y + radius) / definition.contact.cellSize);
    for (let x = minX; x <= maxX; x += 1) for (let y = minY; y <= maxY; y += 1) {
      const key = `${x},${y}`;
      cells.set(key, [...(cells.get(key) ?? []), index]);
    }
  });
  // The map removes duplicate pairs shared by adjacent cells without changing order.
  const candidates = new Map<string, readonly number[]>();
  for (const indices of cells.values()) for (let left = 0; left < indices.length; left += 1) for (let right = left + 1; right < indices.length; right += 1) {
    const pair = [Math.min(indices[left], indices[right]), Math.max(indices[left], indices[right])] as const;
    candidates.set(`${pair[0]}|${pair[1]}`, pair);
  }
  return [...candidates.values()];
}

function solveContacts(particles: any[], definition: any, contacts: any[]) {
  const byId = new Map<string, any>(definition.particles.map((particle: any) => [particle.id, particle]));
  // Adjacent graph vertices are material neighbors, not self-collision candidates.
  const excludedPairs = new Set(definition.springs.map((spring: any) => pairKey(spring.a, spring.b)));
  let solved = particles;
  for (let iteration = 0; iteration < definition.contact.iterations; iteration += 1) {
    for (const fixed of definition.fixedSegments) solved = solved.map((particle) => {
      const resolved = resolveFixedContact(particle, byId.get(particle.id), fixed, definition.contact);
      if (resolved) contacts.push(resolved.contact);
      return resolved?.particle ?? particle;
    });
    for (const [leftIndex, rightIndex] of broadPhasePairs(solved, definition)) {
      if (excludedPairs.has(pairKey(solved[leftIndex].id, solved[rightIndex].id))) continue;
      const resolved = resolvePair(solved[leftIndex], solved[rightIndex], byId.get(solved[leftIndex].id), byId.get(solved[rightIndex].id), definition.contact);
      if (!resolved) continue;
      contacts.push(resolved.contact);
      solved = solved.map((particle, index) => index === leftIndex ? resolved.left : index === rightIndex ? resolved.right : particle);
    }
  }
  return solved;
}

function solveConstraints(particles: any[], definition: any, records: any[]) {
  let solved = particles;
  for (const constraint of definition.constraints) {
    const leftIndex = solved.findIndex((particle) => particle.id === constraint.a);
    const rightIndex = solved.findIndex((particle) => particle.id === constraint.b);
    const left = solved[leftIndex]; const right = solved[rightIndex];
    const unit = normalize(subtract(right.position, left.position));
    const leftMass = definition.particles[leftIndex].inverseMass; const rightMass = definition.particles[rightIndex].inverseMass;
    const inverseMass = leftMass + rightMass;
    if (unit.kind === "degenerate" || inverseMass === 0) { records.push(Object.freeze({ constraintId: constraint.id, extension: 0, corrections: freezeList([zero, zero]) })); continue; }
    const extension = length(subtract(right.position, left.position)) - constraint.restLength;
    const correction = extension * constraint.stiffness;
    const leftCorrection = scale(unit.value, correction * leftMass / inverseMass);
    const rightCorrection = negate(scale(unit.value, correction * rightMass / inverseMass));
    records.push(Object.freeze({ constraintId: constraint.id, extension, corrections: freezeList([leftCorrection, rightCorrection]) }));
    solved = solved.map((particle, index) => index === leftIndex ? Object.freeze({ ...particle, position: add(particle.position, leftCorrection) }) : index === rightIndex ? Object.freeze({ ...particle, position: add(particle.position, rightCorrection) }) : particle);
  }
  return solved;
}

export function step(definition: WorldDefinition, state: WorldState, commands: ReadonlyArray<PhysicsCommand> = []): StepResult {
  const byId = new Map<string, any>(definition.particles.map((particle: any) => [particle.id, particle]));
  const commandDiagnostics = [];
  const validCommands = commands.filter((command) => {
    const valid = command?.kind === "applyImpulse" && byId.has(command.particleId) && isFiniteVec2(command.impulse);
    if (!valid) commandDiagnostics.push(diagnostic("invalid_command", command?.particleId ?? "command", "Commands must be finite impulses for a known particle."));
    return valid;
  });
  // Begin with gravity, then add internal spring forces before semi-implicit Euler integration.
  const forces = new Map(state.particles.map((particle) => [particle.id, scale(definition.gravity, byId.get(particle.id).inverseMass === 0 ? 0 : 1 / byId.get(particle.id).inverseMass)]));
  const springForces = [];
  for (const spring of definition.springs) {
    if (state.brokenSpringIds.includes(spring.id)) continue;
    const a = state.particles.find((particle) => particle.id === spring.a);
    const b = state.particles.find((particle) => particle.id === spring.b);
    const direction = subtract(b.position, a.position);
    const unit = normalize(direction);
    if (unit.kind === "degenerate") {
      springForces.push(Object.freeze({ springId: spring.id, kind: "degenerate", strain: Object.freeze({ kind: "undefined_direction" }) }));
      continue;
    }
    const extension = length(direction) - spring.restLength;
    // Engineering strain needs a non-zero rest length; preserve that exceptional case visibly.
    const strain = spring.restLength === 0 ? Object.freeze({ kind: "undefined_rest_length" as const }) : Object.freeze({ kind: "finite" as const, value: extension / spring.restLength });
    const axialSpeed = dot(subtract(b.velocity, a.velocity), unit.value);
    const forceOnA = scale(unit.value, spring.stiffness * extension + spring.damping * axialSpeed);
    const forceOnB = negate(forceOnA);
    forces.set(a.id, add(forces.get(a.id) as any, forceOnA));
    forces.set(b.id, add(forces.get(b.id) as any, forceOnB));
    springForces.push(Object.freeze({ springId: spring.id, kind: "force", extension, strain, forceOnA, forceOnB }));
  }
  const particles = state.particles.map((stateParticle) => {
    const definitionParticle = byId.get(stateParticle.id);
    const impulse = validCommands.reduce((total, command) => add(total, commandVelocityDelta(command, definitionParticle)), zero);
    if (definitionParticle.inverseMass === 0) return Object.freeze({ ...stateParticle });
    // Semi-implicit Euler updates velocity first, then advances position using it.
    const velocity = add(add(stateParticle.velocity, scale(forces.get(stateParticle.id) as any, definitionParticle.inverseMass * definition.dt)), impulse);
    return Object.freeze({ id: stateParticle.id, velocity, position: add(stateParticle.position, scale(velocity, definition.dt)) });
  });
  const contacts = [];
  const constraintRecords = [];
  const solvedParticles = solveConstraints(solveContacts(particles, definition, contacts), definition, constraintRecords);
  const solvedById = new Map(solvedParticles.map((particle) => [particle.id, particle]));
  const breakEvents = definition.springs.flatMap((spring) => {
    if (state.brokenSpringIds.includes(spring.id) || spring.breakStrain === undefined || spring.restLength === 0) return [];
    const strain = (length(subtract(solvedById.get(spring.b)!.position, solvedById.get(spring.a)!.position)) - spring.restLength) / spring.restLength;
    // Damage observes the completed step, so an impulse can break a weak seam immediately.
    return strain >= spring.breakStrain ? [Object.freeze({ kind: "spring_break" as const, springId: spring.id, strain, breakStrain: spring.breakStrain })] : [];
  });
  // Future steps skip broken springs; recompute components from the surviving graph.
  const brokenSpringIds = freezeList([...state.brokenSpringIds, ...breakEvents.map((event) => event.springId)]);
  const components = connectedComponents(definition, brokenSpringIds);
  const nextState = Object.freeze({ stepIndex: state.stepIndex + 1, particles: freezeList(solvedParticles), brokenSpringIds, components });
  return Object.freeze({ state: nextState, forces: freezeList(springForces), contacts: freezeList(contacts), constraints: freezeList(constraintRecords), diagnostics: freezeList(commandDiagnostics), events: freezeList(breakEvents), components });
}
