import axios from 'axios';
import { TenantIntegration, IntegrationProvider } from '../models/TenantIntegration';

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

interface AlertData {
  threatId?: string;
  title: string;
  description: string;
  severity: string;
  source?: string;
  detectedAt?: string;
  iocs?: string[];
  metadata?: Record<string, unknown>;
}

interface DispatchResult {
  integrationId: string;
  name: string;
  provider: IntegrationProvider;
  success: boolean;
  statusCode?: number;
  error?: string;
}

// ──────────────────────────────────────
// SIEM Dispatch
// ──────────────────────────────────────

/**
 * Dispatches alert data to all enabled SIEM/webhook integrations for a tenant.
 *
 * Queries TenantIntegration for enabled records, then sends a POST request
 * to each integration's webhook URL with the alert payload.
 * Logs success / failure per integration and returns an array of results.
 */
export async function dispatchToSIEM(
  alertData: AlertData,
  tenantId: string,
): Promise<DispatchResult[]> {
  const integrations = await TenantIntegration.find({
    tenantId,
    enabled: true,
  }).lean();

  if (integrations.length === 0) {
    console.log(`[WebhookDispatcher] No enabled integrations for tenant ${tenantId}`);
    return [];
  }

  const payload = {
    event: 'alert',
    tenantId,
    timestamp: new Date().toISOString(),
    data: alertData,
  };

  const results: DispatchResult[] = await Promise.all(
    integrations.map(async (integration) => {
      const result: DispatchResult = {
        integrationId: integration._id.toString(),
        name: integration.name,
        provider: integration.provider as IntegrationProvider,
        success: false,
      };

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'CyberFrost-WebhookDispatcher/1.0',
        };

        if (integration.config.apiKey) {
          headers['Authorization'] = `Bearer ${integration.config.apiKey}`;
          headers['X-API-Key'] = integration.config.apiKey;
        }

        const response = await axios.post(
          integration.config.webhookUrl,
          payload,
          {
            headers,
            timeout: 15_000,
            validateStatus: () => true, // capture any status code
          },
        );

        result.success = response.status >= 200 && response.status < 300;
        result.statusCode = response.status;

        if (result.success) {
          console.log(
            `[WebhookDispatcher] SUCCESS | tenant=${tenantId} integration=${integration.name} status=${response.status}`,
          );
        } else {
          const msg = `Integration ${integration.name} returned ${response.status}`;
          result.error = msg;
          console.error(`[WebhookDispatcher] ${msg}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        result.error = msg;
        console.error(
          `[WebhookDispatcher] FAILED  | tenant=${tenantId} integration=${integration.name} error=${msg}`,
        );
      }

      return result;
    }),
  );

  return results;
}

// ──────────────────────────────────────
// Jira-style Issue Dispatch
// ──────────────────────────────────────

/**
 * Dispatches a Jira-style issue via webhook to enabled JIRA integrations for a tenant.
 *
 * Constructs a Jira-compatible issue payload and sends it to each
 * integration whose provider === 'JIRA'.
 */
export async function dispatchJiraTicket(
  title: string,
  description: string,
  tenantId: string,
): Promise<DispatchResult[]> {
  const jiraIntegrations = await TenantIntegration.find({
    tenantId,
    provider: 'JIRA',
    enabled: true,
  }).lean();

  if (jiraIntegrations.length === 0) {
    console.log(`[WebhookDispatcher] No enabled JIRA integration for tenant ${tenantId}`);
    return [];
  }

  const payload = {
    event: 'jira_issue',
    tenantId,
    timestamp: new Date().toISOString(),
    data: {
      fields: {
        summary: title,
        description: description,
        project: { key: 'SEC' },
        issuetype: { name: 'Task' },
        labels: ['cyberfrost', 'security'],
      },
    },
  };

  const results: DispatchResult[] = await Promise.all(
    jiraIntegrations.map(async (integration) => {
      const result: DispatchResult = {
        integrationId: integration._id.toString(),
        name: integration.name,
        provider: integration.provider as IntegrationProvider,
        success: false,
      };

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'CyberFrost-WebhookDispatcher/1.0',
        };

        if (integration.config.apiKey) {
          headers['Authorization'] = `Bearer ${integration.config.apiKey}`;
          headers['X-API-Key'] = integration.config.apiKey;
        }

        const response = await axios.post(
          integration.config.webhookUrl,
          payload,
          {
            headers,
            timeout: 15_000,
            validateStatus: () => true,
          },
        );

        result.success = response.status >= 200 && response.status < 300;
        result.statusCode = response.status;

        if (result.success) {
          console.log(
            `[WebhookDispatcher] JIRA SUCCESS | tenant=${tenantId} integration=${integration.name} status=${response.status}`,
          );
        } else {
          const msg = `JIRA integration ${integration.name} returned ${response.status}`;
          result.error = msg;
          console.error(`[WebhookDispatcher] ${msg}`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        result.error = msg;
        console.error(
          `[WebhookDispatcher] JIRA FAILED  | tenant=${tenantId} integration=${integration.name} error=${msg}`,
        );
      }

      return result;
    }),
  );

  return results;
}

// ──────────────────────────────────────
// Test Webhook
// ──────────────────────────────────────

/**
 * Sends a test payload to a specific webhook URL to verify connectivity.
 * Does not persist anything — purely for validation.
 */
export async function sendTestWebhook(
  webhookUrl: string,
  apiKey?: string,
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CyberFrost-WebhookDispatcher/1.0',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-Key'] = apiKey;
    }

    const response = await axios.post(
      webhookUrl,
      {
        event: 'test',
        timestamp: new Date().toISOString(),
        message: 'This is a test webhook from CyberFrost platform.',
      },
      {
        headers,
        timeout: 10_000,
        validateStatus: () => true,
      },
    );

    const success = response.status >= 200 && response.status < 300;
    return { success, statusCode: response.status };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
