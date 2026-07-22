import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'ALERT' | 'WARNING' | 'INFO' | 'CRITICAL';
export type EventType =
  | 'THREAT_DETECTED'
  | 'VULNERABILITY_FOUND'
  | 'SCAN_COMPLETED'
  | 'DATA_BREACH_DETECTED'
  | 'BRAND_EXPOSURE_FOUND'
  | 'OSINT_LEAK_FOUND'
  | 'TEST';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  eventType: EventType;
  source: string;
  sourceId: string | null;
  read: boolean;
  readAt: Date | null;
  emailSent: boolean;
  emailSentAt: Date | null;
  tenantId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['ALERT', 'WARNING', 'INFO', 'CRITICAL'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'THREAT_DETECTED', 'VULNERABILITY_FOUND', 'SCAN_COMPLETED',
        'DATA_BREACH_DETECTED', 'BRAND_EXPOSURE_FOUND', 'OSINT_LEAK_FOUND', 'TEST',
      ],
      required: true,
      index: true,
    },
    source: { type: String, required: true, index: true },
    sourceId: { type: String, default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },
    tenantId: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: 'notifications' },
);

NotificationSchema.index({ tenantId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
