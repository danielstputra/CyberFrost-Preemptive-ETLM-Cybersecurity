import mongoose, { Schema, Document } from 'mongoose';

// ──────────────────────────────────────
//  Types
// ──────────────────────────────────────

export type TargetType = 'CVE' | 'IOC' | 'THREAT_ACTOR' | 'INCIDENT' | 'ASSET';
export type ScoreLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecommendedAction = 'MONITOR' | 'REVIEW' | 'PATCH' | 'ESCALATE' | 'IMMEDIATE';
export type ExploitMaturity = 'NONE' | 'POC' | 'WEAPONIZED' | 'ACTIVE';
export type ActorActivity = 'LOW' | 'MEDIUM' | 'HIGH';
export type Criticality = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ──────────────────────────────────────
//  Interfaces
// ──────────────────────────────────────

export interface IScoreBreakdown {
  exploitability: number; // 0-100
  impact: number;         // 0-100
  threatIntel: number;    // 0-100
  recency: number;        // 0-100
  context: number;        // 0-100
}

export interface IThreatScoreSignals {
  cvssScore: number;
  cvssVector?: string;
  exploitAvailable: boolean;
  exploitMaturity: ExploitMaturity;
  darkWebMentions: number;
  threatActorCount: number;
  threatActorActivity: ActorActivity;
  daysSincePublished: number;
  daysSinceDetected: number;
  assetCriticality: Criticality;
  affectedAssetsCount: number;
}

export interface IThreatScore extends Document {
  targetType: TargetType;
  targetId: string;
  targetRef: string;
  signals: IThreatScoreSignals;
  score: number;                      // 0-100
  level: ScoreLevel;
  confidence: Confidence;
  breakdown: IScoreBreakdown;
  recommendedAction: RecommendedAction;
  recommendedActionReason: string;
  lastCalculatedAt: Date;
  expiresAt: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
//  Schema
// ──────────────────────────────────────

const ThreatScoreSchema = new Schema<IThreatScore>(
  {
    targetType: {
      type: String,
      enum: ['CVE', 'IOC', 'THREAT_ACTOR', 'INCIDENT', 'ASSET'],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true },
    targetRef: { type: String, required: true },

    signals: {
      cvssScore: { type: Number, default: 0 },
      cvssVector: String,
      exploitAvailable: { type: Boolean, default: false },
      exploitMaturity: {
        type: String,
        enum: ['NONE', 'POC', 'WEAPONIZED', 'ACTIVE'],
        default: 'NONE',
      },
      darkWebMentions: { type: Number, default: 0 },
      threatActorCount: { type: Number, default: 0 },
      threatActorActivity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW',
      },
      daysSincePublished: { type: Number, default: 999 },
      daysSinceDetected: { type: Number, default: 999 },
      assetCriticality: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW',
      },
      affectedAssetsCount: { type: Number, default: 0 },
    },

    score: { type: Number, required: true, min: 0, max: 100 },
    level: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },

    breakdown: {
      exploitability: { type: Number, default: 0 },
      impact: { type: Number, default: 0 },
      threatIntel: { type: Number, default: 0 },
      recency: { type: Number, default: 0 },
      context: { type: Number, default: 0 },
    },

    recommendedAction: {
      type: String,
      enum: ['MONITOR', 'REVIEW', 'PATCH', 'ESCALATE', 'IMMEDIATE'],
      default: 'MONITOR',
    },
    recommendedActionReason: { type: String, default: '' },

    lastCalculatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

// ── Compound index untuk lookups ──
ThreatScoreSchema.index({ tenantId: 1, targetType: 1, score: -1 });
ThreatScoreSchema.index({ tenantId: 1, targetId: 1 }, { unique: true });
ThreatScoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

export const ThreatScore = mongoose.model<IThreatScore>('ThreatScore', ThreatScoreSchema);
