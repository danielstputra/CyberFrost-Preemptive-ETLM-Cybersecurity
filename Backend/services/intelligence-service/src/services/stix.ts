/**
 * STIX 2.1 Parser & Exporter
 * ===========================
 * Parse external STIX bundles → internal IOC format
 * Export internal IOCs → STIX 2.1 bundle
 */

import { v4 as uuidv4 } from 'uuid';
import type { IIOC, IOCTypes } from '../models/IOC';

interface StixIndicator {
  type: 'indicator';
  id: string;
  name: string;
  description: string;
  pattern: string;
  pattern_type: string;
  valid_from: string;
  valid_until: string;
  labels: string[];
  confidence: number;
}

interface StixBundle {
  type: 'bundle';
  id: string;
  objects: StixIndicator[];
}

// ── STIX type → Internal IOC type mapping ──
const STIX_TO_IOC: Record<string, IOCTypes> = {
  'ipv4-addr': 'IP',
  'ipv6-addr': 'IP',
  'domain-name': 'DOMAIN',
  'url': 'URL',
  'file:hashes.MD5': 'MD5',
  'file:hashes.SHA-1': 'SHA1',
  'file:hashes.SHA-256': 'SHA256',
  'email-addr': 'EMAIL',
  'mutex': 'MUTEX',
};

// ──────────────────────────────────────
//  PARSE: External STIX → Internal IOC
// ──────────────────────────────────────

export function parseStixBundle(bundle: StixBundle, tenantId: string): Partial<IIOC>[] {
  if (!bundle?.objects) return [];

  return bundle.objects
    .filter(obj => obj.type === 'indicator')
    .map(obj => stixToIoc(obj, tenantId))
    .filter((ioc): ioc is Partial<IIOC> => ioc !== null);
}

function stixToIoc(stix: StixIndicator, tenantId: string): Partial<IIOC> | null {
  const extracted = extractIocValue(stix.pattern);
  if (!extracted) return null;

  const firstSeen = new Date(stix.valid_from);
  const expiresAt = stix.valid_until ? new Date(stix.valid_until) : new Date(Date.now() + 30 * 86400000);

  return {
    type: extracted.type,
    value: extracted.value,
    description: stix.description || stix.name || '',
    stixId: stix.id,
    stixPattern: stix.pattern,
    labels: stix.labels || [],
    confidence: stix.confidence || 50,
    source: 'MISP',
    sourceRef: stix.id,
    firstSeen,
    expiresAt,
    tenantId,
  };
}

function extractIocValue(pattern: string): { value: string; type: IOCTypes } | null {
  for (const [stixType, iocType] of Object.entries(STIX_TO_IOC)) {
    const escaped = stixType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}:value\\s*=\\s*'([^']+)'`);
    const match = pattern.match(regex);
    if (match) return { value: match[1], type: iocType };
  }
  return null;
}

// ──────────────────────────────────────
//  EXPORT: Internal IOC → STIX Bundle
// ──────────────────────────────────────

export function exportStixBundle(iocs: IIOC[]): StixBundle {
  return {
    type: 'bundle',
    id: `bundle--${uuidv4()}`,
    objects: iocs.map(iocToStix),
  };
}

function iocToStix(ioc: IIOC): StixIndicator {
  return {
    type: 'indicator',
    id: ioc.stixId || `indicator--${uuidv4()}`,
    name: `${ioc.type}: ${ioc.value}`,
    description: ioc.description || `Indicator of type ${ioc.type}`,
    pattern: ioc.stixPattern || patternFromIoc(ioc),
    pattern_type: 'stix',
    valid_from: ioc.firstSeen.toISOString(),
    valid_until: ioc.expiresAt.toISOString(),
    labels: ioc.labels.length > 0 ? ioc.labels : [ioc.threatType.toLowerCase()],
    confidence: ioc.confidence,
  };
}

function patternFromIoc(ioc: IIOC): string {
  const stixType = Object.entries(STIX_TO_IOC).find(([, v]) => v === ioc.type)?.[0];
  if (!stixType) return '';
  return `[${stixType}:value = '${ioc.value}']`;
}
