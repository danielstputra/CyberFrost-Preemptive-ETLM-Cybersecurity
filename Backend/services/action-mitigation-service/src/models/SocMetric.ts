import mongoose, { Schema, Document } from 'mongoose';

export interface ISocMetric extends Document {
  tenantId: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  date: Date;
  mttr: number;        // Mean Time to Resolve (minutes)
  mttc: number;        // Mean Time to Confirm (minutes)
  openIncidents: number;
  resolvedIncidents: number;
  slaBreaches: number;
  escalatedCount: number;
  criticalCount: number;
  createdAt: Date;
}

const SocMetricSchema = new Schema<ISocMetric>({
  tenantId: { type: String, required: true, index: true },
  period: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
  date: { type: Date, required: true },
  mttr: { type: Number, default: 0 },
  mttc: { type: Number, default: 0 },
  openIncidents: { type: Number, default: 0 },
  resolvedIncidents: { type: Number, default: 0 },
  slaBreaches: { type: Number, default: 0 },
  escalatedCount: { type: Number, default: 0 },
  criticalCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

SocMetricSchema.index({ tenantId: 1, period: 1, date: -1 });
export const SocMetric = mongoose.model<ISocMetric>('SocMetric', SocMetricSchema);
