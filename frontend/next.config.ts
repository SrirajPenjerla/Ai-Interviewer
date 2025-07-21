import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ Allow build to continue even if TypeScript errors exist
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ✅ Allow build to continue even if ESLint errors exist
  eslint: {
    ignoreDuringBuilds: true,
  },

  // You can keep other config options here
};

export default nextConfig;
