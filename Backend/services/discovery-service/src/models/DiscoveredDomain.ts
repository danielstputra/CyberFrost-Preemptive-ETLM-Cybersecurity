import mongoose, { Schema, Document } from 'mongoose';

// ──────────────────────────────────────
//  Types
// ──────────────────────────────────────

export interface IPortInfo {
  port: number;
  service: string;
  protocol: 'TCP' | 'UDP';
  isOpen: boolean;
}

export interface ITechnology {
  name: string;
  category: 'WEB_SERVER' | 'FRAMEWORK' | 'CDN' | 'ANALYTICS' | 'OTHER';
}

export interface IDiscoveredDomain extends Document {
  domain: string;           // the subdomain, e.g. "www.example.com"
  parentDomain: string;     // "example.com"
  ipAddress: string | null;
  ports: IPortInfo[];
  technologies: ITechnology[];
  isActive: boolean;
  lastSeenAt: Date;
  tenantId: string;
  scanJobId: string;
  ssl: {
    issuer: string | null;
    validFrom: Date | null;
    validTo: Date | null;
  } | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────
//  Schemas
// ──────────────────────────────────────

const PortInfoSchema = new Schema<IPortInfo>(
  {
    port: { type: Number, required: true },
    service: { type: String, required: true },
    protocol: { type: String, enum: ['TCP', 'UDP'], default: 'TCP' },
    isOpen: { type: Boolean, default: true },
  },
  { _id: false },
);

const TechnologySchema = new Schema<ITechnology>(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['WEB_SERVER', 'FRAMEWORK', 'CDN', 'ANALYTICS', 'OTHER'],
      default: 'OTHER',
    },
  },
  { _id: false },
);

const DiscoveredDomainSchema = new Schema<IDiscoveredDomain>(
  {
    domain: { type: String, required: true },
    parentDomain: { type: String, required: true, index: true },
    ipAddress: { type: String, default: null },
    ports: { type: [PortInfoSchema], default: [] },
    technologies: { type: [TechnologySchema], default: [] },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    tenantId: { type: String, required: true, index: true },
    scanJobId: { type: String, required: true, index: true },
    ssl: {
      type: { issuer: String, validFrom: Date, validTo: Date },
      default: null,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'discovered_domains',
  },
);

// Unique constraint: one domain per tenant
DiscoveredDomainSchema.index({ domain: 1, tenantId: 1 }, { unique: true });
// Index for deduplication lookups
DiscoveredDomainSchema.index({ scanJobId: 1, domain: 1 });

export const DiscoveredDomain = mongoose.model<IDiscoveredDomain>(
  'DiscoveredDomain',
  DiscoveredDomainSchema,
);
