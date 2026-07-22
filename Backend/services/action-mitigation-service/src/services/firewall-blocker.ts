/**
 * Firewall Blocker — Automated Threat Mitigation
 * ================================================
 * Sends block commands to firewall/CDN providers to mitigate active threats.
 *
 * Supported providers:
 *   - Cloudflare WAF (API v4) — IP/URL blocking via firewall rules
 *   - Simulated mode — logs actions for development/testing
 *
 * In production, extend with:
 *   - AWS WAF (web ACL updates)
 *   - Azure Firewall (network rules)
 *   - iptables (linux firewall commands via SSH)
 */

import axios from 'axios';
import { config } from '../config';

export interface BlockAction {
  ip: string;
  domain: string;
  url: string;
  reason: string;
  duration: number;         // Block duration in seconds (0 = permanent)
}

export interface BlockResult {
  success: boolean;
  provider: string;
  ruleName: string;
  ruleId: string | null;
  rawResponse: Record<string, unknown> | null;
  error?: string;
}

// ─────────────────────────────────────────────
//  Cloudflare WAF API v4
// ─────────────────────────────────────────────

/**
 * Create a Cloudflare WAF firewall rule to block an IP address.
 *
 * Docs: https://developers.cloudflare.com/api/operations/firewall-rules-create-firewall-rules
 */
export async function blockIpOnCloudflare(action: BlockAction): Promise<BlockResult> {
  const ruleName = `cyberfrost-auto-block-${action.ip}-${Date.now()}`;

  // Check if Cloudflare credentials are configured
  if (!config.cloudflare.apiToken || !config.cloudflare.zoneId) {
    console.log('[Cloudflare] No credentials configured — simulating block');
    return simulateBlock('CLOUDFLARE', action, ruleName);
  }

  try {
    const res = await axios.post(
      `${config.cloudflare.apiUrl}/zones/${config.cloudflare.zoneId}/firewall/rules`,
      {
        action: 'block',
        priority: 1000,
        description: `[CyberFrost] ${action.reason}`,
        filter: {
          expression: `(ip.src eq ${action.ip})`,
          paused: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.cloudflare.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    const data = res.data;
    return {
      success: data.success || false,
      provider: 'CLOUDFLARE',
      ruleName,
      ruleId: data.result?.id || null,
      rawResponse: data as Record<string, unknown>,
    };
  } catch (err: any) {
    console.error('[Cloudflare] API error:', err.message);
    return {
      success: false,
      provider: 'CLOUDFLARE',
      ruleName,
      ruleId: null,
      rawResponse: null,
      error: err.message,
    };
  }
}

/**
 * Create a Cloudflare WAF rule to block a domain/URL pattern.
 */
export async function blockDomainOnCloudflare(action: BlockAction): Promise<BlockResult> {
  const ruleName = `cyberfrost-domain-block-${action.domain}-${Date.now()}`;

  if (!config.cloudflare.apiToken || !config.cloudflare.zoneId) {
    return simulateBlock('CLOUDFLARE', action, ruleName);
  }

  try {
    const res = await axios.post(
      `${config.cloudflare.apiUrl}/zones/${config.cloudflare.zoneId}/firewall/rules`,
      {
        action: 'block',
        priority: 1001,
        description: `[CyberFrost] Domain block: ${action.reason}`,
        filter: {
          expression: `(http.host eq "${action.domain}")`,
          paused: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.cloudflare.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
    );

    return {
      success: res.data.success || false,
      provider: 'CLOUDFLARE',
      ruleName,
      ruleId: res.data.result?.id || null,
      rawResponse: res.data as Record<string, unknown>,
    };
  } catch (err: any) {
    return {
      success: false, provider: 'CLOUDFLARE', ruleName,
      ruleId: null, rawResponse: null, error: err.message,
    };
  }
}

// ─────────────────────────────────────────────
//  Simulated Mode (for development/testing)
// ─────────────────────────────────────────────

function simulateBlock(provider: string, action: BlockAction, ruleName: string): BlockResult {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log(`║  🛡️  FIREWALL BLOCK (${provider} Simulated)      ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Rule:    ${ruleName.padEnd(37)}║`);
  console.log(`║  Target:  ${(action.ip || action.domain || action.url).padEnd(37)}║`);
  console.log(`║  Reason:  ${action.reason.substring(0, 35).padEnd(37)}║`);
  console.log(`║  Expires: ${action.duration > 0 ? `${action.duration}s`.padEnd(36) : 'Permanent'.padEnd(36)}║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  return {
    success: true,
    provider,
    ruleName,
    ruleId: `sim-${Date.now()}`,
    rawResponse: { simulated: true, action, ruleName },
  };
}

// ─────────────────────────────────────────────
//  Rule Expiration
// ─────────────────────────────────────────────

/**
 * Generate an expiration date for a block rule.
 * @param durationSeconds Duration in seconds, 0 = permanent (null)
 */
export function getBlockExpiry(durationSeconds: number): Date | null {
  if (durationSeconds <= 0) return null;
  return new Date(Date.now() + durationSeconds * 1000);
}
