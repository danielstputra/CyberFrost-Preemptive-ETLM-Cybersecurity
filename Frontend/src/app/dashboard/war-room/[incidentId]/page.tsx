'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { useSocket } from '@/providers/socket-provider';
import { useTranslation } from '@/providers/translation-provider';
import { useSearchParams } from 'next/navigation';
import { Terminal, Send, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface WarMessage { user: string; msg: string; time: string; }

export default function WarRoomDetailPage({ params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = use(params);
  const searchParams = useSearchParams();
  const sourceType = searchParams.get('source') || 'threat';
  const { t } = useTranslation();
  const [messages, setMessages] = useState<WarMessage[]>([]);
  const [input, setInput] = useState('');
  const { socket } = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch incident details from notifications API
  const { data: notifDetail } = useQuery({
    queryKey: ['notification', incidentId],
    queryFn: async () => {
      const res = await apiClient.get(`${ENDPOINTS.NOTIFICATIONS}/${incidentId}`);
      return res.data;
    },
    enabled: sourceType === 'notification',
  });

  // Fetch from threats API
  const { data: threatDetail } = useQuery({
    queryKey: ['threat', incidentId],
    queryFn: async () => {
      const res = await apiClient.get(`${ENDPOINTS.INTEL_THREATS}/${incidentId}`);
      return res.data;
    },
    enabled: sourceType === 'threat',
  });

  const incident = notifDetail || threatDetail;
  const severity = incident?.severity || 'HIGH';
  const status = incident?.status || incident?.read ? 'RESOLVED' : 'ACTIVE';
  const title = incident?.title || incidentId;

  // Real-time Socket.io messages
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: WarMessage) => setMessages(prev => [...prev, msg]);
    socket.on(`war_room:${incidentId}`, handler);
    socket.emit('join_war_room', incidentId);
    return () => { socket.off(`war_room:${incidentId}`, handler); };
  }, [socket, incidentId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMsg = () => {
    if (!input.trim() || !socket) return;
    const msg: WarMessage = { user: 'YOU', msg: input, time: new Date().toLocaleTimeString() };
    socket.emit(`war_room:${incidentId}:send`, msg);
    setMessages(prev => [...prev, msg]);
    setInput('');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
        <Terminal className="h-5 w-5 text-[#FF003C]" />
        <div className="flex-1">
          <Link href="/dashboard/war-room" className="text-[9px] font-mono text-[#00F6FF] hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> {t('common.back')}
          </Link>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('warRoom.incidentDetail')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {title}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThreatBadge level={severity as any}>{severity}</ThreatBadge>
          <span className={`text-[10px] font-mono ${status === 'ACTIVE' ? 'text-[#FF003C]' : 'text-[#00FF41]'}`}>{status}</span>
        </div>
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('warRoom.chatRoom')} accent="red" icon={<Shield className="h-3.5 w-3.5" />}>
          {/* Messages */}
          <div className="h-80 overflow-y-auto space-y-2 mb-3 bg-[rgba(5,5,10,0.4)] p-3 border border-white/5">
            {messages.length > 0 ? messages.map((m, i) => (
              <div key={i} className="text-[11px] font-mono leading-relaxed">
                <span className="text-[#6F7C89]">[{m.time}]</span>{' '}
                <span className={`${m.user === 'YOU' ? 'text-[#00F6FF]' : 'text-[#FCEE09]'}`}>&lt;{m.user}&gt;</span>{' '}
                <span className="text-[#B6C2CF]">{m.msg}</span>
              </div>
            )) : (
              <p className="text-center text-[10px] font-mono text-[#6F7C89] py-12">{t('warRoom.noMessages')}</p>
            )}
            {socket && (
              <div className="flex items-center gap-2 text-[8px] font-mono text-[#00FF41]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
                {t('warRoom.connected')}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder={t('warRoom.messagePlaceholder')}
              className="flex-1 px-3 py-2 text-xs font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#00F6FF]/30" />
            <button onClick={sendMsg} disabled={!input.trim() || !socket}
              className="px-4 py-2 bg-[#FF003C] text-white hover:shadow-[0_0_12px_rgba(255,0,60,0.3)] transition-all disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </HUDCard>
      </motion.div>
    </motion.div>
  );
}
