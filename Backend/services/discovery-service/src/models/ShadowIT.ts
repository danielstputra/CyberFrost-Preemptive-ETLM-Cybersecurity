import mongoose, { Schema, Document } from 'mongoose';

export interface IShadowIT extends Document {
  assetType: 'CLOUD_SERVICE' | 'SAAS' | 'UNKNOWN_SERVICE' | 'SHADOW_API' | 'UNMANAGED_DEVICE' | 'OTHER';
  name: string;
  domain: string;
  ipAddress: string;
  detectedBy: 'CERTIFICATE_LOG' | 'DNS_SCAN' | 'PORT_SCAN' | 'USER_REPORT' | 'INTEGRATION';
  firstSeen: Date;
  lastSeen: Date;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  misconfigurations: string[];
  notes: string;
  isManaged: boolean;
  owner: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShadowITSchema = new Schema<IShadowIT>(
  {
    assetType: { type: String, enum: ['CLOUD_SERVICE', 'SAAS', 'UNKNOWN_SERVICE', 'SHADOW_API', 'UNMANAGED_DEVICE', 'OTHER'], required: true },
    name: { type: String, required: true },
    domain: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    detectedBy: { type: String, enum: ['CERTIFICATE_LOG', 'DNS_SCAN', 'PORT_SCAN', 'USER_REPORT', 'INTEGRATION'], default: 'DNS_SCAN' },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    misconfigurations: [{ type: String }],
    notes: { type: String, default: '' },
    isManaged: { type: Boolean, default: false },
    owner: { type: String, default: '' },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'shadow_it_assets' },
);

ShadowITSchema.index({ tenantId: 1, riskLevel: 1 });

export const ShadowIT = mongoose.model<IShadowIT>('ShadowIT', ShadowITSchema);
