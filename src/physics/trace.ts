import { isFiniteVec2, vec2 } from "../math/vec2.js";
import { createInitialState, step } from "./world.js";

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
