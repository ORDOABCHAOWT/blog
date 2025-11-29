import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
