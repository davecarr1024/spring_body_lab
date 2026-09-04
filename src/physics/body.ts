import { distance, isFiniteVec2, vec2, zero } from "../math/vec2.js";
import { diagnostic, isFiniteNumber } from "../math/scalar.js";

const freezeList = (values) => Object.freeze([...values]);

export function createGridBody({ id = "body", rows, columns, origin, spacing, inverseMass = 1, radius = 8, stiffness = 90, damping = 4, breakStrain, velocity = zero }: any = {}) {
  const diagnostics = [];
  if (typeof id !== "string" || id.length === 0) diagnostics.push(diagnostic("invalid_body_id", "body", "A grid body needs a non-empty string ID."));
  if (!Number.isInteger(rows) || rows < 2 || !Number.isInteger(columns) || columns < 2) diagnostics.push(diagnostic("invalid_grid_size", id, "Grid bodies need at least two rows and columns."));
  if (!isFiniteVec2(origin) || !isFiniteVec2(velocity) || !isFiniteNumber(spacing) || spacing <= 0 || !isFiniteNumber(inverseMass) || inverseMass < 0 || !isFiniteNumber(radius) || radius < 0 || !isFiniteNumber(stiffness) || stiffness < 0 || !isFiniteNumber(damping) || damping < 0 || (breakStrain !== undefined && (!isFiniteNumber(breakStrain) || breakStrain < 0))) diagnostics.push(diagnostic("invalid_grid_settings", id, "Grid body values need finite non-negative parameters, a positive spacing, and an optional finite non-negative break strain."));
  if (diagnostics.length) return Object.freeze({ ok: false, diagnostics: freezeList(diagnostics) });
  const particles: any[] = [];
  const springs: any[] = [];
  const faces: any[] = [];
  // Recipe-derived IDs make generated topology reproducible and inspectable.
  const particleId = (row, column) => `${id}:p:${row}:${column}`;
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) particles.push(Object.freeze({ id: particleId(row, column), position: vec2(origin.x + column * spacing, origin.y + row * spacing), velocity, inverseMass, radius }));
  const addSpring = (a: number[], b: number[], kind: string) => springs.push(Object.freeze({ id: `${id}:s:${kind}:${a}:${b}`, a: particleId(a[0], a[1]), b: particleId(b[0], b[1]), restLength: distance(particles[a[0] * columns + a[1]].position, particles[b[0] * columns + b[1]].position), stiffness, damping, ...(breakStrain === undefined ? {} : { breakStrain }), kind }));
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) {
    // Structural edges resist stretch; crossed diagonals resist rectangular shear.
    if (column + 1 < columns) addSpring([row, column], [row, column + 1], "structural");
    if (row + 1 < rows) addSpring([row, column], [row + 1, column], "structural");
    if (row + 1 < rows && column + 1 < columns) {
      addSpring([row, column], [row + 1, column + 1], "diagonal");
      addSpring([row + 1, column], [row, column + 1], "diagonal");
      faces.push(Object.freeze({ id: `${id}:f:${row}:${column}`, particleIds: freezeList([particleId(row, column), particleId(row, column + 1), particleId(row + 1, column + 1), particleId(row + 1, column)]) }));
    }
  }
  return Object.freeze({ ok: true, value: Object.freeze({ id, particles: freezeList(particles), springs: freezeList(springs), faces: freezeList(faces) }) });
}
