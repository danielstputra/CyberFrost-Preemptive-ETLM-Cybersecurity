import mongoose, { Schema, Document } from 'mongoose';

export type TakedownStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'ESCALATED_VIP' | 'SUCCESSFUL' | 'REJECTED';
export type TakedownPlatform = 'GOOGLE_SAFE_BROWSING' | 'PHISHTANK' | 'ABUSE_EMAIL' | 'MANUAL' | 'KOMINFO_TRUST_POSITIF';
export type TargetType = 'DOMAIN' | 'SOCIAL_MEDIA';
export type SocialPlatform = 'FACEBOOK' | 'TWITTER' | 'LINKEDIN' | 'INSTAGRAM' | 'TIKTOK' | 'OTHER';

export interface IAnalystLog {
  analystId: string;
  analystName: string;
  timestamp: Date;
  note: string;
  previousStatus: string;
  newStatus: string;
}

export interface ITakedownRequest extends Document {
  targetUrl: string;
  domain: string;
  threatType: string;
  targetType: TargetType;
  platform: TakedownPlatform;
  socialPlatform?: SocialPlatform;
  profileUrl?: string;
  impersonatedEntity?: string;
  evidenceFiles?: string[];
  status: TakedownStatus;
  evidence: string;
  draftContent: string;
  submittedTo: string;
  submittedAt: Date | null;
  responseRef: string | null;
  responseData: Record<string, unknown> | null;
  /** Reference ID dari Kominfo Trust+ Positif setelah dispatch */
  kominfoDispatchRef: string | null;
  notes: string;
  analystLogs: IAnalystLog[];
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TakedownRequestSchema = new Schema<ITakedownRequest>(
  {
    targetUrl: { type: String, required: true },
    domain: { type: String, required: true, index: true },
    targetType: { type: String, enum: ['DOMAIN', 'SOCIAL_MEDIA'], default: 'DOMAIN' },
    threatType: { type: String, required: true, default: 'PHISHING' },
    platform: {
      type: String,
      enum: ['GOOGLE_SAFE_BROWSING', 'PHISHTANK', 'ABUSE_EMAIL', 'MANUAL', 'KOMINFO_TRUST_POSITIF'],
      default: 'MANUAL',
    },
    socialPlatform: { type: String, enum: ['FACEBOOK', 'TWITTER', 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'OTHER'] },
    profileUrl: { type: String },
    impersonatedEntity: { type: String },
    evidenceFiles: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'ESCALATED_VIP', 'SUCCESSFUL', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    draftContent: { type: String, default: '' },
    evidence: { type: String, default: '' },
    submittedTo: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    responseRef: { type: String, default: null },
    responseData: { type: Schema.Types.Mixed, default: null },
    kominfoDispatchRef: { type: String, default: null },
    notes: { type: String, default: '' },
    analystLogs: [{
      analystId: { type: String, required: true },
      analystName: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String, default: '' },
      previousStatus: { type: String, required: true },
      newStatus: { type: String, required: true },
    }],
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, collection: 'takedown_requests' },
);

// Cap analystLogs di 200 entry untuk mencegah document > 16MB
const MAX_ANALYST_LOGS = 200;
TakedownRequestSchema.pre('findOneAndUpdate', function (this: any) {
  const update = this.getUpdate();
  if (update?.$push?.analystLogs) {
    // Hanya simpan MAX entry terakhir
    this._analystLogsPush = true;
  }
});
TakedownRequestSchema.post('findOneAndUpdate', async function (doc: any) {
  if (doc && (this as any)._analystLogsPush && doc.analystLogs?.length > MAX_ANALYST_LOGS) {
    const excess = doc.analystLogs.length - MAX_ANALYST_LOGS;
    doc.analystLogs.splice(0, excess);
    await doc.save();
  }
});

TakedownRequestSchema.index({ tenantId: 1, status: 1 });
TakedownRequestSchema.index({ tenantId: 1, createdAt: -1 });
// Hapus dokumen REJECTED/SUCCESSFUL setelah 90 hari
TakedownRequestSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600, partialFilterExpression: { status: { $in: ['REJECTED', 'SUCCESSFUL'] } } });

export const TakedownRequest = mongoose.model<ITakedownRequest>('TakedownRequest', TakedownRequestSchema);
