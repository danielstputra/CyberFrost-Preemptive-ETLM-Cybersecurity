'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/providers/translation-provider';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { GitPullRequest, Server, Activity, Webhook, Terminal, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const INTEGRATION_META: Record<string, { name: string; description: string }> = {
  jira: { name: 'Jira', description: 'Issue tracking and project management' },
  servicenow: { name: 'ServiceNow', description: 'ITSM workflow automation' },
  splunk: { name: 'Splunk', description: 'SIEM log ingestion and alerting' },
  webhook: { name: 'Custom Webhook', description: 'Generic webhook endpoint' },
};

interface Integration {
  _id: string;
  provider: string;
  name: string;
  enabled: boolean;
  config?: { webhookUrl?: string; apiKey?: string };
}

const ICON_MAP: Record<string, React.ElementType> = {
  jira: GitPullRequest, servicenow: Server, splunk: Activity, webhook: Webhook,
};

export default function IntegrationsPage() {
  const { t } = useTranslation();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState('');

  const [configDialog, setConfigDialog] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Fetch integrations from backend
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/v1/action/integration');
      setIntegrations(res.data?.data || []);
    } catch {
      // Fallback to empty
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIntegrations(); }, [fetchIntegrations]);

  const currentProvider = configDialog;
  const currentMeta = currentProvider ? INTEGRATION_META[currentProvider] : null;

  const toggleEnabled = async (id: string, provider: string, current: boolean) => {
    setNotify('');
    try {
      await apiClient.patch(`/api/v1/action/integration/${id}/toggle`);
      setIntegrations(prev => prev.map(i => i._id === id ? { ...i, enabled: !current } : i));
    } catch {
      setNotify(`Failed to toggle ${provider}`);
    }
  };

  const openConfig = (provider: string) => {
    const existing = integrations.find(i => i.provider === provider);
    setConfigDialog(provider);
    setWebhookUrl(existing?.config?.webhookUrl || '');
    setApiKey(existing?.config?.apiKey || '');
  };

  const saveConfig = async () => {
    if (!currentProvider) return;
    setSaving(true);
    setNotify('');
    try {
      const existing = integrations.find(i => i.provider === currentProvider);
      if (existing) {
        await apiClient.patch(`/api/v1/action/integration/${existing._id}`, {
          config: { webhookUrl, apiKey },
        });
      } else {
        await apiClient.post('/api/v1/action/integration', {
          provider: currentProvider,
          name: INTEGRATION_META[currentProvider]?.name || currentProvider,
          config: { webhookUrl, apiKey },
        });
      }
      setNotify(`${INTEGRATION_META[currentProvider]?.name || currentProvider} configuration saved.`);
      setConfigDialog(null);
      fetchIntegrations();
    } catch {
      setNotify('Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','TENANT_ADMIN']}>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
          <Terminal className="h-5 w-5 text-[#00F6FF]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">{t('integrations.title')}</h1>
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('integrations.subtitle')}</p>
          </div>
        </motion.div>

        {/* Integration Cards */}
        <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2">
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#00F6FF] mx-auto" />
              <p className="text-[10px] font-mono text-[#6F7C89] mt-2">Loading integrations...</p>
            </div>
          ) : Object.entries(INTEGRATION_META).map(([provider, meta], i) => {
            const Icon = ICON_MAP[provider] || Webhook;
            const existing = integrations.find(int => int.provider === provider);
            const enabled = existing?.enabled || false;
            const intId = existing?._id;
            return (
              <HUDCard key={provider} accent="cyan" delay={i * 0.05}>
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-lg shrink-0"
                    style={{ background: 'rgba(0,246,255,0.08)', border: '1px solid rgba(0,246,255,0.15)' }}
                  >
                    <Icon className="h-6 w-6 text-[#00F6FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold font-mono text-white tracking-wider">{meta.name}</h3>
                    <p className="text-[10px] font-mono text-[#6F7C89] mt-1">{meta.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      {/* Toggle switch */}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => intId && toggleEnabled(intId, provider, enabled)}
                          disabled={!intId}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-[#00F6FF]' : 'bg-white/10'} ${!intId ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-[#0B0F14] transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`}
                          />
                        </button>
                        <span className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider">Enabled</span>
                      </label>
                      {/* Configure button */}
                      <HUDButton variant="cyan" size="sm" onClick={() => openConfig(provider)}>
                        Configure
                      </HUDButton>
                    </div>
                  </div>
                </div>
              </HUDCard>
            );
          })}
        </motion.div>

        {notify && (
          <div className="px-4 py-2 text-[10px] font-mono text-[#00FF41] border border-[#00FF41]/30" style={{ background: 'rgba(0,255,65,0.05)' }}>
            {notify}
          </div>
        )}

        {/* Configuration Dialog */}
        <Dialog open={configDialog !== null} onOpenChange={(open) => { if (!open) setConfigDialog(null); }}>
          <DialogContent
            style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}
            className="text-white"
          >
            <DialogHeader>
              <DialogTitle className="text-sm font-bold font-mono tracking-[0.15em] text-[#00F6FF] uppercase">
                {currentMeta?.name || 'Integration'} Configuration
              </DialogTitle>
              <DialogDescription className="text-[10px] font-mono text-[#6F7C89]">
                Configure connection settings for {currentMeta?.name || 'this integration'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-[10px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1.5">
                  Webhook URL
                </label>
                <input
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs font-mono border text-white outline-none transition-colors"
                  style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1.5">
                  API Key
                </label>
                <input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  type="password"
                  placeholder="Enter API key"
                  className="w-full px-3 py-2 text-xs font-mono border text-white outline-none transition-colors"
                  style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>
            <DialogFooter>
              <HUDButton variant="cyan" size="sm" onClick={saveConfig} loading={saving}>
                Save Configuration
              </HUDButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </RoleGuard>
  );
}
