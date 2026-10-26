import type { NextConfig } from "next";

const withSerwist = require("@serwist/next").default({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: any = {
  // The cinematic landing page (a static page in public/royal) on trial at /royal before it becomes the homepage
  async rewrites() {
    return [{ source: "/royal", destination: "/royal/index.html" }];
  },
  allowedDevOrigins: ['.lhr.life', '192.0.0.2', 'localhost'],
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default withSerwist(nextConfig);
