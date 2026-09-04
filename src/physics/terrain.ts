import { diagnostic, isFiniteNumber } from "../math/scalar.js";
import { isFiniteVec2 } from "../math/vec2.js";

const freezeList = (values: readonly unknown[]) => Object.freeze([...values]);

/** Converts ordered height samples into inspectable fixed terrain segments. */
export function createHeightfield({ id = "terrain", points }: any = {}) {
  const diagnostics = [];
  if (typeof id !== "string" || id.length === 0) diagnostics.push(diagnostic("invalid_heightfield_id", "terrain", "A heightfield needs a non-empty string ID."));
  if (!Array.isArray(points) || points.length < 2 || points.some((point) => !isFiniteVec2(point)) || points?.some((point, index) => index > 0 && (!isFiniteNumber(point.x) || point.x <= points[index - 1].x))) diagnostics.push(diagnostic("invalid_heightfield_points", id, "Heightfield points must be finite and strictly increase in X."));
  if (diagnostics.length > 0) return Object.freeze({ ok: false, diagnostics: freezeList(diagnostics) });
  return Object.freeze({ ok: true, value: Object.freeze({ id, points: freezeList(points), segments: freezeList(points.slice(1).map((point, index) => Object.freeze({ id: `${id}:${index}`, start: points[index], end: point }))) }) });
}
