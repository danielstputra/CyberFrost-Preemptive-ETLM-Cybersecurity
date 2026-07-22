import mongoose, { Schema, Document } from 'mongoose';

export interface IThreatActor extends Document {
  name: string;
  aliases: string[];
  country: string;
  motivation: string;
  targetIndustries: string[];
  description: string;
  capabilities: string[];
  targetedSectors: string[];
  targetedRegions: string[];
  mitreTechniques: string[];
  mitreAttackIds: string[];
  firstSeen: Date;
  lastSeen: Date;
  isActive: boolean;
  active: boolean;
  associatedCampaigns: string[];
  associatedMalware: string[];
  iocs: Array<{ type: string; value: string }>;
  source: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ThreatActorSchema = new Schema<IThreatActor>(
  {
    name: { type: String, required: true, unique: true },
    aliases: [{ type: String }],
    country: { type: String, default: '' },
    motivation: { type: String, default: '' },
    targetIndustries: [{ type: String }],
    description: { type: String, default: '' },
    capabilities: [{ type: String }],
    targetedSectors: [{ type: String }],
    targetedRegions: [{ type: String }],
    mitreTechniques: [{ type: String }],
    mitreAttackIds: [{ type: String }],
    firstSeen: { type: Date },
    lastSeen: { type: Date },
    isActive: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    associatedCampaigns: [{ type: String }],
    associatedMalware: [{ type: String }],
    iocs: [{ type: { type: String }, value: { type: String } }],
    source: { type: String, default: 'CISA' },
    tenantId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'threat_actors' },
);

ThreatActorSchema.index({ name: 1, tenantId: 1 }, { unique: true });
ThreatActorSchema.index({ tenantId: 1, targetIndustries: 1 });

export const ThreatActor = mongoose.model<IThreatActor>('ThreatActor', ThreatActorSchema);
