import type { NextConfig } from "next";

const withSerwist = require("@serwist/next").default({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: any = {
  // The cinematic page is the homepage now; /royal was its trial address
  async redirects() {
    return [{ source: "/royal", destination: "/", permanent: false }];
  },
  // Browser protections on every response. No script allow-list here (Razorpay, Google sign-in,
  // Analytics and the home page's CDN scripts all load from other sites); the CSP only stops other
  // sites framing the shop (clickjacking) and blocks plugins and <base> tricks.
  // Camera stays allowed for the barcode scanner in admin, location for "Use current location".
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), browsing-topics=()" },
        ],
      },
    ];
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
