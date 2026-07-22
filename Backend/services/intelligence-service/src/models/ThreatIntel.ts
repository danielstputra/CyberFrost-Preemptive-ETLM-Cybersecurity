import mongoose, { Schema, Document } from 'mongoose';

// ──────────────────────────────────────
//  Types
// ──────────────────────────────────────

export type ThreatType =
  | 'MALWARE'
  | 'RANSOMWARE'
  | 'PHISHING'
  | 'APT'
  | 'ZERO_DAY'
  | 'DDoS'
  | 'DATA_BREACH'
  | 'VULNERABILITY'
  | 'OTHER';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ThreatStatus = 'NEW' | 'VERIFIED' | 'ACTIONABLE' | 'MONITORING' | 'CLOSED';

export interface IIndicator {
  type: 'IP' | 'DOMAIN' | 'URL' | 'HASH_MD5' | 'HASH_SHA256' | 'EMAIL';
  value: string;
  description: string;
}

export interface IThreatIntel extends Document {
  title: string;
  description: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  source: string;                       // "CISA", "ALIENVAULT", "MISP", "SIMULATED"
  sourceUrl: string | null;
  affectedSectors: string[];            // ["Finance", "Healthcare", "Government"]
  affectedRegions: string[];            // ["APAC", "EU", "NA"]
  indicators: IIndicator[];
  mitreAttackIds: string[];
  publishedAt: Date;
  isActive: boolean;
  summary: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
//  Schema
// ──────────────────────────────────────

const IndicatorSchema = new Schema<IIndicator>(
  {
    type: {
      type: String,
      enum: ['IP', 'DOMAIN', 'URL', 'HASH_MD5', 'HASH_SHA256', 'EMAIL'],
      required: true,
    },
    value: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
);

const ThreatIntelSchema = new Schema<IThreatIntel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    threatType: {
      type: String,
      enum: ['MALWARE', 'RANSOMWARE', 'PHISHING', 'APT', 'ZERO_DAY', 'DDoS', 'DATA_BREACH', 'VULNERABILITY', 'OTHER'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'VERIFIED', 'ACTIONABLE', 'MONITORING', 'CLOSED'],
      default: 'NEW',
      index: true,
    },
    source: { type: String, default: 'SIMULATED', index: true },
    sourceUrl: { type: String, default: null },
    affectedSectors: [{ type: String }],
    affectedRegions: [{ type: String }],
    indicators: [IndicatorSchema],
    mitreAttackIds: [{ type: String }],
    publishedAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
    summary: { type: String, default: '' },
    tenantId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
    collection: 'threat_intel',
  },
);

// Indexes for common queries
ThreatIntelSchema.index({ tenantId: 1, severity: 1, publishedAt: -1 });
ThreatIntelSchema.index({ tenantId: 1, threatType: 1 });
ThreatIntelSchema.index({ title: 'text', description: 'text', summary: 'text' });

export const ThreatIntel = mongoose.model<IThreatIntel>('ThreatIntel', ThreatIntelSchema);
