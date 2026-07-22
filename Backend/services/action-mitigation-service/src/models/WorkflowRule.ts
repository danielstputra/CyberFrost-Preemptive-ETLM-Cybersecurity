import mongoose, { Schema, Document } from 'mongoose';

export type TriggerEvent = 'THREAT_DETECTED' | 'VULNERABILITY_FOUND' | 'DATA_BREACH_DETECTED' | 'SCAN_COMPLETED' | 'MITIGATION_CREATED';

export interface IWorkflowRule extends Document {
  name: string;
  description: string;
  triggerEvent: TriggerEvent;
  severityFilter: string[];
  actions: Array<{
    type: 'CREATE_TICKET' | 'SEND_WEBHOOK' | 'SEND_EMAIL' | 'BLOCK_IP' | 'NOTIFY_SLACK';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowRuleSchema = new Schema<IWorkflowRule>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    triggerEvent: { type: String, enum: ['THREAT_DETECTED', 'VULNERABILITY_FOUND', 'DATA_BREACH_DETECTED', 'SCAN_COMPLETED', 'MITIGATION_CREATED'], required: true },
    severityFilter: [{ type: String }],
    actions: [{
      type: { type: String, enum: ['CREATE_TICKET', 'SEND_WEBHOOK', 'SEND_EMAIL', 'BLOCK_IP', 'NOTIFY_SLACK'] },
      config: { type: Schema.Types.Mixed, default: {} },
    }],
    enabled: { type: Boolean, default: true },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'workflow_rules' },
);

export const WorkflowRule = mongoose.model<IWorkflowRule>('WorkflowRule', WorkflowRuleSchema);
