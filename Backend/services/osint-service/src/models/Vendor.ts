import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  domain: string;
  description: string;
  category: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
  contactEmail: string;
  lastAssessedAt: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true },
    domain: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'Technology' },
    riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'UNDER_REVIEW'], default: 'ACTIVE' },
    contactEmail: { type: String, default: '' },
    lastAssessedAt: { type: Date, default: null },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'vendors' },
);

VendorSchema.index({ domain: 1, tenantId: 1 }, { unique: true });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
