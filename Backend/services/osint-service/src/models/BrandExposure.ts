import mongoose, { Schema, Document } from 'mongoose';

export type ExposureType = 'PHISHING' | 'TYPOSQUATTING' | 'IMPERSONATION' | 'LOOKALIKE' | 'SOCIAL_MEDIA' | 'MOBILE_APP';
export type ExposureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExposureStatus = 'NEW' | 'INVESTIGATING' | 'MITIGATED' | 'FALSE_POSITIVE';

export interface IBrandExposure extends Document {
  brandName: string;
  domain: string;
  exposureType: ExposureType;
  severity: ExposureSeverity;
  status: ExposureStatus;
  url: string;
  ipAddress: string | null;
  screenshot: string | null;
  description: string;
  registrantName: string | null;
  registrantEmail: string | null;
  registeredAt: Date | null;
  hostProvider: string | null;
  discoveredAt: Date;
  osintJobId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandExposureSchema = new Schema<IBrandExposure>(
  {
    brandName: { type: String, required: true, index: true },
    domain: { type: String, required: true, index: true },
    exposureType: {
      type: String,
      enum: ['PHISHING', 'TYPOSQUATTING', 'IMPERSONATION', 'LOOKALIKE', 'SOCIAL_MEDIA', 'MOBILE_APP'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'INVESTIGATING', 'MITIGATED', 'FALSE_POSITIVE'],
      default: 'NEW',
      index: true,
    },
    url: { type: String, required: true },
    ipAddress: { type: String, default: null },
    screenshot: { type: String, default: null },
    description: { type: String, default: '' },
    registrantName: { type: String, default: null },
    registrantEmail: { type: String, default: null },
    registeredAt: { type: Date, default: null },
    hostProvider: { type: String, default: null },
    discoveredAt: { type: Date, default: Date.now },
    osintJobId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'brand_exposures' },
);

BrandExposureSchema.index({ tenantId: 1, severity: 1 });
BrandExposureSchema.index({ tenantId: 1, exposureType: 1 });
BrandExposureSchema.index({ domain: 1, tenantId: 1 }, { unique: true });

export const BrandExposure = mongoose.model<IBrandExposure>('BrandExposure', BrandExposureSchema);
