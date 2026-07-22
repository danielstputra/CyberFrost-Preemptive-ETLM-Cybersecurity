import mongoose, { Schema, Document } from 'mongoose';

export type TicketProvider = 'JIRA' | 'SERVICENOW' | 'PAGERDUTY' | 'OPSGENIE' | 'MANUAL' | 'OTHER';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface IIncidentTicket extends Document {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  provider: TicketProvider;
  status: TicketStatus;
  ticketRef: string;
  ticketUrl: string | null;
  sourceEvent: string;
  sourceEventId: string | null;
  autoCreated: boolean;
  assignedTo: string | null;
  resolution: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentTicketSchema = new Schema<IIncidentTicket>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    provider: { type: String, enum: ['JIRA', 'SERVICENOW', 'PAGERDUTY', 'OPSGENIE', 'MANUAL', 'OTHER'], default: 'MANUAL' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'], default: 'OPEN' },
    ticketRef: { type: String, default: '' },
    ticketUrl: { type: String, default: null },
    sourceEvent: { type: String, default: '' },
    sourceEventId: { type: String, default: null },
    autoCreated: { type: Boolean, default: false },
    assignedTo: { type: String, default: null },
    resolution: { type: String, default: null },
    tenantId: { type: String, required: true, index: true },
    createdBy: { type: String, default: 'system' },
  },
  { timestamps: true, collection: 'incident_tickets' },
);

IncidentTicketSchema.index({ tenantId: 1, status: 1 });
IncidentTicketSchema.index({ tenantId: 1, createdAt: -1 });

export const IncidentTicket = mongoose.model<IIncidentTicket>('IncidentTicket', IncidentTicketSchema);
