import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['ali-oss'],
  experimental: {
    // Vercel restores .next/cache between deploys; on 2026-11-01 the Turbopack build cache it
    // carried produced the previous deploy's CSS for an edited globals.css. Build from scratch.
    turbopackFileSystemCacheForBuild: false,
  },
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
      { source: '/graphic-design', destination: '/graphic-design/index.html' },
      { source: '/vibe-coding/chordlens', destination: '/vibe-coding/chordlens.html' },
      { source: '/vibe-coding/word-notebook', destination: '/vibe-coding/word-notebook.html' },
      { source: '/vibe-coding/office-assistant', destination: '/vibe-coding/office-assistant.html' },
      { source: '/vibe-coding/glance', destination: '/vibe-coding/glance.html' },
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
