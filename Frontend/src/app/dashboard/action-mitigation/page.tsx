'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HUDCard } from '@/components/cyber/HUDCard';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import { HUDButton } from '@/components/cyber/HUDButton';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { CyberSelect } from '@/components/cyber/CyberSelect';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldOff, Swords, Globe, Zap, Terminal, Search, ChevronLeft, ChevronRight, History, Clock, Send, FileText, Mail, Download, Copy } from 'lucide-react';
import { useTakedownList, useSubmitTakedown, useMitigationList, useMitigationStats, useManualBlock, useUpdateTakedownStatus } from '@/hooks/use-mitigation';
import { useTranslation } from '@/providers/translation-provider';
import { formatDate } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { RoleGuard } from '@/components/auth/RoleGuard';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type Tab = 'takedown' | 'mitigation';

export default function ActionMitigationPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('takedown');
  const [showTD, setShowTD] = useState(false);
  const [showBL, setShowBL] = useState(false);
  const [page, setPage] = useState(1);

  const { data: tdData } = useTakedownList(page);
  const { data: mitData } = useMitigationList(page);
  const { data: stats } = useMitigationStats();
  const queryClient = useQueryClient();
  const submitTD = useSubmitTakedown();
  const manualBL = useManualBlock();

  // Takedown sortable table
  const td = useSortableTable(tdData?.data, { key: '', dir: null });
  // Mitigation sortable table
  const mit = useSortableTable(mitData?.data, { key: '', dir: null });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [draftCopied, setDraftCopied] = useState(false);
  const PORTAL_ONLY = ['FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN'];
  const PORTAL_URLS: Record<string, string> = {
    FACEBOOK: 'https://www.facebook.com/help/contact/295729307225306',
    INSTAGRAM: 'https://help.instagram.com/contact/438831699759610',
    TWITTER: 'https://help.twitter.com/forms/impersonation',
    LINKEDIN: 'https://www.linkedin.com/help/linkedin/ask/ts-rdmisuse',
  };
  const showOneClickPortalOnly = (item: any) => PORTAL_ONLY.includes(item?.socialPlatform);
  const isKominfoItem = (item: any) => {
    const p = item?.platform || item?.socialPlatform || '';
    return p === 'KOMINFO' || p === 'KOMINFO_TRUST_POSITIF';
  };

  const [showOneClick, setShowOneClick] = useState<any>(null);
  const [executingOneClick, setExecutingOneClick] = useState(false);
  const [oneClickResult, setOneClickResult] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  useEffect(() => { try { const saved = localStorage.getItem('testEmail'); if (saved) setTestEmail(saved); } catch {}; }, []);

  const handleOneClick = async () => {
    if (!showOneClick) return;
    setExecutingOneClick(true); setOneClickResult(null);
    try {
      await apiClient.post(`/api/v1/action/takedown/${showOneClick._id}/execute-one-click`);
      setOneClickResult('success');
      setTimeout(() => { setShowOneClick(null); setOneClickResult(null); }, 2000);
      queryClient.invalidateQueries({ queryKey: ['takedown'] });
    } catch { setOneClickResult('error'); }
    setExecutingOneClick(false);
  };

  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTestOneClick = async () => {
    if (!showAnalyst) return;
    setTestResult(null);
    setShowTestDialog(true);

    // Pastikan draft content sudah terbuat
    if (!showAnalyst.draftContent) {
      try {
        const res = await apiClient.post(`/api/v1/action/takedown/${showAnalyst._id}/generate-draft`);
        showAnalyst.draftContent = res.data.draft;
      } catch {}
    }

    // Kirim test email ke alamat yang dikonfigurasi (env atau localStorage)
    try {
      const targetEmail = testEmail || localStorage.getItem('testEmail') || process.env.NEXT_PUBLIC_TEST_EMAIL || '';
      if (!targetEmail) {
        setTestResult({ ok: false, msg: 'No test email configured. Set NEXT_PUBLIC_TEST_EMAIL or enter a test email.' });
        return;
      }
      const res = await apiClient.post(`/api/v1/action/takedown/${showAnalyst._id}/execute-one-click?test=${encodeURIComponent(targetEmail)}`,
        {}, { timeout: 120000 });
      setTestEmail(targetEmail);
      localStorage.setItem('testEmail', targetEmail);
      setTestResult({ ok: true, msg: `Test report sent to ${targetEmail}` });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.response?.data?.message || err?.message || 'Failed to send test email' });
    }
  };

  const [tdForm, setTdForm] = useState({ targetUrl: '', domain: '', threatType: 'PHISHING', evidence: '' });
  const [tdError, setTdError] = useState('');
  const handleTD = async () => {
    setTdError('');
    try {
      await submitTD.mutateAsync(tdForm);
      setShowTD(false);
      setTdForm({ targetUrl: '', domain: '', threatType: 'PHISHING', evidence: '' });
    } catch (err: any) {
      setTdError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to submit takedown.');
    }
  };
  const [blForm, setBlForm] = useState({ targetIp: '', targetDomain: '', mitigationType: 'BLOCK_IP', description: '' });
  const handleBL = async () => { await manualBL.mutateAsync(blForm); setShowBL(false); setBlForm({ targetIp: '', targetDomain: '', mitigationType: 'BLOCK_IP', description: '' }); };

  const [showAnalyst, setShowAnalyst] = useState<any>(null);
  const [analystNote, setAnalystNote] = useState('');
  const [analystNewStatus, setAnalystNewStatus] = useState('');
  const [analystSuccess, setAnalystSuccess] = useState('');

  // Real-time polling: refresh takedown detail every 5s when sheet is open
  const { data: analystFresh } = useQuery({
    queryKey: ['takedown-detail', showAnalyst?._id],
    queryFn: async () => {
      if (!showAnalyst?._id) return null;
      const res = await apiClient.get(`/api/v1/action/takedown/${showAnalyst._id}`);
      return res.data;
    },
    enabled: !!showAnalyst?._id,
    refetchInterval: 5000,
  });

  // Sync fresh data into showAnalyst when poll returns new data
  useEffect(() => {
    if (analystFresh && showAnalyst) {
      const freshLogs = analystFresh.analystLogs || [];
      const currentLogs = showAnalyst.analystLogs || [];
      if (freshLogs.length !== currentLogs.length) {
        setShowAnalyst((prev: any) => ({ ...prev, ...analystFresh, analystLogs: freshLogs }));
      }
    }
  }, [analystFresh]);

  // Auto-select next logical status when Analyst Sheet opens
  useEffect(() => {
    if (!showAnalyst) return;
    setAnalystSuccess('');
    const statusFlow: Record<string, string> = {
      DRAFT: 'IN_REVIEW', SUBMITTED: 'IN_REVIEW', IN_REVIEW: 'ESCALATED_VIP',
      ESCALATED_VIP: 'SUCCESSFUL',
    };
    setAnalystNewStatus(statusFlow[showAnalyst.status] || '');
    setAnalystNote('');
  }, [showAnalyst?._id]);
  const updateStatus = useUpdateTakedownStatus();
  const handleAnalystUpdate = async () => {
    if (!showAnalyst || !analystNewStatus || !analystNote) return;
    try {
      await updateStatus.mutateAsync({ id: showAnalyst._id, status: analystNewStatus as any, note: analystNote });
      setAnalystSuccess(`${showAnalyst.status} → ${analystNewStatus}`);
      queryClient.invalidateQueries({ queryKey: ['takedown'] });
      setTimeout(() => { setShowAnalyst(null); setAnalystNote(''); setAnalystNewStatus(''); setAnalystSuccess(''); }, 1500);
    } catch {}
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'text-[#6F7C89]', SUBMITTED: 'text-[#FCEE09]', IN_REVIEW: 'text-[#00F6FF]',
    ESCALATED_VIP: 'text-[#FF00FF]', SUCCESSFUL: 'text-[#00FF41]', REJECTED: 'text-[#FF003C]',
  };

  const [showLegal, setShowLegal] = useState<any>(null);
  const [legalDraft, setLegalDraft] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const handleSaveDraft = async () => {
    if (!showLegal || !legalDraft) return;
    setSavingDraft(true);
    try {
      await apiClient.patch(`/api/v1/action/takedown/${showLegal._id}/draft`, { draftContent: legalDraft });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch { alert('Failed to save draft.'); }
    setSavingDraft(false);
  };
  const [legalTo, setLegalTo] = useState('');
  const [legalCc, setLegalCc] = useState('');
  const [legalSubject, setLegalSubject] = useState('');
  const [legalSending, setLegalSending] = useState(false);
  const [legalSent, setLegalSent] = useState(false);
  const handleGenerateDraft = async (item: any) => {
    setShowLegal(item);
    setLegalSubject(`URGENT: Impersonation Notice — ${item.impersonatedEntity || item.domain}`);
    try {
      const res = await apiClient.post(`/api/v1/action/takedown/${item._id}/generate-draft`);
      setLegalDraft(res.data.draft);
    } catch { setLegalDraft('Failed to generate draft. Please try again.'); }
  };
  const handleDispatchEmail = async () => {
    if (!showLegal || !legalTo || !legalSubject || !legalDraft) return;
    setLegalSending(true);
    try {
      await apiClient.post(`/api/v1/action/takedown/${showLegal._id}/dispatch-email`, {
        to: legalTo, cc: legalCc || undefined, subject: legalSubject, body: legalDraft,
      });
      setLegalSent(true);
      setTimeout(() => { setShowLegal(null); setLegalSent(false); setLegalDraft(''); setLegalTo(''); setLegalCc(''); setLegalSubject(''); }, 2000);
    } catch { alert('Failed to send email.'); }
    setLegalSending(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const visIds = td.sorted?.map((t: any) => t._id) || [];
    const allSelected = visIds.length > 0 && visIds.every((id: string) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visIds])]);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkExport = async () => {
    try {
      const res = await apiClient.post('/api/v1/action/takedown/bulk-export', { ids: selectedIds }, { responseType: 'blob' });
      downloadBlob(res.data, 'takedown-export.csv');
      setSelectedIds([]);
    } catch { alert('Failed to export CSV.'); }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatusValue || !bulkNote) return;
    try {
      await apiClient.patch('/api/v1/action/takedown/bulk-status', { ids: selectedIds, status: bulkStatusValue, note: bulkNote });
      setSelectedIds([]);
      setShowBulkStatus(false);
      setBulkStatusValue('');
      setBulkNote('');
      queryClient.invalidateQueries({ predicate: (query: any) => query.queryKey[0] === 'takedown' || query.queryKey[0] === 'takedowns' });
    } catch { alert('Failed to update statuses.'); }
  };

  const handleCopyDraft = async () => {
    if (!showAnalyst?.draftContent) return;
    try {
      await navigator.clipboard.writeText(showAnalyst.draftContent);
      setDraftCopied(true);
      setTimeout(() => setDraftCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleDownloadEvidence = () => {
    const files = showAnalyst?.evidenceFiles;
    if (!files || !files.length) return;
    const text = files.map((f: string, i: number) => `[${i + 1}] ${f}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleMarkSubmitted = async () => {
    if (!showLegal) return;
    try {
      await apiClient.patch(`/api/v1/action/takedown/${showLegal._id}/status`, { status: 'SUBMITTED', note: 'Submitted via legal draft' });
      queryClient.invalidateQueries({ predicate: (query: any) => query.queryKey[0] === 'takedown' || query.queryKey[0] === 'takedowns' });
      setShowLegal(null);
      setLegalDraft('');
      setDraftSaved(false);
      setDraftCopied(false);
      setLegalTo('');
      setLegalCc('');
      setLegalSubject('');
    } catch { alert('Failed to mark as submitted.'); }
  };

  const handleCopyLogs = () => {
    const logs = showAnalyst?.analystLogs;
    if (!logs || !logs.length) return;
    const text = logs.map((log: any) =>
      `[${new Date(log.timestamp).toLocaleString()}] ${log.previousStatus} → ${log.newStatus}: ${log.note} (by ${log.analystName})`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  const [showSM, setShowSM] = useState(false);
  const [smForm, setSmForm] = useState({ profileUrl: '', platform: 'FACEBOOK', impersonatedEntity: '', description: '', evidenceFiles: '' });
  const submitSM = useMutation({
    mutationFn: async () => {
      const files = smForm.evidenceFiles ? smForm.evidenceFiles.split('\n').map(s => s.trim()).filter(Boolean) : [];
      const res = await apiClient.post('/api/v1/action/takedown/social-media', { ...smForm, evidenceFiles: files });
      return res.data;
    },
    onSuccess: () => { setShowSM(false); setSmForm({ profileUrl: '', platform: 'FACEBOOK', impersonatedEntity: '', description: '', evidenceFiles: '' }); },
  });
  const handleSM = () => submitSM.mutate();

  const activeT = td.search ? td.total : tdData?.pagination?.total;
  const activeM = mit.search ? mit.total : mitData?.pagination?.total;
  const visibleTdIds = td.sorted?.map((t: any) => t._id) || [];
  const allVisibleSelected = visibleTdIds.length > 0 && visibleTdIds.every(id => selectedIds.includes(id));
  const someVisibleSelected = visibleTdIds.some(id => selectedIds.includes(id));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#FCEE09] pl-4 min-w-0">
          <Terminal className="h-5 w-5 text-[#FCEE09] shrink-0" /><div className="min-w-0">
            <h1 className="text-base font-bold tracking-[0.15em] text-[#FCEE09] font-mono uppercase truncate">{t('mitigation.title')}</h1><FeatureGuide title={t('mitigation.guideTitle')} steps={[{title:t('mitigation.guideTakedown'),desc:t('mitigation.guideTakedownDesc')},{title:t('mitigation.guideBlock'),desc:t('mitigation.guideBlockDesc')}]} />
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider truncate">&gt; {t('mitigation.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR']}>
            <HUDButton variant="yellow" size="sm" onClick={() => setShowTD(true)} className="flex-1 sm:flex-none"><Swords className="h-3.5 w-3.5 shrink-0" /> <span className="hidden sm:inline">Request</span> Takedown</HUDButton>
          </RoleGuard>
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN']}>
            <HUDButton variant="cyan" size="sm" onClick={() => setShowSM(true)} className="flex-1 sm:flex-none"><Globe className="h-3.5 w-3.5 shrink-0" /> <span className="hidden sm:inline">Social</span> Media</HUDButton>
          </RoleGuard>
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST']}>
            <HUDButton variant="red" size="sm" onClick={() => setShowBL(true)} className="flex-1 sm:flex-none"><ShieldOff className="h-3.5 w-3.5 shrink-0" /> <span className="hidden sm:inline">{t('mitigation.block')}</span></HUDButton>
          </RoleGuard>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: t('mitigation.takedowns'), value: activeT, icon: Swords, accent: 'cyan' as const },
          { label: t('mitigation.mitigations'), value: activeM, icon: ShieldOff, accent: 'cyan' as const },
          { label: t('mitigation.autoTriggered'), value: stats?.autoTriggered, icon: Zap, accent: 'yellow' as const },
          { label: t('mitigation.activeBlocks'), value: stats?.byStatus?.ACTIVE, icon: Globe, accent: 'red' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value ?? '—'}</p></div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : s.accent === 'yellow' ? '#FCEE09' : '#00F6FF' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemAnim} className="flex gap-1 border-b border-white/5 pb-0">
        {(['takedown', 'mitigation'] as Tab[]).map(tabName => (
          <button key={tabName} onClick={() => setTab(tabName)}
            className={`px-4 py-2 text-[10px] font-mono tracking-wider uppercase transition-colors ${tab === tabName ? 'text-[#00F6FF] border-b-2 border-[#00F6FF]' : 'text-[#6F7C89] hover:text-white'}`}>
            {tabName === 'takedown' ? t('mitigation.takedownRequests') : t('mitigation.mitigationActions')}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div variants={itemAnim}>
        <HUDCard title={tab === 'takedown' ? t('mitigation.takedownRequests') : t('mitigation.mitigationActions')}
          accent={tab === 'takedown' ? 'cyan' : 'yellow'}
          icon={tab === 'takedown' ? <Swords className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}>
          {/* Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
              <input placeholder={tab === 'takedown' ? t('mitigation.searchTakedowns') : t('mitigation.searchMitigations')}
                value={tab === 'takedown' ? td.search : mit.search}
                onChange={e => tab === 'takedown' ? td.setSearch(e.target.value) : mit.setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30 transition-colors" />
            </div>
            <span className="text-[9px] font-mono text-[#6F7C89] whitespace-nowrap">{t('mitigation.records', `${tab === 'takedown' ? td.total : mit.total} records`)}</span>
          </div>
          {tab === 'takedown' && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-[10px] font-mono text-[#FCEE09]">{selectedIds.length} selected</span>
              <div className="flex-1" />
              <HUDButton variant="cyan" size="sm" onClick={handleBulkExport}><Download className="h-3 w-3" /> Export CSV</HUDButton>
              <HUDButton variant="yellow" size="sm" onClick={() => setShowBulkStatus(true)} glitchText="UPDATE"><Send className="h-3 w-3" /> Bulk Update Status</HUDButton>
            </div>
          )}
          <div className="overflow-x-auto">
            {tab === 'takedown' ? (
              <Table><TableHeader><TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                <TableHead className="w-[40px]"><Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => td.toggleSort('targetUrl')}>{t('mitigation.target')} {td.sortIcon('targetUrl')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => td.toggleSort('domain')}>{t('mitigation.domain')} {td.sortIcon('domain')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => td.toggleSort('threatType')}>{t('mitigation.type')} {td.sortIcon('threatType')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => td.toggleSort('status')}>{t('mitigation.status')} {td.sortIcon('status')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => td.toggleSort('submittedAt')}>{t('mitigation.submitted')} {td.sortIcon('submittedAt')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{td.sorted?.length ? td.sorted.map(t => (
                <TableRow key={t._id} onClick={() => setShowAnalyst(t)} className="border-white/5 hover:bg-white/5 cursor-pointer"><TableCell className="w-[40px]" onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.includes(t._id)} onCheckedChange={() => toggleSelect(t._id)} /></TableCell><TableCell className="max-w-[120px] truncate font-mono text-[11px] text-[#00F6FF]">{t.targetUrl}</TableCell>
                  <TableCell className="font-mono text-[11px] text-white">{t.domain || t.impersonatedEntity || '—'}</TableCell>
                  <TableCell><span className="text-[10px] font-mono text-[#6F7C89]">{t.targetType === 'SOCIAL_MEDIA' ? `${t.socialPlatform || 'SOCIAL'}` : t.threatType}</span></TableCell>
                  <TableCell><span className={`text-[10px] font-mono ${statusColors[t.status] || 'text-[#6F7C89]'}`}>{t.status === 'ESCALATED_VIP' ? 'VIP' : t.status}</span></TableCell>
                  <TableCell className="font-mono text-[10px] text-[#6F7C89]">{t.submittedAt ? formatDate(t.submittedAt) : '—'}</TableCell></TableRow>
              )) : <TableRow><TableCell colSpan={6} className="py-12 text-center text-[10px] font-mono text-[#6F7C89]">
                <Search className="mx-auto mb-2 h-6 w-6 opacity-30" />{td.search ? t('mitigation.noTakedownsSearch') : t('mitigation.noTakedowns')}
              </TableCell></TableRow>}</TableBody></Table>
            ) : (
              <Table><TableHeader><TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => mit.toggleSort('targetIp')}>{t('mitigation.target')} {mit.sortIcon('targetIp')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => mit.toggleSort('mitigationType')}>{t('mitigation.type')} {mit.sortIcon('mitigationType')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => mit.toggleSort('firewallProvider')}>{t('mitigation.provider')} {mit.sortIcon('firewallProvider')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => mit.toggleSort('status')}>{t('mitigation.status')} {mit.sortIcon('status')}</TableHead>
                <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => mit.toggleSort('autoTriggered')}>{t('mitigation.trigger')} {mit.sortIcon('autoTriggered')}</TableHead>
              </TableRow></TableHeader>
              <TableBody>{mit.sorted?.length ? mit.sorted.map(m => (
                <TableRow key={m._id} className="border-white/5 hover:bg-white/5"><TableCell className="font-mono text-[11px] text-white">{m.targetIp || m.targetDomain || '—'}</TableCell>
                  <TableCell><ThreatBadge level={m.mitigationType as any}>{m.mitigationType}</ThreatBadge></TableCell>
                  <TableCell className="font-mono text-[11px] text-[#6F7C89]">{m.firewallProvider}</TableCell>
                  <TableCell><span className={`text-[10px] font-mono ${m.status === 'ACTIVE' ? 'text-[#FF003C]' : m.status === 'EXPIRED' ? 'text-[#6F7C89]' : 'text-[#FCEE09]'}`}>{m.status}</span></TableCell>
                  <TableCell className="font-mono text-[10px] text-[#6F7C89]">{m.autoTriggered ? t('mitigation.auto') : t('mitigation.manual')}</TableCell></TableRow>
              )) : <TableRow><TableCell colSpan={5} className="py-12 text-center text-[10px] font-mono text-[#6F7C89]">
                <ShieldOff className="mx-auto mb-2 h-6 w-6 opacity-30" />{mit.search ? t('mitigation.noMitigationsSearch') : t('mitigation.noMitigations')}
              </TableCell></TableRow>}</TableBody></Table>
            )}
          </div>
          {/* Pagination for both tables */}
          {(tab === 'takedown' ? td.totalPages : mit.totalPages) > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#6F7C89]">{t('mitigation.pagination', `Page ${tab === 'takedown' ? td.page : mit.page} of ${tab === 'takedown' ? td.totalPages : mit.totalPages}`)}</span>
              <div className="flex gap-1">
                <HUDButton variant="cyan" size="sm" onClick={() => (tab === 'takedown' ? td.setPage : mit.setPage)(Math.max(1, (tab === 'takedown' ? td.page : mit.page) - 1))}
                  disabled={(tab === 'takedown' ? td.page : mit.page) <= 1}><ChevronLeft className="h-3 w-3" /></HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={() => (tab === 'takedown' ? td.setPage : mit.setPage)(Math.min((tab === 'takedown' ? td.totalPages : mit.totalPages), (tab === 'takedown' ? td.page : mit.page) + 1))}
                  disabled={(tab === 'takedown' ? td.page : mit.page) >= (tab === 'takedown' ? td.totalPages : mit.totalPages)}><ChevronRight className="h-3 w-3" /></HUDButton>
              </div>
            </div>
          )}
        </HUDCard>
      </motion.div>

      {/* Dialogs */}
      <Dialog open={showTD} onOpenChange={setShowTD}><DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" style={{background:'#0B0F14',border:'1px solid rgba(0,246,255,0.2)'}}>
        <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">{t('mitigation.newTakedown')}</DialogTitle>
        <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">{t('mitigation.submitUrl')}</DialogDescription>
        <div className="space-y-3 mt-4">
          <Input className="cyber-input" placeholder={t('mitigation.targetUrlPlaceholder')} value={tdForm.targetUrl} onChange={e=>setTdForm({...tdForm,targetUrl:e.target.value})} />
          <Input className="cyber-input" placeholder={t('mitigation.domainPlaceholder')} value={tdForm.domain} onChange={e=>setTdForm({...tdForm,domain:e.target.value})} />
          <CyberSelect options={[{value:'PHISHING',label:'Phishing'},{value:'MALWARE',label:'Malware'},{value:'TRADEMARK',label:'Trademark'},{value:'JUDI_ONLINE',label:'Judi Online'},{value:'PHISHING_BANK_LOKAL',label:'Phishing Bank Lokal'},{value:'PENIPUAN_TRANSAKSI',label:'Penipuan Transaksi'}]}
            value={tdForm.threatType} onChange={v=>setTdForm({...tdForm,threatType:v})} placeholder={t('mitigation.threatTypePlaceholder')} />
          <div>
            <label className="text-[8px] font-mono text-[#6F7C89] uppercase tracking-wider mb-1 block">Evidence (URLs or description)</label>
            <Input className="cyber-input" placeholder="https://... or text description" value={tdForm.evidence} onChange={e=>setTdForm({...tdForm,evidence:e.target.value})} />
          </div>
          {tdError && (
            <div className="border border-[#FF003C] p-2 bg-[rgba(255,0,60,0.05)]">
              <p className="text-[9px] font-mono text-[#FF003C]">{tdError}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <HUDButton variant="cyan" size="sm" onClick={()=>setShowTD(false)}>{t('mitigation.cancel')}</HUDButton>
            <HUDButton variant="yellow" size="sm" onClick={handleTD} loading={submitTD.isPending} disabled={!tdForm.targetUrl||!tdForm.domain} glitchText={t('mitigation.submit')}><Swords className="h-4 w-4" /></HUDButton>
          </div>
        </div>
      </DialogContent></Dialog>

      <Dialog open={showBL} onOpenChange={setShowBL}><DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" style={{background:'#0B0F14',border:'1px solid rgba(255,0,60,0.2)'}}>
        <DialogTitle className="font-mono text-[#FF003C] tracking-wider">{t('mitigation.manualBlock')}</DialogTitle>
        <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">{t('mitigation.blockDescription')}</DialogDescription>
        <div className="space-y-3 mt-4">
          <CyberSelect options={[{value:'BLOCK_IP',label:'Block IP'},{value:'BLOCK_DOMAIN',label:'Block Domain'}]}
            value={blForm.mitigationType} onChange={v=>setBlForm({...blForm,mitigationType:v})} placeholder={t('mitigation.mitigationTypePlaceholder')} />
          {blForm.mitigationType==='BLOCK_IP'&&<Input className="cyber-input" placeholder={t('mitigation.targetIpPlaceholder')} value={blForm.targetIp} onChange={e=>setBlForm({...blForm,targetIp:e.target.value})} />}
          {blForm.mitigationType==='BLOCK_DOMAIN'&&<Input className="cyber-input" placeholder={t('mitigation.targetDomainPlaceholder')} value={blForm.targetDomain} onChange={e=>setBlForm({...blForm,targetDomain:e.target.value})} />}
          <Input className="cyber-input" placeholder={t('mitigation.reason')} value={blForm.description} onChange={e=>setBlForm({...blForm,description:e.target.value})} />
          <div className="flex justify-end gap-2 pt-2">
            <HUDButton variant="cyan" size="sm" onClick={()=>setShowBL(false)}>{t('mitigation.cancel')}</HUDButton>
            <HUDButton variant="red" size="sm" onClick={handleBL} loading={manualBL.isPending} glitchText={t('mitigation.blockButton')}><ShieldOff className="h-4 w-4" /></HUDButton>
          </div>
        </div>
      </DialogContent></Dialog>

      {/* Social Media Takedown Dialog */}
      <Dialog open={showSM} onOpenChange={setShowSM}><DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" style={{background:'#0B0F14',border:'1px solid rgba(0,246,255,0.2)'}}>
        <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">Social Media Takedown</DialogTitle>
        <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">Report impersonation on social media platforms.</DialogDescription>
        <div className="space-y-3 mt-4">
          <Input className="cyber-input" placeholder="Target Profile URL" value={smForm.profileUrl} onChange={e=>setSmForm({...smForm,profileUrl:e.target.value})} />
          <CyberSelect options={[
            {value:'FACEBOOK',label:'Facebook / Meta'},
            {value:'TWITTER',label:'X / Twitter'},
            {value:'LINKEDIN',label:'LinkedIn'},
            {value:'INSTAGRAM',label:'Instagram'},
            {value:'TIKTOK',label:'TikTok'},
            {value:'OTHER',label:'Other'},
          ]} value={smForm.platform} onChange={v=>setSmForm({...smForm,platform:v})} placeholder="Platform" />
          <Input className="cyber-input" placeholder="Impersonated Entity (e.g. CEO name, brand)" value={smForm.impersonatedEntity} onChange={e=>setSmForm({...smForm,impersonatedEntity:e.target.value})} />
          <Input className="cyber-input" placeholder="Description of threat / impersonation" value={smForm.description} onChange={e=>setSmForm({...smForm,description:e.target.value})} />
          <Input className="cyber-input" placeholder="Evidence URLs (one per line)" value={smForm.evidenceFiles} onChange={e=>setSmForm({...smForm,evidenceFiles:e.target.value})} />
          <div className="flex justify-end gap-2 pt-2">
            <HUDButton variant="cyan" size="sm" onClick={()=>setShowSM(false)}>{t('mitigation.cancel')}</HUDButton>
            <HUDButton variant="yellow" size="sm" onClick={handleSM} loading={submitSM.isPending} disabled={!smForm.profileUrl||!smForm.impersonatedEntity||!smForm.description} glitchText="SUBMIT"><Globe className="h-4 w-4" /></HUDButton>
          </div>
        </div>
      </DialogContent></Dialog>

      {/* Analyst Command Center */}
      <Sheet open={!!showAnalyst} onOpenChange={() => { setShowAnalyst(null); setAnalystNote(''); setAnalystNewStatus(''); setDraftCopied(false); }}>
        <SheetContent
          className="h-full p-0 gap-0 border-l border-[rgba(0,246,255,0.2)] w-[90vw] sm:w-[380px] md:w-[440px] lg:w-[520px] xl:w-[580px] 2xl:w-[640px]"
          style={{ background: '#0B0F14' }}
        >
          {/* ─── Scrollable content area ─── */}
          <div className="flex-1 overflow-y-auto overflow-x-visible">
            <SheetHeader className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] shrink-0">
              <SheetTitle className="font-mono text-[#00F6FF] text-sm tracking-wider">Analyst Command Center</SheetTitle>
              <SheetDescription className="font-mono text-[10px] text-[#6F7C89]">Enterprise takedown intervention panel</SheetDescription>
            </SheetHeader>

            {/* Intelligence Summary */}
            <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.05)] space-y-1.5">
              <p className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider">Target URL</p>
              <p className="text-[11px] font-mono text-[#00F6FF] break-all">{showAnalyst?.targetUrl || showAnalyst?.profileUrl || '—'}</p>
              {showAnalyst?.impersonatedEntity && (<><p className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider mt-2">Impersonated Entity</p><p className="text-[11px] font-mono text-white">{showAnalyst.impersonatedEntity}</p></>)}
              <div className="flex gap-3 mt-2">
                <div><p className="text-[8px] font-mono text-[#6F7C89] uppercase">Status</p><span className={`text-[10px] font-mono ${statusColors[showAnalyst?.status] || 'text-[#6F7C89]'}`}>{showAnalyst?.status}</span></div>
                <div><p className="text-[8px] font-mono text-[#6F7C89] uppercase">Type</p><span className="text-[10px] font-mono text-white">{showAnalyst?.targetType || 'DOMAIN'}</span></div>
              </div>
            </div>

            {/* Audit Timeline */}
            <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-3.5 w-3.5 text-[#00F6FF]" />
                <span className="text-[9px] font-mono text-[#00F6FF] uppercase tracking-wider">Audit Timeline</span>
              </div>
              {showAnalyst?.analystLogs?.length ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {showAnalyst.analystLogs.map((log: any, i: number) => (
                    <div key={i} className="border-l-2 border-[#00F6FF] pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-[#6F7C89]" />
                        <span className="text-[9px] font-mono text-[#6F7C89]">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white mt-0.5">
                        <span className="text-[#FCEE09]">{log.previousStatus}</span>
                        <span className="text-[#6F7C89] mx-1">→</span>
                        <span className={`${statusColors[log.newStatus] || 'text-white'}`}>{log.newStatus}</span>
                      </p>
                      <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5">{log.note}</p>
                      <p className="text-[8px] font-mono text-[#6F7C89] mt-0.5">by {log.analystName}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[10px] font-mono text-[#6F7C89] py-3 text-center">No analyst interventions yet</p>}
            </div>

            {/* Draft Content (visible when DRAFT) */}
            {showAnalyst?.status === 'DRAFT' && showAnalyst?.draftContent && (
              <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3.5 w-3.5 text-[#FCEE09]" />
                  <span className="text-[9px] font-mono text-[#FCEE09] uppercase tracking-wider">Draft Content</span>
                </div>
                <textarea value={showAnalyst.draftContent} readOnly
                  className="w-full h-32 px-3 py-2 text-[10px] font-mono text-[#00FF41] bg-[rgba(0,0,0,0.8)] border border-white/5 outline-none resize-none leading-relaxed"
                  style={{background:'#050508'}} />
                <div className="flex gap-2 mt-2">
                  <HUDButton variant="cyan" size="sm" onClick={handleCopyDraft} className="flex-1" glitchText="COPY">
                    <Copy className="h-4 w-4" /> {draftCopied ? '✓ Copied!' : 'Copy Draft'}
                  </HUDButton>
                  <HUDButton variant="cyan" size="sm" onClick={handleDownloadEvidence} className="flex-1"
                    disabled={!showAnalyst?.evidenceFiles?.length}>
                    <Download className="h-4 w-4" /> Download Evidence
                  </HUDButton>
                </div>
                <HUDButton variant="cyan" size="sm" onClick={() => handleGenerateDraft(showAnalyst)} className="w-full mt-2" glitchText="EDIT">
                  <FileText className="h-4 w-4" /> Edit & Send Draft
                </HUDButton>
              </div>
            )}

            {/* One-Click Auto Execute */}
            {showAnalyst?.status !== 'SUCCESSFUL' && showAnalyst?.status !== 'REJECTED' && (
              <div className="px-5 py-2 border-b border-[rgba(255,255,255,0.05)] space-y-2">
                <HUDButton variant="red" size="sm" onClick={() => setShowOneClick(showAnalyst)} className="w-full" glitchText="EXECUTE">
                  ⚡ Auto-Execute Takedown
                </HUDButton>
                <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                  <HUDButton variant="cyan" size="sm" onClick={() => handleTestOneClick()} className="w-full text-[10px]" glitchText="TEST">
                    🧪 Test One-Click ({testEmail ? testEmail : 'set email'})
                  </HUDButton>
                </RoleGuard>
              </div>
            )}

            {/* Generate Legal Draft (only when not DRAFT) */}
            {showAnalyst?.status !== 'DRAFT' && (
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST']}>
                <div className="px-5 py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <HUDButton variant="cyan" size="sm" onClick={() => handleGenerateDraft(showAnalyst)} className="w-full" glitchText="GENERATE">
                    <FileText className="h-4 w-4" /> Generate Legal Draft
                  </HUDButton>
                </div>
              </RoleGuard>
            )}

            {/* Intervention Form — hidden when REJECTED or SUCCESSFUL */}
            {showAnalyst?.status !== 'REJECTED' && showAnalyst?.status !== 'SUCCESSFUL' && (
            <div className="px-5 py-3 space-y-3 overflow-visible">
              <div className="flex items-center gap-2 mb-1">
                <Send className="h-3.5 w-3.5 text-[#FCEE09]" />
                <span className="text-[9px] font-mono text-[#FCEE09] uppercase tracking-wider">Manual Intervention</span>
              </div>
              <CyberSelect options={[
                { value: 'IN_REVIEW', label: 'IN_REVIEW — ⏳ Analyst Follow-up' },
                { value: 'ESCALATED_VIP', label: 'ESCALATED_VIP — 🔥 VIP/Legal Channel' },
                { value: 'SUCCESSFUL', label: 'SUCCESSFUL — ✅ Takedown Confirmed' },
                { value: 'REJECTED', label: 'REJECTED — ❌ Cannot Proceed' },
              ].filter(o => o.value !== showAnalyst?.status)} value={analystNewStatus} onChange={setAnalystNewStatus} placeholder={analystNewStatus ? '' : 'Select next status...'} />
              <Input className="cyber-input" placeholder="Analyst notes (required)" value={analystNote} onChange={e => setAnalystNote(e.target.value)} />
              {analystSuccess && <p className="text-[10px] font-mono text-[#00FF41]">✓ {analystSuccess}</p>}
              {updateStatus.isError && <p className="text-[10px] font-mono text-[#FF003C]">✕ Update failed</p>}
            </div>
            )}
          </div>

          {/* ─── Sticky Action Footer ─── */}
          <div className="shrink-0 border-t border-[rgba(255,255,255,0.08)] bg-[#0B0F14] px-5 py-3"
               style={{ boxShadow: '0 -4px 12px rgba(0,0,0,0.3)' }}>
            <div className="flex flex-wrap items-stretch gap-2 max-w-lg mx-auto">
              {showAnalyst?.analystLogs?.length > 0 && (
                <HUDButton variant="cyan" size="sm" onClick={handleCopyLogs} className="flex-1 min-w-[140px]">
                  <Copy className="h-3.5 w-3.5 shrink-0" /> Copy All Logs
                </HUDButton>
              )}
              <HUDButton variant="cyan" size="sm" onClick={() => { setShowAnalyst(null); setAnalystNote(''); setAnalystNewStatus(''); }}
                className="flex-1 min-w-[70px]">Close</HUDButton>
              <HUDButton variant="yellow" size="sm" onClick={handleAnalystUpdate} loading={updateStatus.isPending}
                disabled={!analystNewStatus || !analystNote} glitchText="UPDATE" className="flex-[1.5] min-w-[110px]">
                <Send className="h-3.5 w-3.5 shrink-0" /> Update Status
              </HUDButton>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Legal Draft Dialog */}
      <Dialog open={!!showLegal} onOpenChange={() => { setShowLegal(null); setLegalDraft(''); setLegalTo(''); setLegalCc(''); setLegalSubject(''); setDraftSaved(false); setDraftCopied(false); }}>
        <DialogContent className="sm:max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden" style={{background:'#0B0F14',border:'1px solid rgba(0,246,255,0.2)'}}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">{legalSent ? '✓ Sent Successfully' : 'Legal Draft Preview'}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">
            {legalSent ? 'Legal notice dispatched to the platform.' : 'Review and edit the legal notice before sending.'}
          </DialogDescription>
          {!legalSent ? (<div className="space-y-4">
            {/* Form card — padding visual bikin input gak nempel ke tepi */}
            <div className="rounded-md border border-white/5 bg-[rgba(255,255,255,0.015)] p-3 sm:p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div><p className="text-[9px] font-mono text-[#6F7C89] mb-1.5">To *</p>
                  <Input className="cyber-input" placeholder="abuse@platform.com" value={legalTo} onChange={e=>setLegalTo(e.target.value)} /></div>
                <div><p className="text-[9px] font-mono text-[#6F7C89] mb-1.5">CC</p>
                  <Input className="cyber-input" placeholder="legal@company.com" value={legalCc} onChange={e=>setLegalCc(e.target.value)} /></div>
              </div>
              <div><p className="text-[9px] font-mono text-[#6F7C89] mb-1.5">Subject</p>
                <Input className="cyber-input" value={legalSubject} onChange={e=>setLegalSubject(e.target.value)} /></div>
              <div><p className="text-[9px] font-mono text-[#6F7C89] mb-1.5">Legal Notice Body</p>
                <textarea value={legalDraft} onChange={e=>setLegalDraft(e.target.value)}
                  className="w-full min-h-[200px] max-h-[55vh] px-3 py-2 text-xs font-mono text-[#00FF41] bg-[rgba(0,0,0,0.8)] border border-white/5 outline-none focus:border-[#00F6FF]/30 resize-y leading-relaxed break-all whitespace-pre-wrap"
                  style={{background:'#050508'}} /></div>
            </div>
            {/* Buttons section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {draftSaved && <span className="text-[9px] font-mono text-[#00FF41]">✓ Draft saved</span>}
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <HUDButton variant="cyan" size="sm" onClick={handleSaveDraft} loading={savingDraft}
                  disabled={!legalDraft} className="flex-1 sm:flex-none"><FileText className="h-4 w-4" /> Save Draft</HUDButton>
                <HUDButton variant="yellow" size="sm" onClick={handleMarkSubmitted} glitchText="SUBMIT" className="flex-1 sm:flex-none">
                  <Send className="h-4 w-4" /> Mark as Submitted
                </HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={handleDispatchEmail} loading={legalSending}
                  disabled={!legalTo||!legalSubject||!legalDraft}><Mail className="h-4 w-4" /> Approve &amp; Send</HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={()=>{setShowLegal(null);setLegalDraft('');setLegalTo('');setLegalCc('');setDraftSaved(false);setDraftCopied(false);}}>{t('mitigation.cancel')}</HUDButton>
              </div>
            </div>
          </div>) : (
            <div className="py-8 text-center">
              <p className="text-[10px] font-mono text-[#00FF41]">✓ Legal notice has been sent and status updated to ESCALATED_VIP.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={showBulkStatus} onOpenChange={setShowBulkStatus}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6" style={{background:'#0B0F14',border:'1px solid rgba(252,238,9,0.2)'}}>
          <DialogTitle className="font-mono text-[#FCEE09] tracking-wider">Bulk Update Status</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">
            Update status for {selectedIds.length} selected items.
          </DialogDescription>
          <div className="space-y-3 mt-4">
            <CyberSelect options={[
              { value: 'IN_REVIEW', label: 'IN_REVIEW — Analyst Follow-up' },
              { value: 'ESCALATED_VIP', label: 'ESCALATED_VIP — VIP/Legal Channel' },
              { value: 'SUCCESSFUL', label: 'SUCCESSFUL — Takedown Confirmed' },
              { value: 'REJECTED', label: 'REJECTED — Cannot Proceed' },
            ]} value={bulkStatusValue} onChange={setBulkStatusValue} placeholder="Select status" />
            <Input className="cyber-input" placeholder="Note (required)" value={bulkNote} onChange={e => setBulkNote(e.target.value)} />
            <div className="flex justify-end gap-2 pt-2">
              <HUDButton variant="cyan" size="sm" onClick={() => setShowBulkStatus(false)}>Cancel</HUDButton>
              <HUDButton variant="yellow" size="sm" onClick={handleBulkStatusUpdate}
                disabled={!bulkStatusValue || !bulkNote} glitchText="UPDATE">
                <Send className="h-4 w-4" /> Update
              </HUDButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* One-Click AlertDialog */}
      <Dialog open={!!showOneClick} onOpenChange={() => { if (!executingOneClick) { setShowOneClick(null); setOneClickResult(null); } }}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: `1px solid ${isKominfoItem(showOneClick) ? 'rgba(0,246,255,0.3)' : 'rgba(255,0,60,0.3)'}` }}>
          <DialogTitle className={`font-mono tracking-wider ${isKominfoItem(showOneClick) ? 'text-[#00F6FF]' : 'text-[#FF003C]'}`}>
            {isKominfoItem(showOneClick) ? '🇮🇩 Laporan ke Kominfo Trust+' :
             showOneClickPortalOnly(showOneClick) ? '📋 Manual Report Required' :
             '⚡ Auto-Execute Takedown'}
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1 leading-relaxed">
            {isKominfoItem(showOneClick) ? (
              <>This report will be sent to <span className="text-white">Kementerian Kominfo RI</span>
              {'\n'}via <span className="text-[#00F6FF] font-mono">aduankonten@kominfo.go.id</span>
              {'\n'}with formal 5W1H format per Kominfo standards.</>
            ) : showOneClickPortalOnly(showOneClick) ? (
              <>This platform (<span className="text-white">{showOneClick?.socialPlatform || showOneClick?.platform}</span>) does not accept automated reports.
              {'\n'}Please use the portal link below to submit manually.</>
            ) : (
              <>Are you sure you want to execute this takedown to <span className="text-white">{showOneClick?.socialPlatform || showOneClick?.platform || 'the platform'}</span>?
              {'\n'}This will dispatch the report automatically via email.</>
            )}
          </DialogDescription>

          {oneClickResult === 'success' ? (
            <div className="py-4 text-center">
              <p className="text-[#00FF41] font-mono text-xs">
                ✓ Report successfully {isKominfoItem(showOneClick) ? 'dispatched to Kominfo ITSM' : 'processed successfully!'}
              </p>
            </div>
          ) : oneClickResult === 'error' ? (
            <div className="py-4 text-center">
              <p className="text-[#FF003C] font-mono text-xs">✕ Failed. Check logs for details.</p>
              <HUDButton variant="cyan" size="sm" onClick={() => { setShowOneClick(null); setOneClickResult(null); }} className="mt-3">Close</HUDButton>
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {showOneClickPortalOnly(showOneClick) && (
                <>
                  <div className="border border-[rgba(255,255,255,0.1)] p-3">
                    <p className="text-[9px] font-mono text-[#6F7C89] mb-2 uppercase tracking-wider">Portal Report Link</p>
                    <a href={PORTAL_URLS[showOneClick?.socialPlatform || ''] || '#'}
                      target="_blank" rel="noopener noreferrer"
                      className="text-[10px] font-mono text-[#00F6FF] underline break-all hover:text-white">
                      {PORTAL_URLS[showOneClick?.socialPlatform || ''] || 'Platform portal not configured'}
                    </a>
                  </div>
                  <HUDButton variant="cyan" size="sm" onClick={handleCopyDraft} className="w-full" glitchText="COPY DRAFT">
                    <Copy className="h-4 w-4" /> Copy Draft & Submit Manually
                  </HUDButton>
                </>
              )}
              <div className="flex justify-end gap-2">
                <HUDButton variant="cyan" size="sm" onClick={() => { setShowOneClick(null); setOneClickResult(null); }} disabled={executingOneClick}>Close</HUDButton>
                {!showOneClickPortalOnly(showOneClick) && (
                  <HUDButton variant={isKominfoItem(showOneClick) ? 'cyan' : 'red'} size="sm" onClick={handleOneClick} loading={executingOneClick} glitchText="EXECUTE">
                    {isKominfoItem(showOneClick) ? '🇮🇩 Kirim ke Kominfo' : '⚡ Execute Now'}
                  </HUDButton>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test One-Click Dialog */}
      <Dialog open={showTestDialog} onOpenChange={() => { setShowTestDialog(false); setTestResult(null); }}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">🧪 Test One-Click Report</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">
            Send a test report to validate the dispatch pipeline.
          </DialogDescription>
          <div className="space-y-3 mt-4">
            {!testResult ? (
              <>
                <div>
                  <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1">Test Email</label>
                  <Input className="cyber-input" placeholder="you@example.com" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                </div>
                <div className="py-4 text-center">
                  <p className="text-xs font-mono text-[#00F6FF] animate-pulse">Generating draft & sending...</p>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className={`text-xs font-mono ${testResult.ok ? 'text-[#00FF41]' : 'text-[#FF003C]'}`}>
                  {testResult.ok ? '✓' : '✕'} {testResult.msg}
                </p>
                <HUDButton variant="cyan" size="sm" onClick={() => { setShowTestDialog(false); setTestResult(null); }} className="mt-3">Close</HUDButton>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
