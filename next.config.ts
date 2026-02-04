import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/proxy/:path*',
        destination: 'https://hubnity.automatonsoft.de/api/:path*',
      },
    ];
  },
};

export default nextConfig;
