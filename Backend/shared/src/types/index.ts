// ════════════════════════════════════════════════════
//  Shared Types — CyberFrost Backend
// ════════════════════════════════════════════════════

// ── User & Auth ──

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  lastLoginAt: string | null;
}

// ── API Response ──

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Attack Surface ──

export interface Domain {
  id: string;
  domain: string;
  ipAddress: string | null;
  openPorts: number[];
  technologies: string[];
  isActive: boolean;
  lastSeenAt: string;
  tenantId: string;
}

export interface BrandExposure {
  id: string;
  brandName: string;
  domain: string;
  type: 'PHISHING' | 'TYPOSQUATTING' | 'IMPERSONATION' | 'LOOKALIKE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'INVESTIGATING' | 'MITIGATED' | 'FALSE_POSITIVE';
  discoveredAt: string;
  tenantId: string;
}

// ── Vulnerability Intel ──

export interface Vulnerability {
  id: string;
  cveId: string;
  cvssScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedProducts: string[];
  exploitAvailable: boolean;
  publishedAt: string;
  tenantId: string;
  status: 'NEW' | 'REVIEWING' | 'PATCHED' | 'ACCEPTED';
}

// ── Dark Web / OSINT ──

export interface DarkWebLeak {
  id: string;
  source: string;
  title: string;
  content: string;
  leakedCredentials: boolean;
  emailsInvolved: number;
  discoveredAt: string;
  tenantId: string;
}

// ── Scan / Job ──

export interface ScanJob {
  id: string;
  type: 'DISCOVERY' | 'INTELLIGENCE' | 'OSINT';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number; // 0–100
  config: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  tenantId: string;
  createdBy: string;
}

// ── Notifications ──

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'WARNING' | 'CRITICAL';
  read: boolean;
  createdAt: string;
  tenantId: string;
}

// ── Socket.io Events ──

export interface ServerToClientEvents {
  notification: (data: Notification) => void;
  'scan:progress': (data: { scanId: string; progress: number; status: string }) => void;
  'alert:critical': (data: { title: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'subscribe:notifications': (userId: string) => void;
  'subscribe:alerts': (tenantId: string) => void;
  'subscribe:scan': (scanId: string) => void;
  'unsubscribe:notifications': (userId: string) => void;
  'unsubscribe:alerts': (tenantId: string) => void;
}
