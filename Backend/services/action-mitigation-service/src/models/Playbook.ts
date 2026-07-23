import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaybookStep {
  stepId: string;
  name: string;
  type: 'TAKEDOWN' | 'BLOCK' | 'NOTIFY' | 'ESCALATE' | 'WEBHOOK' | 'EMAIL' | 'TICKET' | 'WAIT' | 'APPROVAL';
  config: Record<string, unknown>;
  timeout: number;
  order: number;
}

export interface IPlaybook extends Document {
  tenantId: string;
  name: string;
  description: string;
  trigger: 'THREAT_DETECTED' | 'VULNERABILITY_FOUND' | 'INCIDENT_CREATED' | 'MANUAL' | 'SCHEDULED';
  severity: string[];
  steps: IPlaybookStep[];
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  lastRun: Date | null;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlaybookStepSchema = new Schema<IPlaybookStep>({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['TAKEDOWN', 'BLOCK', 'NOTIFY', 'ESCALATE', 'WEBHOOK', 'EMAIL', 'TICKET', 'WAIT', 'APPROVAL'], required: true },
  config: { type: Schema.Types.Mixed, default: {} },
  timeout: { type: Number, default: 300 },
  order: { type: Number, required: true },
});

const PlaybookSchema = new Schema<IPlaybook>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  trigger: { type: String, enum: ['THREAT_DETECTED', 'VULNERABILITY_FOUND', 'INCIDENT_CREATED', 'MANUAL', 'SCHEDULED'], required: true },
  severity: [{ type: String }],
  steps: [PlaybookStepSchema],
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'DRAFT'], default: 'DRAFT' },
  lastRun: { type: Date, default: null },
  runCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Playbook = mongoose.model<IPlaybook>('Playbook', PlaybookSchema);
