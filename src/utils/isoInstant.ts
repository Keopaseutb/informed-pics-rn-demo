/**
 * True when `value` is a canonical UTC instant string matching `Date.prototype.toISOString()`
 * output (strict; avoids permissive `Date.parse` inputs like date-only strings).
 */
export const isCanonicalIsoInstant = (value: string): boolean => {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) && d.toISOString() === value;
};
