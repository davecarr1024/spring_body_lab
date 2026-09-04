import { diagnostic, isFiniteNumber } from "../math/scalar.js";
import { pointSegmentDistance, segment } from "../math/geometry.js";
import { add, dot, isFiniteVec2, length, normalize, perpendicular, scale, subtract, vec2, zero } from "../math/vec2.js";

const freezeList = (values) => Object.freeze([...values]);
const negate = (value) => scale(value, -1);
const defaultContact = Object.freeze({ tolerance: 1e-6, maxCorrection: 20, restitution: 0.2, iterations: 2, cellSize: 32 });

function validContactSettings(contact) {
  return contact && isFiniteNumber(contact.tolerance) && contact.tolerance >= 0
    && isFiniteNumber(contact.maxCorrection) && contact.maxCorrection > 0
    && isFiniteNumber(contact.restitution) && contact.restitution >= 0 && contact.restitution <= 1
    && Number.isInteger(contact.iterations) && contact.iterations > 0
    && isFiniteNumber(contact.cellSize) && contact.cellSize > 0;
}

export function createWorldDefinition({ particles = [], springs = [], fixedSegments = [], gravity = zero, dt = 1 / 60, contact = defaultContact }: any = {}) {
  const resolvedContact = { ...defaultContact, ...contact };
  const diagnostics = [];
  const ids = new Set();
  if (!Array.isArray(particles) || particles.length === 0) diagnostics.push(diagnostic("missing_particles", "particles", "A world needs at least one particle."));
  if (!isFiniteVec2(gravity) || !isFiniteNumber(dt) || dt <= 0) diagnostics.push(diagnostic("invalid_settings", "settings", "Gravity and a positive finite timestep are required."));
  if (!validContactSettings(resolvedContact)) diagnostics.push(diagnostic("invalid_contact_settings", "contact", "Contact tolerance, correction bound, restitution, iterations, and cell size must be valid."));
  for (const particle of particles) {
    if (typeof particle.id !== "string" || ids.has(particle.id)) diagnostics.push(diagnostic("duplicate_or_invalid_particle", particle.id ?? "particle", "Particle IDs must be unique strings."));
    else ids.add(particle.id);
    if (!isFiniteVec2(particle.position) || !isFiniteVec2(particle.velocity) || !isFiniteNumber(particle.inverseMass) || particle.inverseMass < 0 || !isFiniteNumber(particle.radius ?? 0) || (particle.radius ?? 0) < 0) diagnostics.push(diagnostic("invalid_particle", particle.id ?? "particle", "Particle values, radius, and inverse mass must be finite and non-negative."));
  }
  const springIds = new Set();
  for (const spring of springs) {
    if (typeof spring.id !== "string" || springIds.has(spring.id)) diagnostics.push(diagnostic("duplicate_or_invalid_spring", spring.id ?? "spring", "Spring IDs must be unique strings."));
    else springIds.add(spring.id);
    if (!ids.has(spring.a) || !ids.has(spring.b) || spring.a === spring.b || !isFiniteNumber(spring.restLength) || spring.restLength < 0 || !isFiniteNumber(spring.stiffness) || spring.stiffness < 0 || !isFiniteNumber(spring.damping) || spring.damping < 0) diagnostics.push(diagnostic("invalid_spring", spring.id ?? "spring", "Springs need distinct known endpoints and finite non-negative parameters."));
  }
  const segmentIds = new Set();
  for (const fixed of fixedSegments) {
    if (typeof fixed.id !== "string" || segmentIds.has(fixed.id)) diagnostics.push(diagnostic("duplicate_or_invalid_segment", fixed.id ?? "segment", "Fixed segment IDs must be unique strings."));
    else segmentIds.add(fixed.id);
    if (!segment(fixed.start, fixed.end).ok) diagnostics.push(diagnostic("invalid_fixed_segment", fixed.id ?? "segment", "Fixed segments need finite endpoints."));
  }
  if (diagnostics.length > 0) return Object.freeze({ ok: false, diagnostics: freezeList(diagnostics) });
  return Object.freeze({ ok: true, value: Object.freeze({ particles: freezeList(particles.map((particle) => Object.freeze({ ...particle, radius: particle.radius ?? 0 }))), springs: freezeList(springs.map((spring) => Object.freeze({ ...spring }))), fixedSegments: freezeList(fixedSegments.map((fixed) => Object.freeze({ ...fixed }))), gravity, dt, contact: Object.freeze(resolvedContact) }) });
}

export function createInitialState(definition: any) {
  return Object.freeze({ stepIndex: 0, particles: freezeList(definition.particles.map((particle) => Object.freeze({ id: particle.id, position: particle.position, velocity: particle.velocity }))), brokenSpringIds: freezeList([]) });
}

function commandVelocityDelta(command: any, particle: any) {
  if (command.particleId !== particle.id) return zero;
  return particle.inverseMass === 0 ? zero : scale(command.impulse, particle.inverseMass);
}

function normalFromSegment(particle: any, fixed: any, closest: any) {
  const unit = normalize(subtract(particle.position, closest.point));
  if (unit.kind === "unit") return unit.value;
  const edgeNormal = normalize(perpendicular(subtract(fixed.end, fixed.start)));
  if (edgeNormal.kind === "degenerate") return vec2(0, -1);
  return dot(particle.velocity, edgeNormal.value) > 0 ? negate(edgeNormal.value) : edgeNormal.value;
}

