import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
