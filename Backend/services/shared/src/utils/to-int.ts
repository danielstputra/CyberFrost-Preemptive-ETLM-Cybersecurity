/**
 * Safe integer parser untuk environment variables.
 * Mengembalikan fallback jika nilai tidak valid.
 */
export function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}
