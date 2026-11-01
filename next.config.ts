import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ali-oss'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'taffyblog.oss-ap-northeast-1.aliyuncs.com',
      },
    ],
  },
  async rewrites() {
    // Vibe coding work pages are self-contained HTML files in public/vibe-coding/; serve them without the extension.
    return [
      { source: '/vibe-coding/office-assistant', destination: '/vibe-coding/office-assistant.html' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // The ledger asks for stricter values than the blog's defaults above; without this rule
        // the defaults would replace the ones its Worker sends.
        source: '/ledger/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
