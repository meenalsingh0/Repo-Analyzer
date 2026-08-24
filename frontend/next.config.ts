import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from GitHub avatars
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
};

export default nextConfig;
