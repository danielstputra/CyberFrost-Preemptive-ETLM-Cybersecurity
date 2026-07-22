// ══════════════════════════════════════
//  Auth Types
// ══════════════════════════════════════

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  tenantName: string;
  tenantSlug: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
  tenant?: Tenant;
}

export type UserRoleType = 'SUPER_ADMIN' | 'SOC_MANAGER' | 'SOC_ANALYST' | 'TENANT_ADMIN' | 'SECURITY_OPERATOR' | 'COMPLIANCE_OFFICER' | 'EXECUTIVE_VIEWER';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  tenantId: string;
  avatarUrl?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

// ══════════════════════════════════════
//  Discovery Types
// ══════════════════════════════════════

export interface ScanJob {
  jobId: string;
  domain: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  subdomainsFound: number;
  openPortsFound: number;
  createdAt: string;
  completedAt?: string;
}

export interface DiscoveredDomain {
  id: string;
  domain: string;
  parentDomain: string;
  ipAddress: string | null;
  ports: { port: number; service: string }[];
  technologies: { name: string; category: string }[];
  isActive: boolean;
  lastSeenAt: string;
}

// ══════════════════════════════════════
//  Intelligence Types
// ══════════════════════════════════════

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  cvss: { score: number; vector: string };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedProducts: string[];
  exploitAvailable: boolean;
  publishedAt: string;
  source: string;
  status: string;
}

export interface ThreatIntel {
  id: string;
  title: string;
  summary: string;
  threatType: string;
  severity: string;
  status: string;
  source: string;
  affectedSectors: string[];
  publishedAt: string;
}

export interface IntelDashboard {
  totalVulnerabilities: number;
  severityBreakdown: Record<string, number>;
  exploitsAvailable: number;
  recentVulnerabilities: { cveId: string; title: string; severity: string; cvssScore: number }[];
  activeThreats: { _id?: string; title: string; threatType: string; severity: string }[];
}

// ══════════════════════════════════════
//  OSINT Types
// ══════════════════════════════════════

export interface DarkWebLeak {
  _id: string;
  title: string;
  source: string;
  domain: string;
  leakType: string;
  severity: string;
  status: string;
  leakedCredentials: boolean;
  emailsInvolved: number;
  discoveredAt: string;
}

export interface BrandExposure {
  _id: string;
  brandName: string;
  domain: string;
  exposureType: string;
  severity: string;
  status: string;
  url: string;
  discoveredAt: string;
}

// ══════════════════════════════════════
//  Notification Types
// ══════════════════════════════════════

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'ALERT' | 'WARNING' | 'INFO' | 'CRITICAL';
  eventType: string;
  source: string;
  read: boolean;
  createdAt: string;
}

// ══════════════════════════════════════
//  Action & Mitigation Types
// ══════════════════════════════════════

export type TakedownStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'ESCALATED_VIP' | 'SUCCESSFUL' | 'REJECTED';

export interface IAnalystLog {
  analystId: string;
  analystName: string;
  timestamp: string;
  note: string;
  previousStatus: string;
  newStatus: string;
}

export interface TakedownRequest {
  _id: string;
  targetUrl: string;
  domain: string;
  threatType: string;
  targetType?: string;
  platform: string;
  socialPlatform?: string;
  profileUrl?: string;
  impersonatedEntity?: string;
  evidenceFiles?: string[];
  status: TakedownStatus;
  evidence: string;
  draftContent?: string;
  submittedTo: string;
  submittedAt: string | null;
  responseRef: string | null;
  analystLogs?: IAnalystLog[];
  notes: string;
  tenantId: string;
  createdAt: string;
}

export type MitigationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'EXPIRED' | 'FAILED';

export interface MitigationAction {
  _id: string;
  targetIp: string;
  targetDomain: string;
  mitigationType: string;
  firewallProvider: string;
  status: MitigationStatus;
  ruleName: string;
  ruleId: string | null;
  description: string;
  autoTriggered: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface MitigationStats {
  total: number;
  autoTriggered: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

// ══════════════════════════════════════
//  Generic API Response
// ══════════════════════════════════════

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
