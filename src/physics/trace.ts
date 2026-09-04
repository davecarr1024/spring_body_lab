import { isFiniteVec2, vec2 } from "../math/vec2.js";
import { diagnostic } from "../math/scalar.js";
import { createInitialState, createWorldDefinition, step } from "./world.js";

const freezeList = (values) => Object.freeze([...values]);

function recordCommand(command: any) {
  return Object.freeze({
    kind: command?.kind,
    particleId: command?.particleId,
    impulse: isFiniteVec2(command?.impulse) ? vec2(command.impulse.x, command.impulse.y) : undefined,
  });
}

export function createTrace(definition: any, initialState: any = createInitialState(definition)) {
  return Object.freeze({ definition, initialState, state: initialState, entries: freezeList([]) });
}

export function appendTraceStep(trace: any, commands: ReadonlyArray<any> = []) {
  // Record a normalized command fact, then retain the exact result it produced.
  const recordedCommands = freezeList(commands.map(recordCommand));
  const result = step(trace.definition, trace.state, recordedCommands);
  const entry = Object.freeze({ stepIndex: trace.state.stepIndex, commands: recordedCommands, result });
  const nextTrace = Object.freeze({
    definition: trace.definition,
    initialState: trace.initialState,
    state: result.state,
    entries: freezeList([...trace.entries, entry]),
  });
  return Object.freeze({ trace: nextTrace, result });
}

export function replayTrace(trace: any) {
  // Replay deliberately recomputes evidence from the initial state instead of trusting snapshots.
  return trace.entries.reduce(
    (replayed, entry) => appendTraceStep(replayed, entry.commands).trace,
    createTrace(trace.definition, trace.initialState),
  );
}

/** Serializes the portable recipe and command facts, never derived runtime snapshots. */
export function serializeTrace(trace: any): string {
  return JSON.stringify(Object.freeze({ format: "spring-body-lab/trace@1", definition: trace.definition, entries: trace.entries.map((entry: any) => entry.commands) }));
}

/** Rebuilds trace evidence from commands so stored runtime state is never trusted. */
export function deserializeTrace(serialized: string) {
  try {
    const parsed = JSON.parse(serialized);
    if (parsed?.format !== "spring-body-lab/trace@1" || !Array.isArray(parsed.entries)) throw new Error("format");
    const definition = createWorldDefinition(parsed.definition);
    if (definition.ok === false) return Object.freeze({ ok: false, diagnostics: definition.diagnostics });
    const trace = parsed.entries.reduce((current: any, commands: any) => {
      if (!Array.isArray(commands)) throw new Error("commands");
      return appendTraceStep(current, commands).trace;
    }, createTrace(definition.value));
    return Object.freeze({ ok: true, value: trace });
  } catch {
    return Object.freeze({ ok: false, diagnostics: freezeList([diagnostic("invalid_trace", "trace", "Trace data must use the supported format with a valid definition and command arrays.")]) });
  }
}
