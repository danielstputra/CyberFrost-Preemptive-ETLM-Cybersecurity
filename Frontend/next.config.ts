import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig;
