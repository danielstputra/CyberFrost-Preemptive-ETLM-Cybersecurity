/**
 * Bundle Analyzer Configuration
 * ==============================
 * Run: ANALYZE=true pnpm build
 * Opens an interactive treemap of your bundle sizes.
 */
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (config) => config;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Proxy semua /api/v1/* ke backend (biar network URL pake domain yang sama)
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
