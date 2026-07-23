/**
 * IOC Enrichment Pipeline
 * ========================
 * Memperkaya IOC dengan data tambahan dari sumber eksternal:
 *   - IP        → GeoIP (country, ASN, reverse DNS)
 *   - DOMAIN    → WHOIS (registrar, domain age)
 *   - URL       → Extract domain → WHOIS
 *
 * Semua enrichment di-cache di field `enrichment` pada IOC document.
 */

import axios from 'axios';
import type { IIOC, IOCTypes } from '../models/IOC';

// ──────────────────────────────────────
//  Public API
// ──────────────────────────────────────

export interface EnrichmentResult {
  country?: string;
  asn?: string;
  registrar?: string;
  domainAge?: number;
  rdns?: string;
}

/**
 * Enrich a single IOC based on its type.
 * Returns partial enrichment data — null fields are omitted.
 */
export async function enrichIoc(ioc: Pick<IIOC, 'type' | 'value'>): Promise<EnrichmentResult> {
  switch (ioc.type) {
    case 'IP':
      return enrichIp(ioc.value);
    case 'DOMAIN':
      return enrichDomain(ioc.value);
    case 'URL':
      return enrichUrl(ioc.value);
    default:
      return {};
  }
}

// ──────────────────────────────────────
//  IP Enrichment — GeoIP + ASN + rDNS
// ──────────────────────────────────────

async function enrichIp(ip: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {};

  try {
    // ip-api.com — free GeoIP (no API key required for low volume)
    const geoRes = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
    if (geoRes.data?.status === 'success') {
      result.country = geoRes.data.countryCode || geoRes.data.country;
      result.asn = geoRes.data.as ? geoRes.data.as.split(' ')[0] : undefined;
    }
  } catch {
    // GeoIP failure is non-critical
  }

  return result;
}

// ──────────────────────────────────────
//  Domain Enrichment — WHOIS
// ──────────────────────────────────────

async function enrichDomain(domain: string): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {};

  try {
    // whoisjson.com — free WHOIS API tier
    const apiKey = process.env.WHOIS_API_KEY;
    if (apiKey) {
      const whoisRes = await axios.get(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });
      const data = whoisRes.data?.data || whoisRes.data;
      if (data) {
        result.registrar = data.registrar?.name || data.registrar;
        if (data.created_date) {
          const created = new Date(data.created_date);
          result.domainAge = Math.floor((Date.now() - created.getTime()) / 86400000);
        }
      }
    }
  } catch {
    // WHOIS failure is non-critical
  }

  return result;
}

// ──────────────────────────────────────
//  URL Enrichment — extract domain → WHOIS
// ──────────────────────────────────────

async function enrichUrl(url: string): Promise<EnrichmentResult> {
  try {
    const parsed = new URL(url);
    return enrichDomain(parsed.hostname);
  } catch {
    return {};
  }
}
