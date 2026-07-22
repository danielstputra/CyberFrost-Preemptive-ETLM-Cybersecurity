import mongoose, { Schema, Document } from 'mongoose';

export type MitigationType = 'BLOCK_IP' | 'BLOCK_DOMAIN' | 'BLOCK_URL' | 'WAF_RULE' | 'RATE_LIMIT' | 'OTHER';
export type FirewallProvider = 'CLOUDFLARE' | 'AWS_WAF' | 'AZURE_FIREWALL' | 'IPTABLES' | 'SIMULATED' | 'OTHER';
export type MitigationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'EXPIRED' | 'FAILED';

export interface IMitigationAction extends Document {
  targetIp: string;
  targetDomain: string;
  targetUrl: string;
  mitigationType: MitigationType;
  firewallProvider: FirewallProvider;
  status: MitigationStatus;
  ruleName: string;
  ruleId: string | null;
  description: string;
  sourceEvent: string;          // Event that triggered this (e.g. CRITICAL_THREAT_FOUND)
  sourceEventId: string | null; // Reference to the original event
  autoTriggered: boolean;       // true = triggered by worker, false = manual
  expiresAt: Date | null;
  responseData: Record<string, unknown> | null;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MitigationActionSchema = new Schema<IMitigationAction>(
  {
    targetIp: { type: String, default: '', index: true },
    targetDomain: { type: String, default: '', index: true },
    targetUrl: { type: String, default: '' },
    mitigationType: {
      type: String,
      enum: ['BLOCK_IP', 'BLOCK_DOMAIN', 'BLOCK_URL', 'WAF_RULE', 'RATE_LIMIT', 'OTHER'],
      required: true,
    },
    firewallProvider: {
      type: String,
      enum: ['CLOUDFLARE', 'AWS_WAF', 'AZURE_FIREWALL', 'IPTABLES', 'SIMULATED', 'OTHER'],
      default: 'SIMULATED',
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'ACTIVE', 'EXPIRED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    ruleName: { type: String, default: '' },
    ruleId: { type: String, default: null },
    description: { type: String, default: '' },
    sourceEvent: { type: String, default: '' },
    sourceEventId: { type: String, default: null },
    autoTriggered: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    responseData: { type: Schema.Types.Mixed, default: null },
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true, collection: 'mitigation_actions' },
);

MitigationActionSchema.index({ tenantId: 1, status: 1 });
MitigationActionSchema.index({ tenantId: 1, createdAt: -1 });
MitigationActionSchema.index({ targetIp: 1, tenantId: 1 });

export const MitigationAction = mongoose.model<IMitigationAction>('MitigationAction', MitigationActionSchema);
