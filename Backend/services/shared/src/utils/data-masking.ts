/**
 * Data Masking Utility
 *
 * Masks sensitive data fields before logging, displaying, or sharing externally.
 * All functions return the masked string; invalid / empty inputs return the original.
 */

// ──────────────────────────────────────
// Email Masking
// ──────────────────────────────────────

/**
 * Masks the local-part of an email address, keeping the domain visible.
 *
 * @example
 *   maskEmail('johndoe@gmail.com')        → 'joh****@gmail.com'
 *   maskEmail('a@b.com')                  → 'a****@b.com'
 *   maskEmail('invalid-email')            → 'invalid-email'    (unchanged)
 *   maskEmail('')                         → ''
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return email;

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex);

  if (localPart.length <= 2) {
    // Very short local parts: show first char, mask rest
    return `${localPart[0]}****${domain}`;
  }

  // Show first 3 chars, mask the rest of the local part with asterisks
  const visible = localPart.slice(0, 3);
  return `${visible}****${domain}`;
}

// ──────────────────────────────────────
// NIK (Indonesian National ID) Masking
// ──────────────────────────────────────

/**
 * Masks an Indonesian National ID (Nomor Induk Kependudukan — NIK).
 * NIK is always 16 digits. Shows first 4 and last 3 digits.
 *
 * @example
 *   maskNik('3271012345678901')  → '3271********8901'
 *   maskNik('12345')             → '12345'           (unchanged — too short)
 *   maskNik('')                  → ''
 */
export function maskNik(nik: string): string {
  if (!nik || typeof nik !== 'string') return nik;
  if (nik.length < 10) return nik;

  const leading = nik.slice(0, 4);
  const trailing = nik.slice(-4);

  return `${leading}********${trailing}`;
}

// ──────────────────────────────────────
// Credit Card Masking
// ──────────────────────────────────────

/**
 * Masks a credit / debit card number, showing only the first 4 and last 4 digits.
 * Strips non-digit characters (spaces, dashes) before masking.
 *
 * @example
 *   maskCreditCard('4111111111111111')       → '4111********1111'
 *   maskCreditCard('4111-1111-1111-1111')    → '4111********1111'
 *   maskCreditCard('4111 1111 1111 1111')    → '4111********1111'
 *   maskCreditCard('1234')                   → '1234'          (too short)
 *   maskCreditCard('')                       → ''
 */
export function maskCreditCard(cc: string): string {
  if (!cc || typeof cc !== 'string') return cc;

  const digits = cc.replace(/[\s\-]/g, '');
  if (digits.length < 8) return cc;

  const leading = digits.slice(0, 4);
  const trailing = digits.slice(-4);

  return `${leading}********${trailing}`;
}

// ──────────────────────────────────────
// Phone Number Masking
// ──────────────────────────────────────

/**
 * Masks a phone number, showing first 4 and last 3 digits.
 * Strips non-digit characters (spaces, +, -, parentheses) before masking.
 *
 * @example
 *   maskPhone('08123456789')       → '0812*****789'
 *   maskPhone('+62 812 3456 789') → '+62 812 ****56789'
 *   maskPhone('12345')             → '12345'        (too short)
 *   maskPhone('')                  → ''
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;

  // Strip non-digit chars but keep leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/[\s\-\(\)]/g, '');

  // Remove + for length calculation
  const cleanDigits = hasPlus ? digits.slice(1) : digits;

  if (cleanDigits.length < 6) return phone;

  const visibleLeading = cleanDigits.slice(0, 4);
  const visibleTrailing = cleanDigits.slice(-3);
  const maskedMiddle = '*'.repeat(cleanDigits.length - 7);

  const masked = `${visibleLeading}${maskedMiddle}${visibleTrailing}`;
  return hasPlus ? `+${masked}` : masked;
}

// ──────────────────────────────────────
// Generic Text Masking
// ──────────────────────────────────────

/**
 * Scans a piece of text and applies all available masks to any sensitive
 * data patterns found (email, NIK, credit card, phone).
 *
 * Uses regex detection to locate and replace:
 *   - Email addresses      (RFC-5322 simplified)
 *   - NIK (16 consecutive digits starting with region code)
 *   - Credit card numbers  (13–19 consecutive digits, optionally with spaces/dashes)
 *   - Phone numbers        (various international formats)
 *
 * @example
 *   maskText('Contact johndoe@gmail.com or 3271012345678901')
 *   → 'Contact joh****@gmail.com or 3271********8901'
 */
export function maskText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Mask emails
  result = result.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match) => maskEmail(match),
  );

  // Mask NIK (16 consecutive digits starting with a 4-digit region code)
  result = result.replace(
    /\b(\d{16})\b/g,
    (match) => maskNik(match),
  );

  // Mask credit cards (13-19 consecutive digits that are not already NIK-length)
  // Also handles groups separated by spaces/dashes like "4111-1111-1111-1111"
  result = result.replace(
    /\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/g,
    (match) => maskCreditCard(match),
  );

  // Mask phone numbers: +XX XXXX..., 0XXX... patterns with at least 7 digits
  result = result.replace(
    /(\+?\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,4}[\s\-]?\d{1,4})/g,
    (match) => maskPhone(match),
  );

  return result;
}
