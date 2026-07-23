import mongoose, { Schema, Document } from 'mongoose';

export interface IEscalationRule extends Document {
  tenantId: string;
  name: string;
  condition: {
    field: string;
    operator: 'EQ' | 'GT' | 'GTE' | 'IN' | 'CONTAINS';
    value: string;
  }[];
  timeoutMinutes: number;
  escalateTo: string[];
  notifyChannels: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

const EscalationRuleSchema = new Schema<IEscalationRule>({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  condition: [{
    field: { type: String, required: true },
    operator: { type: String, enum: ['EQ', 'GT', 'GTE', 'IN', 'CONTAINS'], required: true },
    value: { type: String, required: true },
  }],
  timeoutMinutes: { type: Number, default: 60 },
  escalateTo: [{ type: String }],
  notifyChannels: [{ type: String }],
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
});

export const EscalationRule = mongoose.model<IEscalationRule>('EscalationRule', EscalationRuleSchema);
