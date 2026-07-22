import mongoose, { Schema, Document } from 'mongoose';

export type LeakSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type LeakStatus = 'NEW' | 'VERIFIED' | 'FALSE_POSITIVE' | 'REMEDIATED';

export interface IDarkWebLeak extends Document {
  title: string;
  source: string;
  sourceUrl: string;
  domain: string;
  leakType: 'CREDENTIAL_DUMP' | 'SOURCE_CODE' | 'INTERNAL_DOC' | 'CUSTOMER_DATA' | 'EMPLOYEE_DATA' | 'OTHER';
  content: string;
  snippet: string;
  severity: LeakSeverity;
  status: LeakStatus;
  leakedCredentials: boolean;
  emailsFound: string[];
  passwordsFound: boolean;
  emailsInvolved: number;
  discoveredAt: Date;
  osintJobId: string;
  tenantId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DarkWebLeakSchema = new Schema<IDarkWebLeak>(
  {
    title: { type: String, required: true },
    source: { type: String, required: true, index: true },
    sourceUrl: { type: String, default: '' },
    domain: { type: String, required: true, index: true },
    leakType: {
      type: String,
      enum: ['CREDENTIAL_DUMP', 'SOURCE_CODE', 'INTERNAL_DOC', 'CUSTOMER_DATA', 'EMPLOYEE_DATA', 'OTHER'],
      required: true,
    },
    content: { type: String, default: '' },
    snippet: { type: String, default: '' },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'VERIFIED', 'FALSE_POSITIVE', 'REMEDIATED'],
      default: 'NEW',
      index: true,
    },
    leakedCredentials: { type: Boolean, default: false },
    emailsFound: [{ type: String }],
    passwordsFound: { type: Boolean, default: false },
    emailsInvolved: { type: Number, default: 0 },
    discoveredAt: { type: Date, default: Date.now },
    osintJobId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'dark_web_leaks' },
);

DarkWebLeakSchema.index({ tenantId: 1, severity: 1, discoveredAt: -1 });

export const DarkWebLeak = mongoose.model<IDarkWebLeak>('DarkWebLeak', DarkWebLeakSchema);
