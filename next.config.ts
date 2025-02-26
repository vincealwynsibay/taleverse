import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  serverExternalPackages: ["@prisma/client", "pg"],
  devIndicators: false,
  // Let phones on the local network load dev assets (http://<LAN IP>:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // The nightly demo reset reads the seed catalogue from disk.
  outputFileTracingIncludes: {
    "/api/cron/demo-reset": ["./prisma/seed-data/**"],
    "/**/opengraph-image*": ["./src/assets/fonts/**"],
  },
};

export default nextConfig;
