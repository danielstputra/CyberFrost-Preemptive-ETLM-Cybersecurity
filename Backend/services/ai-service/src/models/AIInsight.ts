import mongoose, { Schema, Document } from 'mongoose';

export type InsightType = 'THREAT_SUMMARY' | 'ATTACK_SCENARIO' | 'EARLY_WARNING' | 'RISK_ANALYSIS' | 'RECOMMENDATION' | 'RULE_GENERATION';
export type InsightSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IAIInsight extends Document {
  title: string;
  summary: string;
  fullAnalysis: string;
  insightType: InsightType;
  severity: InsightSeverity;
  sourceService: string;
  sourceEventId: string | null;
  sourceData: Record<string, unknown>;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  tags: string[];
  applicableMitreAttackIds: string[];
  recommendations: string[];
  processed: boolean;
  dismissed: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema = new Schema<IAIInsight>(
  {
    title: { type: String, required: true },
    summary: { type: String, required: true },
    fullAnalysis: { type: String, default: '' },
    insightType: {
      type: String,
      enum: ['THREAT_SUMMARY', 'ATTACK_SCENARIO', 'EARLY_WARNING', 'RISK_ANALYSIS', 'RECOMMENDATION', 'RULE_GENERATION'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    sourceService: { type: String, default: '', index: true },
    sourceEventId: { type: String, default: null },
    sourceData: { type: Schema.Types.Mixed, default: {} },
    modelUsed: { type: String, default: 'openai/gpt-4' },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    tags: [{ type: String }],
    applicableMitreAttackIds: [{ type: String }],
    recommendations: [{ type: String }],
    processed: { type: Boolean, default: false },
    dismissed: { type: Boolean, default: false },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'ai_insights' },
);

AIInsightSchema.index({ tenantId: 1, createdAt: -1 });
AIInsightSchema.index({ tenantId: 1, insightType: 1 });

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
