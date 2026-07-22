import mongoose, { Schema, Document } from 'mongoose';

// ──────────────────────────────────────
//  Types
// ──────────────────────────────────────

export type ScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface IScanJob extends Document {
  domain: string;
  status: ScanStatus;
  progress: number; // 0–100
  subdomainsFound: number;
  openPortsFound: number;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  tenantId: string;
  createdBy: string;
  resultSummary: {
    totalSubdomainsChecked: number;
    resolvableSubdomains: string[];
    openPorts: { port: number; service: string }[];
    technologies: string[];
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
//  Schema
// ──────────────────────────────────────

const ScanJobSchema = new Schema<IScanJob>(
  {
    domain: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    subdomainsFound: { type: Number, default: 0 },
    openPortsFound: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    error: { type: String, default: null },
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    resultSummary: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'scan_jobs',
  },
);

// Index for listing recent scans per tenant
ScanJobSchema.index({ tenantId: 1, createdAt: -1 });

export const ScanJob = mongoose.model<IScanJob>('ScanJob', ScanJobSchema);
