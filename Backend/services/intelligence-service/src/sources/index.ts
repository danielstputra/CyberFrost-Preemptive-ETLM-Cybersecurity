/**
 * External IOC Source Connectors
 * ==============================
 * Mengumpulkan IOC dari berbagai sumber terbuka.
 *
 * Supported sources:
 *   - MISP (Malware Information Sharing Platform)
 *   - ThreatFox (Abuse.ch)
 *   - URLHaus (Abuse.ch)
 */

import axios from 'axios';
import type { IIOC, IOCTypes, ThreatType, IOCSource } from '../models/IOC';

interface RawIoc {
  type: IOCTypes;
  value: string;
  threatType: ThreatType;
  source: IOCSource;
  sourceRef: string;
  description?: string;
  confidence?: number;
  firstSeen?: Date;
  labels?: string[];
}

// ──────────────────────────────────────
//  MISP Feed
// ──────────────────────────────────────

export async function fetchMispFeed(): Promise<RawIoc[]> {
  const url = process.env.MISP_URL;
  const apiKey = process.env.MISP_API_KEY;
  if (!url || !apiKey) {
    console.warn('[IOC] MISP not configured (MISP_URL / MISP_API_KEY)');
    return [];
  }

  try {
    const res = await axios.post(`${url}/events/restSearch`, {
      returnFormat: 'json',
      limit: 100,
      to_ids: 1,
      last: '30m',
    }, {
      headers: { Authorization: apiKey, Accept: 'application/json' },
      timeout: 30000,
    });

    return parseMispResponse(res.data);
  } catch (err) {
    console.error('[IOC] MISP fetch error:', (err as Error).message);
    return [];
  }
}

function parseMispResponse(data: any): RawIoc[] {
  const results: RawIoc[] = [];
  const events = data?.response?.Event || [];
  for (const event of events) {
    const attrs = event?.Attribute || [];
    for (const attr of attrs) {
      const ioc = mispAttrToIoc(attr);
      if (ioc) results.push(ioc);
    }
  }
  return results;
}

function mispAttrToIoc(attr: any): RawIoc | null {
  const typeMap: Record<string, IOCTypes> = {
    'ip-dst': 'IP', 'ip-src': 'IP',
    'domain': 'DOMAIN', 'hostname': 'DOMAIN',
    'url': 'URL',
    'md5': 'MD5', 'sha1': 'SHA1', 'sha256': 'SHA256',
    'email': 'EMAIL', 'email-src': 'EMAIL',
    'mutex': 'MUTEX',
  };

  const type = typeMap[attr.type];
  if (!type || !attr.value) return null;

  return {
    type,
    value: attr.value,
    threatType: 'MALWARE',
    source: 'MISP',
    sourceRef: `${attr.event_id || 'unknown'}/${attr.id || ''}`,
    description: attr.comment || attr.category || '',
    confidence: attr.to_ids ? 75 : 40,
    firstSeen: attr.first_seen ? new Date(attr.first_seen) : undefined,
    labels: [attr.category || 'unknown'].filter(Boolean),
  };
}

// ──────────────────────────────────────
//  ThreatFox Feed (Abuse.ch)
// ──────────────────────────────────────

export async function fetchThreatFox(): Promise<RawIoc[]> {
  try {
    const res = await axios.post('https://threatfox-api.abuse.ch/api/v1/', {
      query: 'get_iocs',
      days: 1,
    }, { timeout: 15000 });

    const data = res.data?.data;
    if (!Array.isArray(data)) return [];

    return data.map((i: any) => ({
      type: iocTypeFromThreatFox(i.ioc_type || ''),
      value: i.ioc || '',
      threatType: threatTypeFromAbuse(i.threat_type || ''),
      source: 'THREATFOX' as IOCSource,
      sourceRef: `https://threatfox.abuse.ch/ioc/${i.id || ''}`,
      description: i.malware_printable || '',
      confidence: 75,
      labels: ['threatfox', (i.threat_type || '').toLowerCase()],
    })).filter((i: RawIoc) => i.value);
  } catch (err) {
    console.error('[IOC] ThreatFox fetch error:', (err as Error).message);
    return [];
  }
}

function iocTypeFromThreatFox(t: string): IOCTypes {
  const map: Record<string, IOCTypes> = {
    'ip:port': 'IP', 'ip': 'IP',
    'domain': 'DOMAIN', 'url': 'URL',
    'md5_hash': 'MD5', 'sha1_hash': 'SHA1', 'sha256_hash': 'SHA256',
  };
  return map[t] || 'SHA256';
}

function threatTypeFromAbuse(t: string): ThreatType {
  const map: Record<string, ThreatType> = {
    'botnet_cc': 'C2', 'c2': 'C2',
    'payload_delivery': 'MALWARE', 'malware_download': 'MALWARE',
    'phishing': 'PHISHING', 'ransomware': 'RANSOMWARE',
    'scam': 'SCAM', 'scanner': 'SCANNER',
  };
  return map[t] || 'MALWARE';
}

// ──────────────────────────────────────
//  URLHaus Feed (Abuse.ch)
// ──────────────────────────────────────

export async function fetchUrlhaus(): Promise<RawIoc[]> {
  try {
    const res = await axios.get('https://urlhaus.abuse.ch/downloads/csv_recent/', {
      timeout: 15000,
      responseType: 'text',
    });

    const lines = res.data.split('\n').filter((l: string) => l && !l.startsWith('#'));
    return lines.slice(0, 100).map((line: string) => {
      const parts = line.split(',');
      return {
        type: 'URL' as IOCTypes,
        value: parts[2]?.replace(/"/g, '') || '',
        threatType: parts[4]?.includes('phish') ? 'PHISHING' as ThreatType : 'MALWARE' as ThreatType,
        source: 'URLHAUS' as IOCSource,
        sourceRef: parts[0]?.replace(/"/g, '') || '',
        confidence: 80,
        firstSeen: parts[1] ? new Date(parts[1]) : undefined,
      };
    }).filter((i: RawIoc) => i.value);
  } catch (err) {
    console.error('[IOC] URLHaus fetch error:', (err as Error).message);
    return [];
  }
}
