export function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function createTolerance({ absolute = 1e-9, relative = 1e-9 } = {}) {
  if (!isFiniteNumber(absolute) || !isFiniteNumber(relative) || absolute < 0 || relative < 0) {
    return Object.freeze({ ok: false, diagnostics: [diagnostic("invalid_tolerance", "tolerance", "Absolute and relative tolerances must be finite non-negative numbers.")] });
  }
  return Object.freeze({ ok: true, value: Object.freeze({ absolute, relative }) });
}

export const defaultTolerance = createTolerance().value;

export function approximatelyEqual(left, right, tolerance = defaultTolerance) {
  return Math.abs(left - right) <= tolerance.absolute + tolerance.relative * Math.max(Math.abs(left), Math.abs(right));
}

export function isNearZero(value, tolerance = defaultTolerance) {
  return Math.abs(value) <= tolerance.absolute;
}

export function diagnostic(code, subject, message) {
  return Object.freeze({ code, subject, message });
}
