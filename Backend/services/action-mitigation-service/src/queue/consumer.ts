/**
 * Mitigation Consumer — Auto-Trigger Firewall Block on CRITICAL_THREAT_FOUND
 * ===========================================================================
 * Listens to the global "notifications" queue for CRITICAL_THREAT_FOUND events.
 * When received, automatically triggers firewall blocking and saves to MongoDB.
 *
 * This creates the "Deceive–Disrupt–Deny" pipeline:
 *   Intelligence/OSINT detects threat → Notification event → Auto-block
 */

import { Worker } from 'bullmq';
import { getRedis } from './connection';
import { MitigationAction } from '../models/MitigationAction';
import { blockIpOnCloudflare, blockDomainOnCloudflare, getBlockExpiry, BlockAction, BlockResult } from '../services/firewall-blocker';

interface CriticalThreatEvent {
  type: string;
  title: string;
  message: string;
  severity: string;
  sourceService: string;
  sourceId?: string;
  tenantId: string;
  metadata?: {
    ip?: string;
    domain?: string;
    url?: string;
    [key: string]: unknown;
  };
}

// ─────────────────────────────────────────────
//  Manual Block Consumer (from CVE / UI)
// ─────────────────────────────────────────────

interface ManualBlockJob {
  targetIp?: string;
  targetDomain?: string;
  targetUrl?: string;
  mitigationType: 'BLOCK_IP' | 'BLOCK_DOMAIN' | 'BLOCK_URL' | 'WAF_RULE';
  description: string;
  durationSeconds: number;
  tenantId: string;
  userId: string;
}

/**
 * Worker that processes manual block requests from the 'mitigation-actions' queue.
 * Triggered when a user clicks "Block Threat" on the CVE Database page or
 * submits a manual block from the Action & Mitigation page.
 */
