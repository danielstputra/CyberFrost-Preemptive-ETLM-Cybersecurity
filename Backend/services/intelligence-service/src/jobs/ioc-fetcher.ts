/**
 * IOC Feed Fetcher (Cron Job)
 * ============================
 * Mengumpulkan IOC dari MISP, ThreatFox, URLHaus setiap 15 menit.
 * IOC baru otomatis di-score oleh Threat Score engine.
 */

import cron from 'node-cron';
import { IOC } from '../models/IOC';
import { fetchMispFeed, fetchThreatFox, fetchUrlhaus } from '../sources';
import { calculateThreatScore } from '../services/threat-score';
import { createLogger } from '@cyfirma/shared';

const log = createLogger({ serviceName: 'intelligence-service' });
const DEFAULT_TENANT = 'default';

function getIocThreatType(labels: string[] = []): string {
  const threatKeywords: Record<string, string> = {
    c2: 'C2', botnet: 'BOTNET', ransomware: 'RANSOMWARE',
    phish: 'PHISHING', phishing: 'PHISHING', scam: 'SCAM',
    malware: 'MALWARE', scanner: 'SCANNER', payload: 'MALWARE',
  };
  for (const label of labels) {
    const lower = label.toLowerCase();
    for (const [key, value] of Object.entries(threatKeywords)) {
      if (lower.includes(key)) return value;
    }
  }
  return 'MALWARE';
}

export async function runIocFetch(): Promise<number> {
  log.info('Starting IOC collection...');

  const sources = [
    { name: 'MISP', fetch: fetchMispFeed() },
    { name: 'ThreatFox', fetch: fetchThreatFox() },
    { name: 'URLHaus', fetch: fetchUrlhaus() },
  ];

  let totalImported = 0;

  for (const { name, fetch } of sources) {
    try {
      const rawIocs = await fetch;
      if (rawIocs.length === 0) {
        log.info({ source: name }, 'No new IOCs');
        continue;
      }

      let imported = 0;
      for (const raw of rawIocs) {
        // Dedup
        const exists = await IOC.findOne({ type: raw.type, value: raw.value });
        if (exists) {
          // Update last seen
          await IOC.updateOne(
            { _id: exists._id },
            { $set: { lastSeen: new Date(), expired: false, ...(raw.confidence ? { confidence: raw.confidence } : {}) } },
          );
          continue;
        }

        // Calculate threat score
        const signals = {
          exploitAvailable: false,
          exploitMaturity: 'NONE' as const,
          darkWebMentions: raw.source === 'THREATFOX' ? 10 : raw.source === 'MISP' ? 5 : 0,
          threatActorCount: 0,
          threatActorActivity: 'LOW' as const,
          daysSincePublished: 0,
          daysSinceDetected: 0,
          assetCriticality: 'MEDIUM' as const,
          affectedAssetsCount: 0,
          cvssScore: 0,
        };

        const result = calculateThreatScore(signals, { confidenceOverride: 'MEDIUM' });

        await IOC.create({
          type: raw.type,
          value: raw.value,
          description: raw.description || '',
          threatType: (raw.threatType || getIocThreatType(raw.labels)) as any,
          source: raw.source,
          sourceRef: raw.sourceRef || '',
          confidence: raw.confidence || 60,
          labels: raw.labels || [],
          firstSeen: raw.firstSeen || new Date(),
          lastSeen: new Date(),
          expired: false,
          expiresAt: new Date(Date.now() + 30 * 86400000),
          score: { value: result.score, level: result.level, calculatedAt: new Date() },
          tenantId: DEFAULT_TENANT,
        });

        imported++;
      }

      log.info({ source: name, imported }, 'IOCs imported');
      totalImported += imported;
    } catch (err) {
      log.error({ err, source: name }, 'Failed to fetch IOCs');
    }
  }

  log.info({ total: totalImported }, 'IOC collection complete');
  return totalImported;
}

export function startIocFetcher(): void {
  // Run every 15 minutes
  const task = cron.schedule('*/15 * * * *', async () => {
    await runIocFetch();
  });

  task.start();
  log.info('IOC fetcher scheduled (every 15 min)');

  // Run immediately on startup
  runIocFetch().catch(err => log.error({ err }, 'Initial IOC fetch failed'));
}
