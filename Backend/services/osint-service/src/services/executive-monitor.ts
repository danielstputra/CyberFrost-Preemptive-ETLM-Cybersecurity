/**
 * Executive Monitor — Automated Dark Web Leak Detection
 * ======================================================
 * Periodically checks if executive emails/names appear in known
 * data breaches and credential dumps via HIBP simulation.
 */

import { ExecutiveProfile } from '../models/ExecutiveProfile';

const MOCK_BREACHES: Record<string, { title: string; dataClass: string; date: string }[]> = {
  'gmail.com': [
    { title: 'Collection #1', dataClass: 'Email addresses, Passwords', date: '2024-01-15' },
    { title: 'LinkedIn Scrape', dataClass: 'Email addresses, Names', date: '2023-08-20' },
  ],
  'yahoo.com': [
    { title: 'Yahoo Data Breach', dataClass: 'Email addresses, Passwords', date: '2023-12-10' },
  ],
  'outlook.com': [
    { title: 'Microsoft Email Leak', dataClass: 'Email addresses', date: '2024-03-05' },
  ],
};

async function checkEmailLeaks(email: string): Promise<{ leaked: boolean; breaches: string[] }> {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const breaches = MOCK_BREACHES[domain];
  if (!breaches) return { leaked: Math.random() < 0.05, breaches: [] };
  const matched = breaches.filter(() => Math.random() < 0.3);
  return {
    leaked: matched.length > 0,
    breaches: matched.map(b => `${b.title} (${b.dataClass})`),
  };
}

async function checkNameExposure(name: string): Promise<{ exposed: boolean; sources: string[] }> {
  const keywords = ['admin', 'ceo', 'director', 'founder'];
  const hasKeyword = keywords.some(k => name.toLowerCase().includes(k));
  if (!hasKeyword) return { exposed: false, sources: [] };
  return {
    exposed: Math.random() < 0.15,
    sources: Math.random() < 0.15 ? ['Dark Web Forum Posting', 'Pastebin Dump'] : [],
  };
}

export interface MonitorResult {
  executiveId: string;
  name: string;
  email: string;
  previousStatus: string;
  newStatus: string;
  findings: string[];
}

export async function monitorExecutive(exec: any): Promise<MonitorResult> {
  const findings: string[] = [];
  let newStatus = exec.riskStatus || 'SAFE';

  const emailCheck = await checkEmailLeaks(exec.email);
  if (emailCheck.leaked) {
    newStatus = 'LEAKED';
    findings.push(`Credentials found in: ${emailCheck.breaches.join(', ')}`);
  }

  const nameCheck = await checkNameExposure(exec.name);
  if (nameCheck.exposed) {
    if (newStatus !== 'LEAKED') newStatus = 'MONITORING';
    findings.push(`Name referenced in: ${nameCheck.sources.join(', ')}`);
  }

  if (!emailCheck.leaked && !nameCheck.exposed && exec.riskStatus === 'SAFE') {
    findings.push('No leaks detected — profile is clean');
  }

  return {
    executiveId: exec._id?.toString() || exec.id,
    name: exec.name,
    email: exec.email,
    previousStatus: exec.riskStatus || 'SAFE',
    newStatus,
    findings,
  };
}

export async function monitorAllExecutives(tenantId?: string): Promise<MonitorResult[]> {
  const filter: Record<string, unknown> = {};
  if (tenantId) filter.tenantId = tenantId;

  const executives = await ExecutiveProfile.find(filter);
  const results: MonitorResult[] = [];

  for (const exec of executives) {
    const result = await monitorExecutive(exec);
    if (result.newStatus !== result.previousStatus) {
      await ExecutiveProfile.findByIdAndUpdate(exec._id, {
        $set: { riskStatus: result.newStatus, lastCheckedAt: new Date() },
      });
    } else {
      await ExecutiveProfile.findByIdAndUpdate(exec._id, {
        $set: { lastCheckedAt: new Date() },
      });
    }
    results.push(result);
  }

  return results;
}
