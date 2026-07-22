'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { MitreBadge } from '@/components/cyber/MitreBadge';
import { CyberSelect } from '@/components/cyber/CyberSelect';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Globe, Crosshair, TrendingUp, Activity, Search, ExternalLink, Flag, Skull, ChevronRight, Calendar, MapPin, Target } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface ThreatActorTechnique {
  id: string; techniqueId: string; techniqueName: string; tactic: string;
}

interface ThreatActor {
  id: string; name: string; aliases: string[]; originCountry: string; originFlag: string;
  motivation: string[]; targetIndustries: string[]; techniques: ThreatActorTechnique[];
  description: string; isActive: boolean; firstSeen: string; lastSeen: string;
}

const MOCK_ACTORS: ThreatActor[] = [
  { id: 'apt-35', name: 'APT-C-35 (Emissary Panda)', aliases: ['APT-C-35', 'Emissary Panda', 'BRONZE UNION'], originCountry: 'China', originFlag: '🇨🇳', motivation: ['Cyber Espionage', 'Intellectual Property Theft'], targetIndustries: ['Government', 'Telecom', 'Defense'], techniques: [{ id: '1', techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' }, { id: '2', techniqueId: 'T1059', techniqueName: 'Command & Scripting Interpreter', tactic: 'Execution' }], description: 'State-sponsored group known for targeting government agencies and telecom providers across Southeast Asia. Uses spear-phishing and custom malware.', isActive: true, firstSeen: '2014-03-01', lastSeen: '2026-06-15' },
  { id: 'apt29', name: 'APT29 (Cozy Bear)', aliases: ['APT29', 'Cozy Bear', 'NOBELIUM'], originCountry: 'Russia', originFlag: '🇷🇺', motivation: ['Cyber Espionage', 'Political Intelligence'], targetIndustries: ['Government', 'Healthcare', 'Defense', 'Energy'], techniques: [{ id: '3', techniqueId: 'T1078', techniqueName: 'Valid Accounts', tactic: 'Defense Evasion' }, { id: '4', techniqueId: 'T1190', techniqueName: 'Exploit Public-Facing Application', tactic: 'Initial Access' }], description: 'Russian state-sponsored APT attributed to the SVR foreign intelligence service. Known for SolarWinds supply chain attack.', isActive: true, firstSeen: '2010-01-01', lastSeen: '2026-06-20' },
  { id: 'lazarus', name: 'Lazarus Group (HIDDEN COBRA)', aliases: ['Lazarus', 'HIDDEN COBRA', 'Guardians of Peace'], originCountry: 'North Korea', originFlag: '🇰🇵', motivation: ['Financial Theft', 'Destruction', 'Cyber Espionage'], targetIndustries: ['Finance', 'Media', 'Defense', 'Technology'], techniques: [{ id: '5', techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact', tactic: 'Impact' }, { id: '6', techniqueId: 'T1003', techniqueName: 'OS Credential Dumping', tactic: 'Credential Access' }], description: 'North Korean state-sponsored group responsible for the 2014 Sony Pictures attack, WannaCry ransomware, and $1.7B in crypto thefts.', isActive: true, firstSeen: '2009-01-01', lastSeen: '2026-06-18' },
  { id: 'wizard-spider', name: 'Wizard Spider', aliases: ['Wizard Spider', 'Gold Drake', 'TrickBot Gang'], originCountry: 'Russia', originFlag: '🇷🇺', motivation: ['Financial Theft', 'Ransomware'], targetIndustries: ['Finance', 'Government', 'Healthcare', 'Education'], techniques: [{ id: '7', techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' }, { id: '8', techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact', tactic: 'Impact' }], description: 'Financially motivated cybercriminal group behind TrickBot and Conti ransomware. Operates a ransomware-as-a-service model.', isActive: true, firstSeen: '2016-01-01', lastSeen: '2026-05-30' },
  { id: 'apt41', name: 'APT41 (WINNTIEWIN)', aliases: ['APT41', 'WINNTIEWIN', 'Barium'], originCountry: 'China', originFlag: '🇨🇳', motivation: ['Cyber Espionage', 'Financial Theft'], targetIndustries: ['Government', 'Healthcare', 'Pharmaceutical', 'Technology'], techniques: [{ id: '9', techniqueId: 'T1059', techniqueName: 'Command & Scripting Interpreter', tactic: 'Execution' }, { id: '10', techniqueId: 'T1550', techniqueName: 'Use Alternate Authentication Material', tactic: 'Defense Evasion' }], description: 'Chinese dual-purpose group conducting both espionage and financially motivated operations against global targets.', isActive: true, firstSeen: '2012-01-01', lastSeen: '2026-05-30' },
];

export default function ThreatActorsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterMotivation, setFilterMotivation] = useState('');
  const [selected, setSelected] = useState<ThreatActor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['threat-actors'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/v1/intelligence/threat-actors?page=1&limit=50');
        return res.data;
      } catch { return { data: MOCK_ACTORS }; }
    },
  });

  const actors: ThreatActor[] = data?.data?.length > 0 ? data.data : MOCK_ACTORS;

  const industries = useMemo(() => [...new Set(actors.flatMap(a => a.targetIndustries))], [actors]);
  const motivations = useMemo(() => [...new Set(actors.flatMap(a => a.motivation))], [actors]);

  const filtered = actors.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.aliases.some(al => al.toLowerCase().includes(search.toLowerCase()));
    const matchInd = !filterIndustry || a.targetIndustries.includes(filterIndustry);
    const matchMot = !filterMotivation || a.motivation.includes(filterMotivation);
    return matchSearch && matchInd && matchMot;
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
        <Crosshair className="h-5 w-5 text-[#FF003C]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('threatActors.title')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('threatActors.subtitle')}</p>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div variants={itemAnim} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
          <input placeholder="Search threat actors..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30" />
        </div>
        <div className="w-44"><CyberSelect options={[{ value: '', label: 'All Industries' }, ...industries.map(i => ({ value: i, label: i }))]}
          value={filterIndustry} onChange={setFilterIndustry} placeholder="Filter Industry" /></div>
        <div className="w-44"><CyberSelect options={[{ value: '', label: 'All Motivations' }, ...motivations.map(m => ({ value: m, label: m }))]}
          value={filterMotivation} onChange={setFilterMotivation} placeholder="Filter Motivation" /></div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Actors', value: filtered.length, icon: Skull, accent: 'red' as const },
          { label: 'Active Groups', value: filtered.filter(a => a.isActive).length, icon: TrendingUp, accent: 'yellow' as const },
          { label: 'Countries', value: new Set(filtered.map(a => a.originCountry)).size, icon: Globe, accent: 'cyan' as const },
          { label: 'Techniques Mapped', value: new Set(filtered.flatMap(a => a.techniques.map(t => t.techniqueId))).size, icon: Activity, accent: 'cyan' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">{s.label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value}</p></div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* Actor Cards */}
      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((actor, i) => (
          <motion.div key={actor.id} variants={itemAnim} className="cursor-pointer" onClick={() => setSelected(actor)}>
            <HUDCard accent="red" delay={i * 0.03}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold font-mono text-[#FF003C] truncate">{actor.name}</p>
                    {actor.aliases.length > 0 && <p className="text-[9px] font-mono text-[#6F7C89] truncate">{actor.aliases.slice(0, 2).join(' · ')}</p>}
                  </div>
                  <span className="text-lg ml-2">{actor.originFlag}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#6F7C89]">
                  <MapPin className="h-3 w-3" /> {actor.originCountry}
                </div>
                <div className="flex flex-wrap gap-1">
                  {actor.motivation.slice(0, 2).map(m => <Badge key={m} variant="outline" className="text-[8px] font-mono border-[#FF003C]/30 text-[#FF003C]">{m}</Badge>)}
                </div>
                {actor.techniques.length > 0 && <MitreBadge techniqueId={actor.techniques[0].techniqueId} techniqueName={actor.techniques[0].techniqueName} tactic={actor.techniques[0].tactic} />}
                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[8px] font-mono ${actor.isActive ? 'text-[#FF003C]' : 'text-[#6F7C89]'} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${actor.isActive ? 'bg-[#FF003C]' : 'bg-[#6F7C89]'}`} /> {actor.isActive ? 'ACTIVE' : 'DORMANT'}
                  </span>
                  <ChevronRight className="h-3 w-3 text-[#6F7C89]" />
                </div>
              </div>
            </HUDCard>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-[10px] font-mono text-[#6F7C89]">
            <Search className="mx-auto mb-2 h-6 w-6 opacity-30" /> No threat actors match your search
          </div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg p-6" style={{ background: '#0B0F14', border: '1px solid rgba(255,0,60,0.3)' }}>
          {selected && (<>
            <DialogTitle className="font-mono text-[#FF003C] tracking-wider flex items-center gap-2">
              <Skull className="h-5 w-5" /> {selected.name}
            </DialogTitle>
            <DialogDescription className="font-mono text-[9px] text-[#6F7C89] mt-1">{selected.aliases.join(' · ')}</DialogDescription>
            <div className="space-y-3 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">{selected.originFlag}</span>
                <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Country</p><p className="text-xs font-mono text-white">{selected.originCountry}</p></div>
                <div className="ml-auto"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Status</p><span className={`text-xs font-mono ${selected.isActive ? 'text-[#FF003C]' : 'text-[#6F7C89]'}`}>{selected.isActive ? 'ACTIVE' : 'DORMANT'}</span></div>
              </div>
              <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Description</p><p className="text-[10px] font-mono text-white leading-relaxed mt-1">{selected.description}</p></div>
              <div className="flex gap-4">
                <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">First Seen</p><p className="text-[10px] font-mono text-white"><Calendar className="inline h-3 w-3 mr-1" />{selected.firstSeen}</p></div>
                <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Last Seen</p><p className="text-[10px] font-mono text-white"><Calendar className="inline h-3 w-3 mr-1" />{selected.lastSeen}</p></div>
              </div>
              <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Target Industries</p><div className="flex flex-wrap gap-1 mt-1">{selected.targetIndustries.map(i => <Badge key={i} variant="outline" className="text-[8px] font-mono border-[#00F6FF]/30 text-[#00F6FF]">{i}</Badge>)}</div></div>
              <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Motivation</p><div className="flex flex-wrap gap-1 mt-1">{selected.motivation.map(m => <Badge key={m} variant="outline" className="text-[8px] font-mono border-[#FCEE09]/30 text-[#FCEE09]">{m}</Badge>)}</div></div>
              {selected.techniques.length > 0 && <div><p className="text-[9px] font-mono text-[#6F7C89] uppercase mb-1">MITRE ATT&CK Techniques</p><div className="flex flex-wrap gap-1">{selected.techniques.map(t => <MitreBadge key={t.id} techniqueId={t.techniqueId} techniqueName={t.techniqueName} tactic={t.tactic} />)}</div></div>}
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
