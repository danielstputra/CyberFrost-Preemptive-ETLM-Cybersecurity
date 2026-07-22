/**
 * Data Masking Utilities
 * ======================
 * Helper functions for masking sensitive data in logs and responses.
 */

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /jwt/i,
];

/**
 * Mask sensitive keys in an object recursively.
 */
export function maskSensitiveData<T>(data: T): T {
  if (typeof data !== 'object' || data === null) return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData) as unknown as T;
  }

  const masked = { ...data } as Record<string, unknown>;
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_PATTERNS.some((p) => p.test(key))) {
      masked[key] = '[REDACTED]';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked as T;
}
