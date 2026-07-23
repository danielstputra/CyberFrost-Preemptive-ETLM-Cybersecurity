import mongoose, { Schema, Document } from 'mongoose';

export interface IControl extends Document {
  controlId: string;
  title: string;
  description: string;
  category: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface IComplianceFramework extends Document {
  framework: string;
  version: string;
  controls: IControl[];
  createdAt: Date;
}

const ControlSchema = new Schema<IControl>({
  controlId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: '' },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
});

const ComplianceFrameworkSchema = new Schema<IComplianceFramework>({
  framework: { type: String, required: true },
  version: { type: String, default: '1.0' },
  controls: [ControlSchema],
  createdAt: { type: Date, default: Date.now },
});

export const ComplianceFramework = mongoose.model<IComplianceFramework>('ComplianceFramework', ComplianceFrameworkSchema);
