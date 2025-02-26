import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taleverse",
    short_name: "Taleverse",
    description: "Serial fiction, one chapter at a time.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0f15",
    theme_color: "#0d0f15",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
