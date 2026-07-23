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
      // Proxy API docs ke backend (Swagger UI)
      {
        source: '/api/v1/docs',
        destination: `${API_URL}/api/v1/docs`,
      },
      {
        source: '/api/v1/docs.json',
        destination: `${API_URL}/api/v1/docs.json`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
