import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  serverExternalPackages: ["@prisma/client", "pg"],
  devIndicators: false,
  // The nightly demo reset reads the seed catalogue from disk.
  outputFileTracingIncludes: {
    "/api/cron/demo-reset": ["./prisma/seed-data/**"],
  },
};

export default nextConfig;
