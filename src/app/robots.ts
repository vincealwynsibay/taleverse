import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/library", "/credits"] },
    sitemap: new URL("/sitemap.xml", env.appUrl).toString(),
  };
}
