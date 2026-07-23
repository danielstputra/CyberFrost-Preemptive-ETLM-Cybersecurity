import mongoose, { Schema, Document } from 'mongoose';

export interface IHuntingRule extends Document {
  tenantId: string;
  ruleId: string;
  title: string;
  description: string;
  category: 'DISCOVERY' | 'PERSISTENCE' | 'DEFENSE_EVASION' | 'EXECUTION' | 'LATERAL_MOVEMENT' | 'EXFILTRATION' | 'C2' | 'CREDENTIAL_ACCESS';
  mitreAttackId: string;
  sigmaRule: string;
  logSource: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  lastMatched: Date | null;
  matchCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const HuntingRuleSchema = new Schema<IHuntingRule>({
  tenantId: { type: String, required: true, index: true },
  ruleId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: ['DISCOVERY', 'PERSISTENCE', 'DEFENSE_EVASION', 'EXECUTION', 'LATERAL_MOVEMENT', 'EXFILTRATION', 'C2', 'CREDENTIAL_ACCESS'], required: true },
  mitreAttackId: { type: String, default: '' },
  sigmaRule: { type: String, default: '' },
  logSource: { type: String, default: '' },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'DRAFT'], default: 'DRAFT' },
  lastMatched: { type: Date, default: null },
  matchCount: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

HuntingRuleSchema.index({ tenantId: 1, category: 1 });
export const HuntingRule = mongoose.model<IHuntingRule>('HuntingRule', HuntingRuleSchema);
