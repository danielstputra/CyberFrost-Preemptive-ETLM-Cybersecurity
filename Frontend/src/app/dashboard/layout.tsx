import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { QueryProvider } from '@/providers/query-provider';
import { SocketProvider } from '@/providers/socket-provider';
import { AuthHydrator } from '@/components/auth/AuthHydrator';
import { CyberBackground } from '@/components/cyber/CyberBackground';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>
        <AuthHydrator />
        <CyberBackground />
        <SidebarProvider defaultOpen={true} className="pt-0 mt-0">
          <AppSidebar />
          <SidebarInset className="!m-0 rounded-none">
            <DashboardHeader />
            <main className="flex-1 p-4 lg:p-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </SocketProvider>
    </QueryProvider>
  );
}
