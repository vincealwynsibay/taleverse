import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: { serverComponentsExternalPackages: ["yjs"] },
};

export default nextConfig;
