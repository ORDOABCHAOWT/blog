import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/notebook',
        destination: 'https://word-notebook.ordoabchao-wt.workers.dev/notebook/',
      },
      {
        source: '/notebook/:path*',
        destination: 'https://word-notebook.ordoabchao-wt.workers.dev/notebook/:path*',
      },
    ];
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
      {
        protocol: 'https',
        hostname: '**.aliyuncs.com',
      },
    ],
  },
};

export default nextConfig;
