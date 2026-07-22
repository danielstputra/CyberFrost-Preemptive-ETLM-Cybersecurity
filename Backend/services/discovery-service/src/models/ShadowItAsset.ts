import mongoose, { Schema, Document } from 'mongoose';

export interface IShadowItAsset extends Document {
  domain: string;
  ipAddress: string;
  port: number;
  service: string;
  technology: string;
  isShadowIt: boolean;
  riskScore: number;
  detectedAt: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShadowItAssetSchema = new Schema<IShadowItAsset>(
  {
    domain: { type: String, required: true },
    ipAddress: { type: String, default: '' },
    port: { type: Number, required: true },
    service: { type: String, default: '' },
    technology: { type: String, default: '' },
    isShadowIt: { type: Boolean, default: false },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    detectedAt: { type: Date, default: Date.now },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'shadow_it_assets_v2' },
);

ShadowItAssetSchema.index({ tenantId: 1, domain: 1, port: 1 }, { unique: true });
ShadowItAssetSchema.index({ tenantId: 1, isShadowIt: 1 });
ShadowItAssetSchema.index({ tenantId: 1, riskScore: -1 });

export const ShadowItAsset = mongoose.model<IShadowItAsset>('ShadowItAsset', ShadowItAssetSchema);
