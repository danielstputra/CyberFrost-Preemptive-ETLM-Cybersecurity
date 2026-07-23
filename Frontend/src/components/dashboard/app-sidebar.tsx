'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Shield, Bug, Radio, Search, ShieldOff, Settings, Brain, Bell, Users, Radar, Webhook, Globe, Activity, Target } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { LangSwitcher } from '@/components/ui/lang-switcher';
import { useAuthStore } from '@/store/auth-store';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

type UserRole = 'SUPER_ADMIN' | 'SOC_MANAGER' | 'SOC_ANALYST' | 'TENANT_ADMIN' | 'SECURITY_OPERATOR' | 'COMPLIANCE_OFFICER' | 'EXECUTIVE_VIEWER';

// Role hierarchy: SUPER_ADMIN > SOC_MANAGER > SOC_ANALYST > TENANT_ADMIN > COMPLIANCE > OPERATOR > EXECUTIVE_VIEWER
const NAV = [
  { labelKey: 'sidebar.executiveView', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'] },
  { labelKey: 'sidebar.attackSurface', href: '/dashboard/attack-surface', icon: Shield, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR'] },
  { labelKey: 'sidebar.threatHunting', href: '/dashboard/threat-hunting', icon: Target, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN'] },
  { labelKey: 'sidebar.vulnerabilities', href: '/dashboard/vulnerabilities', icon: Bug, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'] },
  { labelKey: 'sidebar.threatIntel', href: '/dashboard/threat-intel', icon: Radio, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'] },
  { labelKey: 'sidebar.executives', href: '/dashboard/executives', icon: Shield, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN'] },
  { labelKey: 'sidebar.threatActors', href: '/dashboard/threat-actors', icon: Users, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'] },
  { labelKey: 'sidebar.iocExplorer', href: '/dashboard/ioc-explorer', icon: Globe, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER'] },
  { labelKey: 'sidebar.brandProtection', href: '/dashboard/brand-protection', icon: Search, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR'] },
  { labelKey: 'sidebar.integrations', href: '/dashboard/integrations', icon: Webhook, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN'] },
  { labelKey: 'sidebar.socOperations', href: '/dashboard/soc-operations', icon: Activity, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN'] },
  { labelKey: 'sidebar.compliance', href: '/dashboard/compliance', icon: CheckCircle, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN', 'COMPLIANCE_OFFICER'] },
  { labelKey: 'sidebar.actionMitigation', href: '/dashboard/action-mitigation', icon: ShieldOff, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR'] },
  { labelKey: 'sidebar.tprm', href: '/dashboard/tprm', icon: Users, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN', 'COMPLIANCE_OFFICER'] },
  { labelKey: 'sidebar.warRoom', href: '/dashboard/war-room', icon: Radar, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR'] },
  { labelKey: 'sidebar.notifications', href: '/dashboard/notifications', icon: Bell, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'] },
  { labelKey: 'sidebar.aiInsights', href: '/dashboard/ai-insights', icon: Brain, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST', 'TENANT_ADMIN'] },
  { labelKey: 'sidebar.settings', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN'], bottom: true },
];

export function AppSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const userRole = useAuthStore(s => s.user?.role || 'VIEWER');

  const visibleNav = NAV.filter(item => item.roles.includes(userRole));
  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const handleNav = (href: string) => {
    if (setOpenMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-[rgba(255,255,255,0.08)] bg-[#0B0F14]">
      {/* Logo */}
      <SidebarHeader className="border-b border-[rgba(255,255,255,0.08)] px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />} className="group h-14">
              <div className="flex aspect-square size-8 items-center justify-center bg-[#00f0ff] text-[#000a0f] font-bold text-xs tracking-widest angle-both">
                CF
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-wider text-[#00f0ff] group-hover:neon-text transition-all">{APP_NAME}</span>
                <span className="truncate text-[9px] font-mono text-[oklch(0.35_0.05_260)] tracking-wider uppercase">{t('sidebar.enterprise')}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[8px] tracking-[0.25em] text-[oklch(0.35_0.05_260)] uppercase font-mono pb-1">— {t('sidebar.navigation')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.filter(n => !n.bottom).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={t(item.labelKey)}
                      onClick={() => handleNav(item.href)}
                      className={`bracket-hover transition-all duration-200 active:scale-[0.97] ${active ? 'text-[#00f0ff] neon-text' : 'text-[oklch(0.5_0.05_260)] hover:text-[#00f0ff]/70 hover:translate-x-[2px]'}`}
                    >
                      <Icon className="size-4" />
                      <span className="text-xs font-mono tracking-wider">{t(item.labelKey)}</span>
                      {active && (
                        <motion.span
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          className="ml-auto text-[10px] text-[#00f0ff]"
                        >▸</motion.span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings — separated from navigation */}
        <SidebarGroup className="border-t border-[rgba(255,255,255,0.08)] pt-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.filter(n => n.bottom).map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive(item.href)} tooltip={t(item.labelKey)}
                      onClick={() => handleNav(item.href)}
                      className={`bracket-hover transition-all duration-200 active:scale-[0.97] ${isActive(item.href) ? 'text-[#00f0ff]' : 'text-[oklch(0.4_0.05_260)] hover:text-[#00f0ff]/70 hover:translate-x-[2px]'}`}>
                      <Icon className="size-4" />
                      <span className="text-xs font-mono tracking-wider">{t(item.labelKey)}</span>
                      {isActive(item.href) && (
                        <motion.span
                          initial={{ x: 10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 350, damping: 20 }}
                          className="ml-auto text-[10px] text-[#00f0ff]"
                        >▸</motion.span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-[rgba(255,255,255,0.08)] px-3 py-3">
        <div className="space-y-2">
          <LangSwitcher className="px-4 py-2" />
          <p className="text-[7px] font-mono text-[oklch(0.25_0.05_260)] tracking-[0.3em] uppercase">
            <span className="text-[#00ff41]">●</span> {t('sidebar.footerStatus')}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
