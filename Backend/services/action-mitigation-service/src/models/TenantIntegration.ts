import mongoose, { Schema, Document } from 'mongoose';

export type IntegrationProvider = 'JIRA' | 'SERVICENOW' | 'SPLUNK' | 'CUSTOM_WEBHOOK' | 'META_BRP';

export interface ITenantIntegration extends Document {
  name: string;
  provider: IntegrationProvider;
  config: {
    webhookUrl: string;
    apiKey: string;
  };
  enabled: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TenantIntegrationSchema = new Schema<ITenantIntegration>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
    },
    provider: {
      type: String,
      enum: ['JIRA', 'SERVICENOW', 'SPLUNK', 'CUSTOM_WEBHOOK', 'META_BRP'],
      required: true,
      index: true,
    },
    config: {
      webhookUrl: { type: String, required: true },
      apiKey: { type: String, default: '' },
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'tenant_integrations',
  },
);

TenantIntegrationSchema.index({ tenantId: 1, provider: 1 });
TenantIntegrationSchema.index({ tenantId: 1, enabled: 1 });

export const TenantIntegration = mongoose.model<ITenantIntegration>(
  'TenantIntegration',
  TenantIntegrationSchema,
);
