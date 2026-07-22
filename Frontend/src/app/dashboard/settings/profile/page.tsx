'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { HUDInput } from '@/components/cyber/HUDInput';
import { CyberSelect } from '@/components/cyber/CyberSelect';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import {
  Terminal, User, Upload, Camera, Lock, Shield, Smartphone, Key, Globe,
  Clock, MapPin, Briefcase, Download, AlertTriangle, XCircle, CheckCircle,
  Eye, EyeOff, Copy, Trash2, Plus, Activity, LogOut
} from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const TIMEZONES = ['Asia/Jakarta', 'Asia/Singapore', 'Asia/Tokyo', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Australia/Sydney', 'Pacific/Auckland'];
const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'id', label: 'Bahasa Indonesia' }];

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const updateUser = useAuthStore(s => s.updateUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'tokens'>('profile');

  // ── Profile Form ──
  const [avatar, setAvatar] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', jobTitle: '', department: '', location: '', timezone: 'Asia/Jakarta', language: 'en' });

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f, name: user.name || '', email: user.email || '',
        phone: (user as any).phone || '', jobTitle: (user as any).jobTitle || '',
        department: (user as any).department || '', location: (user as any).location || '',
        timezone: (user as any).timezone || 'Asia/Jakarta', language: (user as any).language || 'en',
      }));
      if ((user as any).avatarUrl) setAvatar((user as any).avatarUrl);
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: async (data: any) => { const res = await apiClient.put(ENDPOINTS.AUTH_ME, data); return res.data.user; },
    onSuccess: (u) => { updateUser(u); setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });
  const handleSave = () => {
    const payload: any = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== (user as any)?.[k]) payload[k] = v; });
    if (avatar !== (user as any)?.avatarUrl) payload.avatarUrl = avatar;
    if (!Object.keys(payload).length) { setSaved(true); setTimeout(() => setSaved(false), 1500); return; }
    updateProfile.mutate(payload);
  };
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Password ──
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<string[]>([]);
  const [pwStrength, setPwStrength] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const changePw = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`${ENDPOINTS.AUTH_LOGOUT.replace('/logout', '/change-password')}`, { currentPassword: pw.current, newPassword: pw.newPw });
      return res.data;
    },
    onSuccess: () => { setPw({ current: '', newPw: '', confirm: '' }); setPwErrors([]); setPwStrength(0); },
  });
  const validatePassword = (p: string): string[] => {
    const e: string[] = [];
    if (p.length < 8) e.push('Minimum 8 characters');
    if (!/[A-Z]/.test(p)) e.push('At least one uppercase letter');
    if (!/[a-z]/.test(p)) e.push('At least one lowercase letter');
    if (!/[0-9]/.test(p)) e.push('At least one number');
    if (!/[^A-Za-z0-9]/.test(p)) e.push('At least one special character');
    return e;
  };
  const calcPwStrength = (p: string) => {
    let s = 0; if (p.length >= 8) s += 20; if (p.length >= 12) s += 10;
    if (/[A-Z]/.test(p)) s += 20; if (/[a-z]/.test(p)) s += 15;
    if (/[0-9]/.test(p)) s += 15; if (/[^A-Za-z0-9]/.test(p)) s += 20;
    return Math.min(s, 100);
  };
  const handleChangePw = () => {
    const errs = validatePassword(pw.newPw); setPwErrors(errs);
    if (errs.length > 0) return;
    if (pw.newPw !== pw.confirm) { setPwErrors(['Passwords do not match']); return; }
    changePw.mutate();
  };

  // ── 2FA ──
  const [twofaStatus, setTwofaStatus] = useState<'loading' | 'off' | 'on' | 'setup'>('loading');
  const [twofaQr, setTwofaQr] = useState(''); const [twofaSecret, setTwofaSecret] = useState('');
  const [twofaVerifyToken, setTwofaVerifyToken] = useState(''); const [twofaDisablePw, setTwofaDisablePw] = useState('');
  const [twofaMsg, setTwofaMsg] = useState(''); const [twofaMsgErr, setTwofaMsgErr] = useState(false);

  useEffect(() => { apiClient.get(ENDPOINTS.TWOFA_STATUS).then(r => setTwofaStatus(r.data.totpEnabled ? 'on' : 'off')).catch(() => setTwofaStatus('off')); }, []);

  const handleTwofaSetup = async () => {
    try { const res = await apiClient.post(ENDPOINTS.TWOFA_SETUP); setTwofaQr(res.data.qrCode); setTwofaSecret(res.data.manualKey); setTwofaStatus('setup'); setTwofaMsg(''); }
    catch { setTwofaMsg('Failed to generate 2FA setup.'); setTwofaMsgErr(true); }
  };
  const handleTwofaVerify = async () => {
    if (twofaVerifyToken.length < 6) return;
    try { await apiClient.post(ENDPOINTS.TWOFA_VERIFY, { token: twofaVerifyToken }); setTwofaStatus('on'); setTwofaQr(''); setTwofaSecret(''); setTwofaVerifyToken(''); setTwofaMsg('2FA enabled successfully.'); setTwofaMsgErr(false); setTimeout(() => setTwofaMsg(''), 3000); }
    catch (err: any) { setTwofaMsg(err?.response?.data?.message || 'Invalid code.'); setTwofaMsgErr(true); }
  };
  const handleTwofaDisable = async () => {
    if (!twofaDisablePw) return;
    try { await apiClient.post(ENDPOINTS.TWOFA_DISABLE, { password: twofaDisablePw }); setTwofaStatus('off'); setTwofaDisablePw(''); setTwofaMsg('2FA disabled.'); setTwofaMsgErr(false); setTimeout(() => setTwofaMsg(''), 3000); }
    catch (err: any) { setTwofaMsg(err?.response?.data?.message || 'Failed to disable 2FA.'); setTwofaMsgErr(true); }
  };

  // ── Sessions ──
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'], queryFn: async () => { const res = await apiClient.get(ENDPOINTS.SESSIONS); return res.data; },
  });

  // ── API Tokens ──
  const { data: tokensData, refetch: refetchTokens } = useQuery({
    queryKey: ['api-tokens'], queryFn: async () => { const res = await apiClient.get(ENDPOINTS.TOKENS); return res.data; },
  });
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenDays, setNewTokenDays] = useState(90);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateToken = async () => {
    try {
      const res = await apiClient.post(ENDPOINTS.TOKENS, { name: newTokenName, expiresInDays: newTokenDays });
      setCreatedToken(res.data.token);
      refetchTokens();
    } catch { setTwofaMsg('Failed to create token.'); setTwofaMsgErr(true); }
  };
  const handleRevokeToken = async (id: string) => {
    try { await apiClient.delete(`${ENDPOINTS.TOKENS}/${id}`); refetchTokens(); }
    catch { setTwofaMsg('Failed to revoke token.'); setTwofaMsgErr(true); }
  };
  const handleCopyToken = () => {
    if (createdToken) { navigator.clipboard.writeText(createdToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // ── Danger Zone ──
  const [showDanger, setShowDanger] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState('');

  const strengthColor = pwStrength >= 80 ? '#00FF41' : pwStrength >= 50 ? '#FCEE09' : '#FF003C';
  const strengthLabel = pwStrength >= 80 ? 'Strong' : pwStrength >= 50 ? 'Medium' : 'Weak';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—';
  const lastLogin = (user as any)?.lastLoginAt ? new Date((user as any).lastLoginAt).toLocaleString() : '—';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'tokens', label: 'API Tokens', icon: Key },
  ] as const;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-2 border-[#00F6FF] pl-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-14 h-14 shrink-0 border-2 border-[#00F6FF] flex items-center justify-center overflow-hidden" style={{ background: 'rgba(0,246,255,0.05)' }}>
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-[#6F7C89]" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-[0.15em] text-white font-mono uppercase truncate">{user?.name || 'User'}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[9px] font-mono text-[#00F6FF] px-1.5 py-0.5 border border-[#00F6FF]/30">{user?.role?.replace(/_/g, ' ') || '—'}</span>
              <span className="text-[9px] font-mono text-[#6F7C89]">Member since {memberSince}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemAnim} className="flex gap-1 border-b border-white/5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors ${activeTab === tab.id ? 'text-[#00F6FF] border-b-2 border-[#00F6FF]' : 'text-[#6F7C89] hover:text-white'}`}>
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* ═══ PROFILE TAB ═══ */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Avatar Card */}
          <motion.div variants={itemAnim}>
            <HUDCard title="Photo" accent="cyan" icon={<Camera className="h-3.5 w-3.5" />}>
              <div className="flex flex-col items-center py-4">
                <div className="relative mb-3">
                  <div className="w-28 h-28 border-2 border-[#00F6FF] flex items-center justify-center overflow-hidden" style={{ background: 'rgba(0,246,255,0.05)' }}>
                    {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <User className="h-12 w-12 text-[#6F7C89]" />}
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-[#00F6FF] text-[#050505] hover:shadow-[0_0_12px_rgba(0,246,255,0.4)] transition-all">
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <p className="text-[9px] font-mono text-[#6F7C89]">PNG, JPG. Max 5MB.</p>
              </div>
            </HUDCard>
          </motion.div>

          {/* Personal Info */}
          <motion.div variants={itemAnim} className="lg:col-span-2">
            <HUDCard title="Personal Information" accent="cyan" icon={<User className="h-3.5 w-3.5" />}>
              <div className="grid gap-4 sm:grid-cols-2">
                <HUDInput label="Full Name" value={form.name} onChange={v => setForm({...form, name: v})} icon={<User className="h-3 w-3" />} />
                <HUDInput label="Email Address" value={form.email} onChange={v => setForm({...form, email: v})} icon={<Terminal className="h-3 w-3" />} />
                <HUDInput label="Phone Number" value={form.phone} onChange={v => setForm({...form, phone: v})} icon={<Smartphone className="h-3 w-3" />} />
                <HUDInput label="Job Title" value={form.jobTitle} onChange={v => setForm({...form, jobTitle: v})} icon={<Briefcase className="h-3 w-3" />} />
                <HUDInput label="Department" value={form.department} onChange={v => setForm({...form, department: v})} icon={<Briefcase className="h-3 w-3" />} />
                <HUDInput label="Location" value={form.location} onChange={v => setForm({...form, location: v})} icon={<MapPin className="h-3 w-3" />} />
                <div>
                  <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1">Timezone</label>
                  <CyberSelect options={TIMEZONES.map(tz => ({ value: tz, label: tz }))} value={form.timezone} onChange={v => setForm({...form, timezone: v})} placeholder="Select timezone..." />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1">Language</label>
                  <CyberSelect options={LANGUAGES} value={form.language} onChange={v => setForm({...form, language: v})} placeholder="Select language..." />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
                <HUDButton variant="yellow" size="sm" onClick={handleSave} loading={updateProfile.isPending} glitchText="Save Changes">
                  <Terminal className="h-3.5 w-3.5" />
                </HUDButton>
                {saved && <span className="text-[10px] font-mono text-[#00FF41]">✓ Saved</span>}
                {updateProfile.isError && <span className="text-[10px] font-mono text-[#FF003C]">✕ {((updateProfile.error as any)?.message) || 'Error'}</span>}
              </div>
            </HUDCard>
          </motion.div>

          {/* Account Info */}
          <motion.div variants={itemAnim} className="lg:col-span-3">
            <HUDCard title="Account Overview" accent="cyan" icon={<Activity className="h-3.5 w-3.5" />}>
              <div className="grid gap-4 sm:grid-cols-3 text-[10px] font-mono">
                <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[#6F7C89] uppercase tracking-wider mb-1">Role</p>
                  <p className="text-white">{user?.role?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[#6F7C89] uppercase tracking-wider mb-1">Last Login</p>
                  <p className="text-white">{lastLogin}</p>
                </div>
                <div className="p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <p className="text-[#6F7C89] uppercase tracking-wider mb-1">Tenant</p>
                  <p className="text-white">{user?.tenant?.name || (user as any)?.tenantId || '—'}</p>
                </div>
              </div>
            </HUDCard>
          </motion.div>
        </div>
      )}

      {/* ═══ SECURITY TAB ═══ */}
      {activeTab === 'security' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Password */}
          <motion.div variants={itemAnim}>
            <HUDCard title="Password" accent="yellow" icon={<Lock className="h-3.5 w-3.5" />}>
              <div className="space-y-3">
                <div className="relative">
                  <HUDInput label="Current Password" value={pw.current} onChange={v => setPw({...pw, current: v})} type={showPw ? 'text' : 'password'} />
                </div>
                <div className="relative">
                  <HUDInput label="New Password" value={pw.newPw} onChange={v => { setPw({...pw, newPw: v}); setPwStrength(calcPwStrength(v)); }} type={showPw ? 'text' : 'password'} />
                </div>
                {pw.newPw && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${pwStrength}%`, background: strengthColor }} />
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: strengthColor }}>{strengthLabel}</span>
                    </div>
                    <button onClick={() => setShowPw(!showPw)} className="text-[8px] font-mono text-[#6F7C89] hover:text-white transition-colors">
                      {showPw ? <EyeOff className="h-3 w-3 inline mr-1" /> : <Eye className="h-3 w-3 inline mr-1" />}
                      {showPw ? 'Hide' : 'Show'} password
                    </button>
                  </div>
                )}
                <div>
                  <HUDInput label="Confirm New Password" value={pw.confirm} onChange={v => setPw({...pw, confirm: v})} type={showPw ? 'text' : 'password'} />
                </div>
                {pwErrors.length > 0 && (
                  <div className="border border-[#FF003C] p-2" style={{ background: 'rgba(255,0,60,0.05)' }}>
                    {pwErrors.map((e, i) => (
                      <p key={i} className="text-[9px] font-mono text-[#FF003C] flex items-center gap-1"><XCircle className="h-2.5 w-2.5" /> {e}</p>
                    ))}
                  </div>
                )}
                {changePw.isSuccess && <p className="text-[10px] font-mono text-[#00FF41]">✓ Password updated successfully.</p>}
                {changePw.isError && <p className="text-[10px] font-mono text-[#FF003C]">✕ {(changePw.error as any)?.message || 'Failed to update password.'}</p>}
                <HUDButton variant="yellow" size="sm" onClick={handleChangePw} loading={changePw.isPending}
                  disabled={!pw.current || !pw.newPw || !pw.confirm} glitchText="Update">
                  <Lock className="h-3.5 w-3.5" />
                </HUDButton>
              </div>
            </HUDCard>
          </motion.div>

          {/* 2FA */}
          <motion.div variants={itemAnim}>
            <HUDCard title="Two-Factor Authentication" accent="cyan" icon={<Shield className="h-3.5 w-3.5" />}>
              {twofaMsg && (
                <div className={`mb-3 border p-2 ${twofaMsgErr ? 'border-[#FF003C] bg-[rgba(255,0,60,0.05)]' : 'border-[#00FF41] bg-[rgba(0,255,65,0.05)]'}`}>
                  <p className={`text-[9px] font-mono ${twofaMsgErr ? 'text-[#FF003C]' : 'text-[#00FF41]'}`}>{twofaMsg}</p>
                </div>
              )}
              {twofaStatus === 'loading' && <div className="py-3 text-center text-[10px] font-mono text-[#6F7C89]">Loading...</div>}

              {twofaStatus === 'off' && (
                <div className="py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#6F7C89]" />
                    <span className="text-[10px] font-mono text-[#6F7C89]">Status: <span className="text-[#6F7C89]">Disabled</span></span>
                  </div>
                  <p className="text-[9px] font-mono text-[#6F7C89]">Add an extra layer of security with Google Authenticator or Microsoft Authenticator.</p>
                  <HUDButton variant="cyan" size="sm" onClick={handleTwofaSetup}>
                    <Lock className="h-3.5 w-3.5" /> Enable 2FA
                  </HUDButton>
                </div>
              )}

              {twofaStatus === 'setup' && (
                <div className="py-3 space-y-3">
                  <p className="text-[9px] font-mono text-[#6F7C89]">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
                  <div className="flex justify-center">
                    {twofaQr && <img src={twofaQr} alt="QR" className="border-2 border-[#00F6FF] p-1" style={{ background: 'white', width: 160, height: 160 }} />}
                  </div>
                  {twofaSecret && (
                    <div className="text-center">
                      <p className="text-[8px] font-mono text-[#6F7C89] uppercase">Manual Key</p>
                      <p className="text-[11px] font-mono text-[#00F6FF] tracking-wider mt-0.5 select-all">{twofaSecret}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 max-w-xs mx-auto">
                    <input value={twofaVerifyToken} onChange={e => setTwofaVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" maxLength={6} autoFocus
                      className="w-full text-center text-lg tracking-[0.3em] px-3 py-2 font-mono border outline-none"
                      style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(0,246,255,0.2)', color: '#00F6FF' }} />
                    <HUDButton variant="cyan" size="sm" onClick={handleTwofaVerify} disabled={twofaVerifyToken.length < 6}>Verify</HUDButton>
                  </div>
                  <button onClick={() => setTwofaStatus('off')} className="block mx-auto text-[8px] font-mono text-[#6F7C89] hover:text-white">Cancel</button>
                </div>
              )}

              {twofaStatus === 'on' && (
                <div className="py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#00FF41]" />
                    <span className="text-[10px] font-mono text-[#00FF41]">Status: <span className="text-[#00FF41]">Enabled</span></span>
                  </div>
                  <p className="text-[9px] font-mono text-[#6F7C89]">Your account is protected by two-factor authentication.</p>
                  <div className="flex gap-2">
                    <input value={twofaDisablePw} onChange={e => setTwofaDisablePw(e.target.value)} type="password" placeholder="Enter password to disable"
                      className="flex-1 px-3 py-2 text-[10px] font-mono border outline-none"
                      style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
                    <HUDButton variant="red" size="sm" onClick={handleTwofaDisable} disabled={!twofaDisablePw}>Disable</HUDButton>
                  </div>
                </div>
              )}
            </HUDCard>
          </motion.div>

          {/* Active Sessions */}
          <motion.div variants={itemAnim}>
            <HUDCard title="Active Sessions" accent="cyan" icon={<Globe className="h-3.5 w-3.5" />}>
              <div className="space-y-2">
                {sessionsData?.data?.length === 0 && (
                  <p className="text-[10px] font-mono text-[#6F7C89] py-3 text-center">No active sessions.</p>
                )}
                {sessionsData?.data?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2" style={{ background: s.isCurrent ? 'rgba(0,246,255,0.05)' : 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Activity className="h-3 w-3 text-[#00F6FF] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-white truncate">{s.device || s.id}</p>
                        <p className="text-[8px] font-mono text-[#6F7C89]">IP: {s.ip || '—'} · Last active: {s.lastActive ? new Date(s.lastActive).toLocaleString() : '—'}</p>
                      </div>
                    </div>
                    {s.isCurrent && <span className="text-[8px] font-mono text-[#00F6FF] px-1.5 py-0.5 border border-[#00F6FF]/30 shrink-0">Current</span>}
                  </div>
                ))}
              </div>
            </HUDCard>
          </motion.div>

          {/* Danger Zone */}
          <motion.div variants={itemAnim}>
            <HUDCard title="Account Actions" accent="red" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
              <div className="space-y-3 py-2">
                <div>
                  <p className="text-[10px] font-mono text-white mb-1">Export My Data</p>
                  <p className="text-[8px] font-mono text-[#6F7C89] mb-2">Download all your personal data and account information.</p>
                  <HUDButton variant="cyan" size="sm" onClick={() => window.open('/api/v1/auth/me', '_blank')}>
                    <Download className="h-3.5 w-3.5" /> Export Data
                  </HUDButton>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-[10px] font-mono text-[#FF003C] mb-1">Deactivate Account</p>
                  <p className="text-[8px] font-mono text-[#6F7C89] mb-2">Permanently deactivate your account. This action can be reversed within 30 days.</p>
                  <HUDButton variant="red" size="sm" onClick={() => setShowDanger(true)}>
                    <Trash2 className="h-3.5 w-3.5" /> Deactivate
                  </HUDButton>
                </div>
              </div>
            </HUDCard>
          </motion.div>
        </div>
      )}

      {/* ═══ API TOKENS TAB ═══ */}
      {activeTab === 'tokens' && (
        <motion.div variants={itemAnim} className="space-y-4">
          <HUDCard title="API Tokens" accent="cyan" icon={<Key className="h-3.5 w-3.5" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-mono text-[#6F7C89]">Manage tokens for API access. Tokens inherit your permissions.</p>
                <HUDButton variant="cyan" size="sm" onClick={() => { setShowCreateToken(true); setCreatedToken(null); setNewTokenName(''); }}>
                  <Plus className="h-3.5 w-3.5" /> Create Token
                </HUDButton>
              </div>

              {(!tokensData?.data || tokensData.data.length === 0) && (
                <div className="py-6 text-center text-[10px] font-mono text-[#6F7C89]">
                  <Key className="h-5 w-5 mx-auto mb-2 opacity-30" />
                  No API tokens yet.
                </div>
              )}

              {tokensData?.data?.map((token: any) => (
                <div key={token.id} className="flex items-center justify-between p-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono text-white">{token.name}</p>
                    <p className="text-[8px] font-mono text-[#6F7C89]">
                      Created {new Date(token.createdAt).toLocaleDateString()}
                      {token.lastUsedAt ? ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}` : ' · Never used'}
                      {token.expiresAt ? ` · Expires ${new Date(token.expiresAt).toLocaleDateString()}` : ' · No expiry'}
                    </p>
                  </div>
                  <button onClick={() => handleRevokeToken(token.id)} className="p-1.5 text-[#6F7C89] hover:text-[#FF003C] transition-colors" title="Revoke">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </HUDCard>
        </motion.div>
      )}

      {/* ── Create Token Dialog ── */}
      <Dialog open={showCreateToken} onOpenChange={(o) => { if (!o) { setShowCreateToken(false); setCreatedToken(null); } }}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider text-sm">
            {createdToken ? 'Token Created' : 'Create API Token'}
          </DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">
            {createdToken ? 'Copy this token now. It will not be shown again.' : 'Generate a new API token for programmatic access.'}
          </DialogDescription>
          <div className="space-y-3 mt-4">
            {!createdToken ? (
              <>
                <div>
                  <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1">Token Name</label>
                  <input value={newTokenName} onChange={e => setNewTokenName(e.target.value)}
                    placeholder="e.g. CI/CD Pipeline, Integration X"
                    className="w-full px-3 py-2 text-[10px] font-mono border outline-none"
                    style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider block mb-1">Expires In</label>
                  <CyberSelect options={[
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '180', label: '180 days' },
                    { value: '365', label: '1 year' },
                  ]} value={String(newTokenDays)} onChange={v => setNewTokenDays(Number(v))} placeholder="Select expiry..." />
                </div>
                <HUDButton variant="cyan" size="sm" onClick={handleCreateToken} disabled={!newTokenName} className="w-full" glitchText="GENERATE">
                  <Key className="h-3.5 w-3.5" /> Generate Token
                </HUDButton>
              </>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border border-[#00F6FF]/30" style={{ background: 'rgba(0,246,255,0.03)' }}>
                  <p className="text-[9px] font-mono text-[#00F6FF] break-all select-all">{createdToken}</p>
                </div>
                <div className="flex gap-2">
                  <HUDButton variant="cyan" size="sm" onClick={handleCopyToken} className="flex-1" glitchText={copied ? 'COPIED' : 'COPY'}>
                    <Copy className="h-3.5 w-3.5" />
                  </HUDButton>
                  <HUDButton variant="cyan" size="sm" onClick={() => { setShowCreateToken(false); setCreatedToken(null); }} className="flex-1">
                    Done
                  </HUDButton>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Dialog ── */}
      <Dialog open={showDanger} onOpenChange={setShowDanger}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(255,0,60,0.3)' }}>
          <DialogTitle className="font-mono text-[#FF003C] tracking-wider text-sm">⚠ Deactivate Account</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">
            This will deactivate your account immediately. You have 30 days to reactivate before data is removed.
          </DialogDescription>
          <div className="space-y-3 mt-4">
            <p className="text-[9px] font-mono text-[#6F7C89]">Type <span className="text-[#FF003C]">DEACTIVATE</span> to confirm:</p>
            <input value={deactivateConfirm} onChange={e => setDeactivateConfirm(e.target.value)}
              placeholder="Type DEACTIVATE"
              className="w-full px-3 py-2 text-[10px] font-mono border outline-none"
              style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,0,60,0.3)', color: 'white' }} />
            <div className="flex gap-2 justify-end">
              <HUDButton variant="cyan" size="sm" onClick={() => setShowDanger(false)}>Cancel</HUDButton>
              <HUDButton variant="red" size="sm" disabled={deactivateConfirm !== 'DEACTIVATE'} glitchText="CONFIRM">
                <Trash2 className="h-3.5 w-3.5" /> Deactivate
              </HUDButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
