/**
 * Backend API Gateway URL
 * Ganti dengan URL production saat deploy
 */
export const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const API_PREFIX = '/api/v1';

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: `${API_PREFIX}/auth/login`,
  AUTH_REGISTER: `${API_PREFIX}/auth/register`,
  AUTH_REFRESH: `${API_PREFIX}/auth/refresh`,
  AUTH_ME: `${API_PREFIX}/auth/me`,
  AUTH_LOGOUT: `${API_PREFIX}/auth/logout`,

  // Discovery
  DISCOVERY_SCAN: `${API_PREFIX}/discovery/scan`,
  DISCOVERY_SCANS: `${API_PREFIX}/discovery/scans`,
  DISCOVERY_DOMAINS: `${API_PREFIX}/discovery/domains`,

  // Intelligence
  INTEL_VULNERABILITIES: `${API_PREFIX}/intelligence/vulnerabilities`,
  INTEL_THREATS: `${API_PREFIX}/intelligence/threats`,
  INTEL_DASHBOARD: `${API_PREFIX}/intelligence/dashboard`,

  // OSINT
  OSINT_SCAN: `${API_PREFIX}/osint/scan`,
  OSINT_SCANS: `${API_PREFIX}/osint/scans`,
  OSINT_LEAKS: `${API_PREFIX}/osint/leaks`,
  OSINT_EXPOSURES: `${API_PREFIX}/osint/exposures`,
  OSINT_DASHBOARD: `${API_PREFIX}/osint/dashboard`,

  // Notification
  NOTIFICATIONS: `${API_PREFIX}/notifications`,
  NOTIFICATIONS_UNREAD: `${API_PREFIX}/notifications/unread-count`,
  NOTIFICATIONS_READ_ALL: `${API_PREFIX}/notifications/read-all`,

  // Action & Mitigation
  ACTION_TAKEDOWN: `${API_PREFIX}/action/takedown`,
  ACTION_MITIGATION: `${API_PREFIX}/action/mitigation`,
  ACTION_MITIGATION_BLOCK: `${API_PREFIX}/action/mitigation/block`,
  ACTION_MITIGATION_STATS: `${API_PREFIX}/action/mitigation/stats/overview`,
  ACTION_TAKEDOWN_EMAIL: `${API_PREFIX}/action/takedown/generate-email`,

  // 2FA
  TWOFA_SETUP: `${API_PREFIX}/auth/2fa/setup`,
  TWOFA_VERIFY: `${API_PREFIX}/auth/2fa/verify`,
  TWOFA_DISABLE: `${API_PREFIX}/auth/2fa/disable`,
  TWOFA_STATUS: `${API_PREFIX}/auth/2fa/status`,
  TWOFA_AUTHENTICATE: `${API_PREFIX}/auth/2fa/authenticate`,

  // API Tokens
  TOKENS: `${API_PREFIX}/auth/tokens`,

  // Sessions
  SESSIONS: `${API_PREFIX}/auth/sessions`,

  // Health
  HEALTH: `${API_PREFIX}/health`,
} as const;

export const SEVERITY_COLORS = {
  CRITICAL: 'text-red-600 bg-red-50 border-red-200',
  HIGH: 'text-orange-600 bg-orange-50 border-orange-200',
  MEDIUM: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  LOW: 'text-green-600 bg-green-50 border-green-200',
} as const;

export const NAV_ITEMS = [
  { label: 'Executive View', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Attack Surface', href: '/dashboard/attack-surface', icon: 'Shield' },
  { label: 'Vulnerabilities', href: '/dashboard/vulnerabilities', icon: 'Bug' },
  { label: 'Threat Intelligence', href: '/dashboard/threat-intel', icon: 'Radio' },
  { label: 'Brand Protection', href: '/dashboard/brand-protection', icon: 'Search' },
  { label: 'Action & Mitigation', href: '/dashboard/action-mitigation', icon: 'ShieldOff' },
  { label: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
] as const;
