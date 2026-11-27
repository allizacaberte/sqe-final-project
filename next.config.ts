import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Allow movie posters from TMDB in next/image
  images: {
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
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