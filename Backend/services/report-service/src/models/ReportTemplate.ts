import mongoose, { Schema, Document } from 'mongoose';

export interface IReportTemplate extends Document {
  tenantId: string;
  name: string;
  type: 'EXECUTIVE_SUMMARY' | 'COMPLIANCE' | 'VULNERABILITY' | 'THREAT_INTEL' | 'CUSTOM';
  config: {
    sections: string[];
    dateRange: string;
    formats: string[];
    includeCharts: boolean;
    recipients: string[];
  };
  schedule: {
    enabled: boolean;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  } | null;
  lastGenerated: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

const ReportTemplateSchema = new Schema<IReportTemplate>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['EXECUTIVE_SUMMARY', 'COMPLIANCE', 'VULNERABILITY', 'THREAT_INTEL', 'CUSTOM'], required: true },
  config: {
    sections: [{ type: String }],
    dateRange: { type: String, default: 'LAST_30_DAYS' },
    formats: [{ type: String }],
    includeCharts: { type: Boolean, default: true },
    recipients: [{ type: String }],
  },
  schedule: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'] },
    dayOfWeek: { type: Number },
    dayOfMonth: { type: Number },
    time: { type: String, default: '08:00' },
  },
  lastGenerated: { type: Date, default: null },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
});

ReportTemplateSchema.index({ tenantId: 1, type: 1 });
export const ReportTemplate = mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);
