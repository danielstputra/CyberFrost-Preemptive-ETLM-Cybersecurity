import { QueryProvider } from '@/providers/query-provider';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
