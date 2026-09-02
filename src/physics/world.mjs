import { diagnostic, isFiniteNumber } from "../math/scalar.mjs";
import { add, isFiniteVec2, scale, subtract, vec2, zero, dot, length, normalize } from "../math/vec2.mjs";

const freezeList = (values) => Object.freeze([...values]);

export function createWorldDefinition({ particles = [], springs = [], gravity = zero, dt = 1 / 60 } = {}) {
  const diagnostics = [];
  const ids = new Set();
  if (!Array.isArray(particles) || particles.length === 0) diagnostics.push(diagnostic("missing_particles", "particles", "A world needs at least one particle."));
  if (!isFiniteVec2(gravity) || !isFiniteNumber(dt) || dt <= 0) diagnostics.push(diagnostic("invalid_settings", "settings", "Gravity and a positive finite timestep are required."));
  for (const particle of particles) {
    if (typeof particle.id !== "string" || ids.has(particle.id)) diagnostics.push(diagnostic("duplicate_or_invalid_particle", particle.id ?? "particle", "Particle IDs must be unique strings."));
    else ids.add(particle.id);
    if (!isFiniteVec2(particle.position) || !isFiniteVec2(particle.velocity) || !isFiniteNumber(particle.inverseMass) || particle.inverseMass < 0) diagnostics.push(diagnostic("invalid_particle", particle.id ?? "particle", "Particle values must be finite and inverse mass non-negative."));
  }
  const springIds = new Set();
  for (const spring of springs) {
    if (typeof spring.id !== "string" || springIds.has(spring.id)) diagnostics.push(diagnostic("duplicate_or_invalid_spring", spring.id ?? "spring", "Spring IDs must be unique strings."));
    else springIds.add(spring.id);
    if (!ids.has(spring.a) || !ids.has(spring.b) || spring.a === spring.b || !isFiniteNumber(spring.restLength) || spring.restLength < 0 || !isFiniteNumber(spring.stiffness) || spring.stiffness < 0 || !isFiniteNumber(spring.damping) || spring.damping < 0) diagnostics.push(diagnostic("invalid_spring", spring.id ?? "spring", "Springs need distinct known endpoints and finite non-negative parameters."));
  }
  if (diagnostics.length > 0) return Object.freeze({ ok: false, diagnostics: freezeList(diagnostics) });
  return Object.freeze({ ok: true, value: Object.freeze({ particles: freezeList(particles.map((particle) => Object.freeze({ ...particle }))), springs: freezeList(springs.map((spring) => Object.freeze({ ...spring }))), gravity, dt }) });
}

export function createInitialState(definition) {
  return Object.freeze({ stepIndex: 0, particles: freezeList(definition.particles.map((particle) => Object.freeze({ id: particle.id, position: particle.position, velocity: particle.velocity }))), brokenSpringIds: freezeList([]) });
}

function commandVelocityDelta(command, particle) {
  if (command.particleId !== particle.id) return zero;
  return particle.inverseMass === 0 ? zero : scale(command.impulse, particle.inverseMass);
}

export function step(definition, state, commands = []) {
  const byId = new Map(definition.particles.map((particle) => [particle.id, particle]));
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
    const forceOnB = subtract(zero, forceOnA);
    forces.set(a.id, add(forces.get(a.id), forceOnA));
    forces.set(b.id, add(forces.get(b.id), forceOnB));
    springForces.push(Object.freeze({ springId: spring.id, kind: "force", extension, forceOnA, forceOnB }));
  }
  const particles = state.particles.map((stateParticle) => {
    const definitionParticle = byId.get(stateParticle.id);
    const impulse = validCommands.reduce((total, command) => add(total, commandVelocityDelta(command, definitionParticle)), zero);
    if (definitionParticle.inverseMass === 0) return Object.freeze({ ...stateParticle });
    const velocity = add(add(stateParticle.velocity, scale(forces.get(stateParticle.id), definitionParticle.inverseMass * definition.dt)), impulse);
    return Object.freeze({ id: stateParticle.id, velocity, position: add(stateParticle.position, scale(velocity, definition.dt)) });
  });
  const nextState = Object.freeze({ stepIndex: state.stepIndex + 1, particles: freezeList(particles), brokenSpringIds: state.brokenSpringIds });
  return Object.freeze({ state: nextState, forces: freezeList(springForces), diagnostics: freezeList(commandDiagnostics), events: freezeList([]) });
}
