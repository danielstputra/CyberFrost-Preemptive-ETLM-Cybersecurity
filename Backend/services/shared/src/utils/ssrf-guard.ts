/**
 * SSRF Guard — URL validation untuk mencegah Server-Side Request Forgery
 * ====================================================================
 * Memvalidasi URL yang akan di-fetch oleh server untuk memblokir:
 *  - Private/internal IP ranges (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
 *  - Localhost (127.0.0.1, localhost, ::1)
 *  - Cloud metadata endpoints (169.254.169.254)
 *  - Link-local addresses (169.254.x.x)
 */

import { URL } from 'url';
import { isIP } from 'net';

const BLOCKED_IP_PATTERNS = [
  // IPv4 private ranges
  (ip: string) => ip.startsWith('10.'),
  (ip: string) => ip.startsWith('127.'),
  (ip: string) => ip.startsWith('192.168.'),
  (ip: string) => /^172\.(1[6-9]|2\d|3[01])\./.test(ip),
  // Cloud metadata
  (ip: string) => ip.startsWith('169.254.'),
  // Link-local
  (ip: string) => ip === '0.0.0.0',
  // IPv6 localhost
  (ip: string) => ip === '::1' || ip === '0:0:0:0:0:0:0:1',
  // IPv6 private (fc00::/7)
  (ip: string) => ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd'),
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  'metadata.google.internal',
  'metadata.internal',
];

/**
 * Validasi URL untuk mencegah SSRF.
 * Returns: { valid: true } atau { valid: false, reason: string }
 */
export function validateUrlAgainstSSRF(urlString: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Hanya izinkan http dan https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Protocol '${parsed.protocol}' is not allowed. Only http/https.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Cek hostname terlarang
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, reason: `Access to '${hostname}' is blocked (internal resource).` };
  }

  // Cek IP-based hostname
  if (isIP(hostname)) {
    for (const check of BLOCKED_IP_PATTERNS) {
      if (check(hostname)) {
        return { valid: false, reason: `Access to private IP range '${hostname}' is blocked.` };
      }
    }
  }

  return { valid: true };
}
