import type { NextConfig } from "next";

const isExport = process.env.BUILD_EXPORT === 'true' || process.env.APK_BUILD === 'true';

const nextConfig: NextConfig = {
  ...(isExport ? {
    output: 'export' as const,
    distDir: 'out',
    skipMiddlewareUrlNormalize: true,
  } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
