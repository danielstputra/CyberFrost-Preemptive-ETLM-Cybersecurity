// ════════════════════════════════════════════════════
//  Shared Constants — CyberFrost Backend
// ════════════════════════════════════════════════════

// ── Service Names ──

export const SERVICES = {
  AUTH: 'auth-service',
  API_GATEWAY: 'api-gateway',
  DISCOVERY: 'discovery-service',
  INTELLIGENCE: 'intelligence-service',
  OSINT: 'osint-service',
  NOTIFICATION: 'notification-service',
} as const;

// ── Service Ports ──

export const SERVICE_PORTS: Record<string, number> = {
  [SERVICES.API_GATEWAY]: 4000,
  [SERVICES.AUTH]: 4001,
  [SERVICES.DISCOVERY]: 4002,
  [SERVICES.INTELLIGENCE]: 4003,
  [SERVICES.OSINT]: 4004,
  [SERVICES.NOTIFICATION]: 4005,
};

// ── API Version ──

export const API_PREFIX = '/api/v1';

// ── Rate Limiting ──

export const RATE_LIMIT = {
  GLOBAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 10,
} as const;

// ── Severity Levels ──

export const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

// ── CVSS Thresholds ──

export const CVSS_THRESHOLDS = {
  LOW: 0.1,
  MEDIUM: 4.0,
  HIGH: 7.0,
  CRITICAL: 9.0,
} as const;

// ── Scan Types ──

export const SCAN_TYPES = {
  DISCOVERY: 'DISCOVERY',
  INTELLIGENCE: 'INTELLIGENCE',
  OSINT: 'OSINT',
} as const;

export type ScanType = (typeof SCAN_TYPES)[keyof typeof SCAN_TYPES];

// ── Scan Status ──

export const SCAN_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type ScanStatus = (typeof SCAN_STATUS)[keyof typeof SCAN_STATUS];

// ── Socket.io Event Names ──

export const SOCKET_EVENTS = {
  NOTIFICATION: 'notification',
  SCAN_PROGRESS: 'scan:progress',
  ALERT_CRITICAL: 'alert:critical',
  SUBSCRIBE_NOTIFICATIONS: 'subscribe:notifications',
  SUBSCRIBE_ALERTS: 'subscribe:alerts',
  SUBSCRIBE_SCAN: 'subscribe:scan',
} as const;
