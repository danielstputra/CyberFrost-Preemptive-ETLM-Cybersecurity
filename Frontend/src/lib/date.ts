/**
 * Date Utilities (date-fns wrapper)
 * ==================================
 * Centralised date formatting for the frontend.
 *
 * Usage:
 *   import { formatDate, formatRelative, timeAgo } from '@/lib/date';
 *   formatDate('2026-07-22')                     // "22 Jul 2026"
 *   formatRelative('2026-07-20')                  // "2 days ago"
 *   timeAgo('2026-07-21T10:00:00Z')               // "1 day ago"
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ──────────────────────────────────────
// Types & Helpers
// ──────────────────────────────────────

type DateInput = string | number | Date | null | undefined;

function toDate(input: DateInput): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === 'number') return new Date(input);
  const parsed = parseISO(input);
  return isValid(parsed) ? parsed : null;
}

// ──────────────────────────────────────
// Format Presets
// ──────────────────────────────────────

const PRESETS = {
  /** "22 Jul 2026" */
  default: 'dd MMM yyyy',
  /** "22 Jul 2026, 14:30" */
  datetime: 'dd MMM yyyy, HH:mm',
  /** "14:30:45" */
  time: 'HH:mm:ss',
  /** "2026-07-22" */
  iso: 'yyyy-MM-dd',
  /** "Jul 2026" */
  month: 'MMM yyyy',
  /** "22 Jul" */
  dayShort: 'dd MMM',
} as const;

// ──────────────────────────────────────
// Public API
// ──────────────────────────────────────

/**
 * Format a date into a readable string.
 * @param input  - ISO string, timestamp, or Date
 * @param preset - Named preset or custom date-fns format string
 *
 * @example
 *   formatDate('2026-07-22')                // "22 Jul 2026"
 *   formatDate('2026-07-22', 'datetime')    // "22 Jul 2026, 14:30"
 *   formatDate('2026-07-22', 'yyyy/MM/dd')  // "2026/07/22"
 */
export function formatDate(
  input: DateInput,
  presetOrFormat: keyof typeof PRESETS | string = 'default',
): string {
  const date = toDate(input);
  if (!date) return '—';

  const fmt = PRESETS[presetOrFormat as keyof typeof PRESETS] || presetOrFormat;
  return format(date, fmt);
}

/**
 * Relative time: "2 days ago", "in 3 hours"
 * Falls back to formatDate if the date is invalid.
 */
export function timeAgo(input: DateInput): string {
  const date = toDate(input);
  if (!date) return '—';

  try {
    const distance = formatDistanceToNow(date, { addSuffix: true });
    return distance;
  } catch {
    return formatDate(input);
  }
}

/**
 * Short relative: "2d ago", "3h ago", "just now"
 */
export function timeAgoShort(input: DateInput): string {
  const date = toDate(input);
  if (!date) return '—';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)}d ago`;

  return formatDate(date);
}

/**
 * Check if a date is within the last N hours.
 */
export function isRecent(input: DateInput, hours = 24): boolean {
  const date = toDate(input);
  if (!date) return false;
  return Date.now() - date.getTime() < hours * 3600 * 1000;
}
