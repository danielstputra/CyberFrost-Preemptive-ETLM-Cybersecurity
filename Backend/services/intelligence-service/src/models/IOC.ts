import mongoose, { Schema, Document } from 'mongoose';

// ──────────────────────────────────────
//  Types
// ──────────────────────────────────────

export type IOCTypes = 'IP' | 'DOMAIN' | 'URL' | 'MD5' | 'SHA1' | 'SHA256' | 'EMAIL' | 'MUTEX' | 'YARA';
export type ThreatType = 'MALWARE' | 'PHISHING' | 'C2' | 'BOTNET' | 'RANSOMWARE' | 'SCAM' | 'SCANNER';
export type IOCSource = 'MISP' | 'OTX' | 'THREATFOX' | 'URLHAUS' | 'INTERNAL' | 'MANUAL';

export interface IIOC extends Document {
  type: IOCTypes;
  value: string;
  description: string;

  // STIX
  stixId: string;
  stixPattern: string;
  labels: string[];

  // Classification
  threatType: ThreatType;
  confidence: number;

  // Source
  source: IOCSource;
  sourceRef: string;

  // Timing
  firstSeen: Date;
  lastSeen: Date;
  expired: boolean;
  expiresAt: Date;

  // Score (dari Threat Score engine)
  score?: {
    value: number;
    level: string;
    calculatedAt: Date;
  };

  // Enrichment
  enrichment?: {
    country?: string;
    asn?: string;
    registrar?: string;
    domainAge?: number;
    rdns?: string;
  };

  // Relations
  relatedIocs: Array<{ type: IOCTypes; value: string; relation: string }>;
  relatedIncidents: Array<{ incidentId: string; name: string }>;

  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
//  Schema
// ──────────────────────────────────────

const IOCSchema = new Schema<IIOC>(
  {
    type: { type: String, enum: ['IP', 'DOMAIN', 'URL', 'MD5', 'SHA1', 'SHA256', 'EMAIL', 'MUTEX', 'YARA'], required: true, index: true },
    value: { type: String, required: true },
    description: { type: String, default: '' },

    stixId: { type: String, default: '' },
    stixPattern: { type: String, default: '' },
    labels: [{ type: String }],

    threatType: { type: String, enum: ['MALWARE', 'PHISHING', 'C2', 'BOTNET', 'RANSOMWARE', 'SCAM', 'SCANNER'], default: 'MALWARE' },
    confidence: { type: Number, default: 50, min: 0, max: 100 },

    source: { type: String, enum: ['MISP', 'OTX', 'THREATFOX', 'URLHAUS', 'INTERNAL', 'MANUAL'], default: 'MANUAL' },
    sourceRef: { type: String, default: '' },

    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    expired: { type: Boolean, default: false },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) },

    score: {
      value: Number,
      level: String,
      calculatedAt: Date,
    },

    enrichment: {
      country: String,
      asn: String,
      registrar: String,
      domainAge: Number,
      rdns: String,
    },

    relatedIocs: [{ type: { type: String }, value: String, relation: String }],
    relatedIncidents: [{ incidentId: String, name: String }],

    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

// Compound indexes
IOCSchema.index({ tenantId: 1, type: 1, value: 1 }, { unique: true });
IOCSchema.index({ tenantId: 1, source: 1 });
IOCSchema.index({ tenantId: 1, threatType: 1 });
IOCSchema.index({ tenantId: 1, 'score.value': -1 });
IOCSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IOC = mongoose.model<IIOC>('IOC', IOCSchema);
