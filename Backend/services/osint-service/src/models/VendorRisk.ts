import mongoose, { Schema, Document } from 'mongoose';

export interface IVendorRisk extends Document {
  vendorId: mongoose.Types.ObjectId;
  vendorName: string;
  riskType: 'DATA_BREACH' | 'VULNERABILITY' | 'DARK_WEB' | 'COMPLIANCE' | 'REPUTATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  sourceUrl: string;
  discoveredAt: Date;
  resolvedAt: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorRiskSchema = new Schema<IVendorRisk>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    vendorName: { type: String, required: true },
    riskType: { type: String, enum: ['DATA_BREACH', 'VULNERABILITY', 'DARK_WEB', 'COMPLIANCE', 'REPUTATION'], required: true },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    discoveredAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'vendor_risks' },
);

VendorRiskSchema.index({ vendorId: 1, tenantId: 1 });

export const VendorRisk = mongoose.model<IVendorRisk>('VendorRisk', VendorRiskSchema);
