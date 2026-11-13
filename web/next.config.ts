import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // Puan AI: library model embedding (e5-small) membawa mesin bawaan (.node),
  // jadi dimuat langsung dari node_modules, TIDAK dibungkus oleh Next.js.
  serverExternalPackages: ["@huggingface/transformers"],
  // Mesin AI (onnxruntime) dipanggil dengan cara yang tidak terdeteksi Next.js,
  // jadi file-nya didaftarkan manual untuk route Puan. Hanya versi Linux, karena server Vercel memakai Linux.
  outputFileTracingIncludes: {
    "/api/chat": [
      "./node_modules/onnxruntime-common/**",
      "./node_modules/onnxruntime-node/package.json",
      "./node_modules/onnxruntime-node/dist/*.js",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1",
      "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/onnxruntime_binding.node",
    ],
  },
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