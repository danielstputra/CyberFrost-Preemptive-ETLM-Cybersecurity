/**
 * Shared Error Utilities
 * ======================
 * - Zod validation error formatter (human-readable)
 * - Standardised API error response builder
 */

import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { Response } from 'express';

// ──────────────────────────────────────
// Zod Error Formatting
// ──────────────────────────────────────

export interface FormattedZodError {
  error: 'VALIDATION';
  message: string;
  details: Array<{ path: string; message: string }>;
}

/**
 * Converts a ZodError into a human-readable API response body.
 * Returns null if the error is not a ZodError.
 *
 * @example
 *   if (err instanceof ZodError) {
 *     res.status(400).json(formatZodError(err));
 *     return;
 *   }
 */
export function formatZodError(err: unknown): FormattedZodError | null {
  if (!(err instanceof ZodError)) return null;

  const validationError = fromZodError(err);

  return {
    error: 'VALIDATION',
    message: validationError.message,
    details: err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
  };
}

/**
 * Express middleware helper: catches ZodError from request validation
 * and sends a formatted 400 response. Returns true if handled.
 *
 * @example
 *   } catch (err) {
 *     if (sendZodError(res, err)) return;
 *     log.error({ err }, 'operation failed');
 *     res.status(500).json(apiError('INTERNAL', 'Operation failed.'));
 *   }
 */
export function sendZodError(res: Response, err: unknown): boolean {
  const formatted = formatZodError(err);
  if (formatted) {
    res.status(400).json(formatted);
    return true;
  }
  return false;
}

// ──────────────────────────────────────
// Standardised API Error Response
// ──────────────────────────────────────

export interface ApiErrorBody {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Creates a standardised API error response object.
 * Use in route handlers or middleware for consistent error shapes.
 *
 * @example
 *   res.status(404).json(apiError('NOT_FOUND', 'User not found.'));
 *   res.status(401).json(apiError('TOKEN_EXPIRED', 'Please login again.'));
 */
export function apiError(error: string, message: string, details?: unknown): ApiErrorBody {
  return { error, message, ...(details !== undefined ? { details } : {}) };
}
