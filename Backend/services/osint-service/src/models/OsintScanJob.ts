import mongoose, { Schema, Document } from 'mongoose';

export type OsintScanType = 'DOMAIN' | 'COMPANY' | 'KEYWORD' | 'DARKWEB';
export type OsintScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface IOsintScanJob extends Document {
  target: string;
  scanType: OsintScanType;
  status: OsintScanStatus;
  progress: number;
  leaksFound: number;
  exposuresFound: number;
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const OsintScanJobSchema = new Schema<IOsintScanJob>(
  {
    target: { type: String, required: true, index: true },
    scanType: {
      type: String,
      enum: ['DOMAIN', 'COMPANY', 'KEYWORD', 'DARKWEB'],
      default: 'DOMAIN',
    },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    leaksFound: { type: Number, default: 0 },
    exposuresFound: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    error: { type: String, default: null },
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, collection: 'osint_scan_jobs' },
);

OsintScanJobSchema.index({ tenantId: 1, createdAt: -1 });

export const OsintScanJob = mongoose.model<IOsintScanJob>('OsintScanJob', OsintScanJobSchema);
