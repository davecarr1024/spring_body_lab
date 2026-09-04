import type { Diagnostic, Result, Tolerance } from "./types.js";

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function createTolerance({ absolute = 1e-9, relative = 1e-9 }: Partial<Tolerance> = {}): Result<Tolerance> {
  if (!isFiniteNumber(absolute) || !isFiniteNumber(relative) || absolute < 0 || relative < 0) {
    return Object.freeze({ ok: false, diagnostics: [diagnostic("invalid_tolerance", "tolerance", "Absolute and relative tolerances must be finite non-negative numbers.")] });
  }
  return Object.freeze({ ok: true, value: Object.freeze({ absolute, relative }) });
}

export const defaultTolerance = (createTolerance() as { value: Tolerance }).value;

export function approximatelyEqual(left: number, right: number, tolerance: Tolerance = defaultTolerance): boolean {
  return Math.abs(left - right) <= tolerance.absolute + tolerance.relative * Math.max(Math.abs(left), Math.abs(right));
}

export function isNearZero(value: number, tolerance: Tolerance = defaultTolerance): boolean {
  return Math.abs(value) <= tolerance.absolute;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function diagnostic(code: string, subject: string, message: string): Diagnostic {
  return Object.freeze({ code, subject, message });
}
