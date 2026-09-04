import type { Diagnostic, Result, Vec2 } from "../math/index.js";

export type ParticleDefinition = Readonly<{ id: string; position: Vec2; velocity: Vec2; inverseMass: number; radius?: number }>;
export type SpringDefinition = Readonly<{ id: string; a: string; b: string; restLength: number; stiffness: number; damping: number; breakStrain?: number; kind?: string }>;
export type DistanceConstraintDefinition = Readonly<{ id: string; a: string; b: string; restLength: number; stiffness: number }>;
export type FixedSegmentDefinition = Readonly<{ id: string; start: Vec2; end: Vec2 }>;
export type ContactSettings = Readonly<{ tolerance: number; maxCorrection: number; restitution: number; friction: number; iterations: number; cellSize: number }>;
export type WorldDefinition = Readonly<{ particles: readonly ParticleDefinition[]; springs: readonly SpringDefinition[]; constraints: readonly DistanceConstraintDefinition[]; fixedSegments: readonly FixedSegmentDefinition[]; gravity: Vec2; dt: number; contact: ContactSettings }>;
export type ParticleState = Readonly<{ id: string; position: Vec2; velocity: Vec2 }>;
export type Component = Readonly<{ particleIds: readonly string[]; springIds: readonly string[] }>;
export type WorldState = Readonly<{ stepIndex: number; particles: readonly ParticleState[]; brokenSpringIds: readonly string[]; components: readonly Component[] }>;
export type ApplyImpulseCommand = Readonly<{ kind: "applyImpulse"; particleId: string; impulse: Vec2 }>;
export type PhysicsCommand = ApplyImpulseCommand;
export type SpringStrain = Readonly<{ kind: "finite"; value: number }> | Readonly<{ kind: "undefined_rest_length" }>;
export type SpringForceRecord = Readonly<{ springId: string; kind: "force"; extension: number; strain: SpringStrain; forceOnA: Vec2; forceOnB: Vec2 }> | Readonly<{ springId: string; kind: "degenerate"; strain: Readonly<{ kind: "undefined_direction" }> }>;
export type SpringBreakEvent = Readonly<{ kind: "spring_break"; springId: string; strain: number; breakStrain: number }>;
export type ConstraintRecord = Readonly<{ constraintId: string; extension: number; corrections: readonly Vec2[] }>;
export type ContactRecord = Readonly<Record<string, unknown>>;
export type StepResult = Readonly<{ state: WorldState; forces: readonly SpringForceRecord[]; contacts: readonly ContactRecord[]; constraints: readonly ConstraintRecord[]; diagnostics: readonly Diagnostic[]; events: readonly SpringBreakEvent[]; components: readonly Component[] }>;

export type WorldDefinitionResult = Result<WorldDefinition>;
