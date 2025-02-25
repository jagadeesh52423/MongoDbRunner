import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
        dns: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['mongodb']
  }
};

export default nextConfig;
