import mongoose, { Schema, Document } from 'mongoose';

export type RiskStatus = 'SAFE' | 'LEAKED' | 'MONITORING';

export interface IExecutiveProfile extends Document {
  name: string;
  position: string;
  email: string;
  phone: string;
  riskStatus: RiskStatus;
  lastCheckedAt: Date | null;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutiveProfileSchema = new Schema<IExecutiveProfile>(
  {
    name: { type: String, required: true },
    position: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    riskStatus: {
      type: String,
      enum: ['SAFE', 'LEAKED', 'MONITORING'],
      default: 'SAFE',
      index: true,
    },
    lastCheckedAt: { type: Date, default: null },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'executive_profiles' },
);

ExecutiveProfileSchema.index({ tenantId: 1, riskStatus: 1 });
ExecutiveProfileSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const ExecutiveProfile = mongoose.model<IExecutiveProfile>(
  'ExecutiveProfile',
  ExecutiveProfileSchema,
);
