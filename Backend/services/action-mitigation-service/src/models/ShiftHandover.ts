import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftHandover extends Document {
  tenantId: string;
  shiftDate: Date;
  shiftType: 'PAGI' | 'SIANG' | 'MALAM' | 'CUSTOM';
  officerOutgoing: string;
  officerIncoming: string;
  notes: string;
  ongoingIssues: string;
  pendingTakedowns: number;
  criticalAlerts: number;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
}

const ShiftHandoverSchema = new Schema<IShiftHandover>({
  tenantId: { type: String, required: true, index: true },
  shiftDate: { type: Date, required: true, default: Date.now },
  shiftType: { type: String, enum: ['PAGI', 'SIANG', 'MALAM', 'CUSTOM'], default: 'PAGI' },
  officerOutgoing: { type: String, required: true },
  officerIncoming: { type: String, required: true },
  notes: { type: String, default: '' },
  ongoingIssues: { type: String, default: '' },
  pendingTakedowns: { type: Number, default: 0 },
  criticalAlerts: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ShiftHandoverSchema.index({ tenantId: 1, shiftDate: -1 });
export const ShiftHandover = mongoose.model<IShiftHandover>('ShiftHandover', ShiftHandoverSchema);
