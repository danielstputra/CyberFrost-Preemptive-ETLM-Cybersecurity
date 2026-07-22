/**
 * Bundle Analyzer Configuration
 * ==============================
 * Run: ANALYZE=true pnpm build
 * Opens an interactive treemap of your bundle sizes.
 */
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withBundleAnalyzer(nextConfig);
