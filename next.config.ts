import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para el Dockerfile: arma .next/standalone con solo lo necesario para correr.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
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
