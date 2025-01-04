import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: { serverExternalPackages: ["yjs"] },
};

export default nextConfig;