function repairVelocity(velocity: any, normal: any, restitution: number) {
  const normalSpeed = dot(velocity, normal);
  return normalSpeed < 0 ? add(velocity, scale(normal, -(1 + restitution) * normalSpeed)) : velocity;
}

function resolveFixedContact(particle: any, definitionParticle: any, fixed: any, settings: any) {
  if (definitionParticle.inverseMass === 0 || definitionParticle.radius === 0) return null;
  const closest = pointSegmentDistance(particle.position, fixed);
  const penetration = definitionParticle.radius - closest.distance;
  if (penetration < -settings.tolerance) return null;
  const normal = normalFromSegment(particle, fixed, closest);
  const correction = scale(normal, Math.min(settings.maxCorrection, Math.max(0, penetration)));
  const velocity = repairVelocity(particle.velocity, normal, settings.restitution);
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
  const leftCorrection = scale(normal, -correctionAmount * leftDefinition.inverseMass / inverseMass);
  const rightCorrection = scale(normal, correctionAmount * rightDefinition.inverseMass / inverseMass);
  const relativeNormalSpeed = dot(subtract(right.velocity, left.velocity), normal);
  const impulse = relativeNormalSpeed < 0 ? -(1 + settings.restitution) * relativeNormalSpeed / inverseMass : 0;
  const leftVelocity = add(left.velocity, scale(normal, -impulse * leftDefinition.inverseMass));
  const rightVelocity = add(right.velocity, scale(normal, impulse * rightDefinition.inverseMass));
  return Object.freeze({ left: Object.freeze({ ...left, position: add(left.position, leftCorrection), velocity: leftVelocity }), right: Object.freeze({ ...right, position: add(right.position, rightCorrection), velocity: rightVelocity }), contact: Object.freeze({ kind: "particle_particle", particleIds: freezeList([left.id, right.id]), normal, penetration, corrections: freezeList([leftCorrection, rightCorrection]), impulse }) });
}

function pairKey(left: string, right: string) { return left < right ? `${left}|${right}` : `${right}|${left}`; }

function broadPhasePairs(particles: any[], definition: any) {
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
  const candidates = new Map<string, readonly number[]>();
  for (const indices of cells.values()) for (let left = 0; left < indices.length; left += 1) for (let right = left + 1; right < indices.length; right += 1) {
    const pair = [Math.min(indices[left], indices[right]), Math.max(indices[left], indices[right])] as const;
    candidates.set(`${pair[0]}|${pair[1]}`, pair);
  }
  return [...candidates.values()];
}

function solveContacts(particles: any[], definition: any, contacts: any[]) {
  const byId = new Map<string, any>(definition.particles.map((particle: any) => [particle.id, particle]));
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

export function step(definition: any, state: any, commands: ReadonlyArray<any> = []) {
  const byId = new Map<string, any>(definition.particles.map((particle: any) => [particle.id, particle]));
  const commandDiagnostics = [];
  const validCommands = commands.filter((command) => {
    const valid = command?.kind === "applyImpulse" && byId.has(command.particleId) && isFiniteVec2(command.impulse);
    if (!valid) commandDiagnostics.push(diagnostic("invalid_command", command?.particleId ?? "command", "Commands must be finite impulses for a known particle."));
    return valid;
  });
  const forces = new Map(state.particles.map((particle) => [particle.id, scale(definition.gravity, byId.get(particle.id).inverseMass === 0 ? 0 : 1 / byId.get(particle.id).inverseMass)]));
  const springForces = [];
  for (const spring of definition.springs) {
    if (state.brokenSpringIds.includes(spring.id)) continue;
    const a = state.particles.find((particle) => particle.id === spring.a);
    const b = state.particles.find((particle) => particle.id === spring.b);
    const direction = subtract(b.position, a.position);
    const unit = normalize(direction);
    if (unit.kind === "degenerate") {
      springForces.push(Object.freeze({ springId: spring.id, kind: "degenerate" }));
      continue;
    }
    const extension = length(direction) - spring.restLength;
    const axialSpeed = dot(subtract(b.velocity, a.velocity), unit.value);
    const forceOnA = scale(unit.value, spring.stiffness * extension + spring.damping * axialSpeed);
    const forceOnB = negate(forceOnA);
    forces.set(a.id, add(forces.get(a.id) as any, forceOnA));
    forces.set(b.id, add(forces.get(b.id) as any, forceOnB));
    springForces.push(Object.freeze({ springId: spring.id, kind: "force", extension, forceOnA, forceOnB }));
  }
  const particles = state.particles.map((stateParticle) => {
    const definitionParticle = byId.get(stateParticle.id);
    const impulse = validCommands.reduce((total, command) => add(total, commandVelocityDelta(command, definitionParticle)), zero);
    if (definitionParticle.inverseMass === 0) return Object.freeze({ ...stateParticle });
    const velocity = add(add(stateParticle.velocity, scale(forces.get(stateParticle.id) as any, definitionParticle.inverseMass * definition.dt)), impulse);
    return Object.freeze({ id: stateParticle.id, velocity, position: add(stateParticle.position, scale(velocity, definition.dt)) });
  });
  const contacts = [];
  const solvedParticles = solveContacts(particles, definition, contacts);
  const nextState = Object.freeze({ stepIndex: state.stepIndex + 1, particles: freezeList(solvedParticles), brokenSpringIds: state.brokenSpringIds });
  return Object.freeze({ state: nextState, forces: freezeList(springForces), contacts: freezeList(contacts), diagnostics: freezeList(commandDiagnostics), events: freezeList([]) });
}
