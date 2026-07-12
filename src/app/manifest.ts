import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "If You Died Today",
    short_name: "If You Died Today",
    description:
      "Are you a good person? Take the test — a direct, honest look at morality, God, and eternity.",
    start_url: "/",
    display: "standalone",
    background_color: "#060404",
    theme_color: "#060404",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
