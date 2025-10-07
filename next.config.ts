import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: [
      // other hosts you already allow…
      'cdn4.cdn-telegram.org',
      'api.telegram.org',
      'storage-api-six.vercel.app',
    ],
    //—or, if you need more control:
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: 'cdn4.cdn-telegram.org',
    //   },
    // ],
  },
};

export default nextConfig;
