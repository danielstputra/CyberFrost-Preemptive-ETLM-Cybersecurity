'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — mencegah seluruh dashboard crash saat satu komponen error.
 * Menampilkan fallback UI dengan tombol reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[300px] p-8"
          style={{ background: '#0B0F14' }}
        >
          <Terminal className="h-10 w-10 text-[#FF003C] mb-4" />
          <h2 className="text-sm font-mono text-[#FF003C] tracking-wider uppercase mb-2">
            System Error
          </h2>
          <p className="text-[10px] font-mono text-[#6F7C89] mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-[10px] font-mono font-bold tracking-wider uppercase"
            style={{
              background: '#00F6FF',
              color: '#050505',
              border: '1px solid #00F6FF',
              clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
            }}
          >
            Reload Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