export function createManualBlockConsumer(): Worker {
  const worker = new Worker<ManualBlockJob>(
    'mitigation-actions',
    async (job) => {
      const { targetIp, targetDomain, targetUrl, mitigationType, description, durationSeconds, tenantId, userId } = job.data;

      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║  🛡️  MANUAL BLOCK REQUESTED                 ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Type:   ${mitigationType.padEnd(39)}║`);
      console.log(`║  Target: ${(targetIp || targetDomain || targetUrl || 'N/A').padEnd(39)}║`);
      console.log(`║  By:     ${userId.padEnd(39)}║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');

      const action = {
        ip: targetIp || '',
        domain: targetDomain || '',
        url: targetUrl || '',
        reason: description || `Manual block by ${userId}`,
        duration: durationSeconds,
      };

      let blockResult: BlockResult;

      switch (mitigationType) {
        case 'BLOCK_IP':
          blockResult = await blockIpOnCloudflare(action);
          break;
        case 'BLOCK_DOMAIN':
        case 'BLOCK_URL':
          blockResult = await blockDomainOnCloudflare(action);
          break;
        case 'WAF_RULE':
          // For WAF_RULE, try domain blocking as default behavior
          blockResult = await blockDomainOnCloudflare(action);
          break;
        default:
          throw new Error(`Unknown mitigation type: ${mitigationType}`);
      }

      // Save to MongoDB
      const record = await MitigationAction.create({
        targetIp: targetIp || '',
        targetDomain: targetDomain || '',
        targetUrl: targetUrl || '',
        mitigationType,
        firewallProvider: blockResult.success ? 'CLOUDFLARE' : 'SIMULATED',
        status: blockResult.success ? 'ACTIVE' : 'FAILED',
        ruleName: blockResult.ruleName,
        ruleId: blockResult.ruleId,
        description: `Manual block: ${description || `${mitigationType} — ${targetIp || targetDomain || targetUrl}`}`,
        sourceEvent: 'MANUAL_BLOCK',
        sourceEventId: null,
        autoTriggered: false,
        expiresAt: getBlockExpiry(durationSeconds),
        responseData: blockResult.rawResponse,
        tenantId,
        createdBy: userId,
      });

      console.log(`[ManualBlock-Consumer] ✅ ${mitigationType} ${blockResult.success ? 'ACTIVE' : 'FAILED'} — ${record._id}`);

      return {
        success: blockResult.success,
        mitigationId: record._id,
        ruleName: blockResult.ruleName,
        ruleId: blockResult.ruleId,
        provider: blockResult.provider,
      };
    },
    {
      connection: getRedis(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    const returnVal = job.returnvalue as any;
    console.log(`[ManualBlock-Consumer] ✅ Job ${job.id} completed — ${returnVal?.success ? 'BLOCKED' : 'FAILED'}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ManualBlock-Consumer] ❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export function createMitigationConsumer(): Worker {
  const worker = new Worker<CriticalThreatEvent>(
    'notifications',  // Listen on the global notifications queue
    async (job) => {
      const { type, title, severity, sourceService, sourceId, tenantId, metadata } = job.data;

      // Only auto-respond to critical severity from security services
      if (severity !== 'CRITICAL') {
        console.log(`[Mitigation-Consumer] Skipping non-critical event: ${type} (${severity})`);
        return { skipped: true, reason: 'Not CRITICAL severity' };
      }

      const securityServices = ['intelligence-service', 'osint-service', 'discovery-service'];
      if (!securityServices.includes(sourceService)) {
        console.log(`[Mitigation-Consumer] Skipping event from non-security service: ${sourceService}`);
        return { skipped: true, reason: 'Non-security source' };
      }

      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║  🚨 CRITICAL THREAT DETECTED                ║');
      console.log('║  Auto-mitigation triggered                  ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Event: ${type.padEnd(41)}║`);
      console.log(`║  Title: ${title.substring(0, 40).padEnd(41)}║`);
      console.log(`║  Source: ${sourceService.padEnd(39)}║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log('');

      const results: Array<{ type: string; success: boolean; ruleId: string | null }> = [];
      const ip = metadata?.ip as string | undefined;
      const domain = metadata?.domain as string | undefined;
      const url = metadata?.url as string | undefined;

      // ── Auto-block IP if present ──
      if (ip) {
        const action: BlockAction = {
          ip,
          domain: domain || '',
          url: url || '',
          reason: `Auto-mitigation: ${title}`,
          duration: 86400, // 24 hours
        };

        const blockResult = await blockIpOnCloudflare(action);
        results.push({ type: 'BLOCK_IP', success: blockResult.success, ruleId: blockResult.ruleId });

        await MitigationAction.create({
          targetIp: ip,
          targetDomain: domain || '',
          targetUrl: url || '',
          mitigationType: 'BLOCK_IP',
          firewallProvider: blockResult.success ? 'CLOUDFLARE' : 'SIMULATED',
          status: blockResult.success ? 'ACTIVE' : 'FAILED',
          ruleName: blockResult.ruleName,
          ruleId: blockResult.ruleId,
          description: `Auto-blocked IP ${ip}. Event: ${type} — ${title}`,
          sourceEvent: type,
          sourceEventId: sourceId || null,
          autoTriggered: true,
          expiresAt: getBlockExpiry(86400),
          responseData: blockResult.rawResponse,
          tenantId,
          createdBy: 'system:auto-mitigation',
        });
      }

      // ── Auto-block domain if present ──
      if (domain) {
        const action: BlockAction = {
          ip: ip || '',
          domain,
          url: url || '',
          reason: `Auto-mitigation: ${title}`,
          duration: 86400,
        };

        const blockResult = await blockDomainOnCloudflare(action);
        results.push({ type: 'BLOCK_DOMAIN', success: blockResult.success, ruleId: blockResult.ruleId });

        await MitigationAction.create({
          targetIp: ip || '',
          targetDomain: domain,
          targetUrl: url || '',
          mitigationType: 'BLOCK_DOMAIN',
          firewallProvider: blockResult.success ? 'CLOUDFLARE' : 'SIMULATED',
          status: blockResult.success ? 'ACTIVE' : 'FAILED',
          ruleName: blockResult.ruleName,
          ruleId: blockResult.ruleId,
          description: `Auto-blocked domain ${domain}. Event: ${type} — ${title}`,
          sourceEvent: type,
          sourceEventId: sourceId || null,
          autoTriggered: true,
          expiresAt: getBlockExpiry(86400),
          responseData: blockResult.rawResponse,
          tenantId,
          createdBy: 'system:auto-mitigation',
        });
      }

      console.log(`[Mitigation-Consumer] Mitigation complete: ${results.length} action(s) taken`);
      return { results };
    },
    {
      connection: getRedis(),
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    const returnVal = job.returnvalue as any;
    if (returnVal?.skipped) return;
    console.log(`[Mitigation-Consumer] ✅ Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Mitigation-Consumer] ❌ Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
