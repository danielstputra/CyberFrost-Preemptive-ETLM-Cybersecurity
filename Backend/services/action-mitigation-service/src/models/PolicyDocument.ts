import mongoose, { Schema, Document } from 'mongoose';

export interface IPolicyDocument extends Document {
  tenantId: string;
  title: string;
  category: 'SECURITY' | 'PRIVACY' | 'COMPLIANCE' | 'ACCEPTABLE_USE' | 'INCIDENT_RESPONSE' | 'DATA_PROTECTION' | 'ACCESS_CONTROL';
  content: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  approvedBy: string;
  effectiveDate: Date;
  reviewDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PolicyDocumentSchema = new Schema<IPolicyDocument>({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['SECURITY', 'PRIVACY', 'COMPLIANCE', 'ACCEPTABLE_USE', 'INCIDENT_RESPONSE', 'DATA_PROTECTION', 'ACCESS_CONTROL'], required: true },
  content: { type: String, default: '' },
  version: { type: String, default: '1.0' },
  status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT' },
  approvedBy: { type: String, default: '' },
  effectiveDate: { type: Date, default: Date.now },
  reviewDate: { type: Date, default: () => new Date(Date.now() + 365 * 86400000) },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const PolicyDocument = mongoose.model<IPolicyDocument>('PolicyDocument', PolicyDocumentSchema);
