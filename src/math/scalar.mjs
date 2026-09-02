export const EPSILON = 1e-9;

export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function approximatelyEqual(left, right, tolerance = EPSILON) {
  return Math.abs(left - right) <= tolerance * Math.max(1, Math.abs(left), Math.abs(right));
}

export function diagnostic(code, subject, message) {
  return Object.freeze({ code, subject, message });
}
