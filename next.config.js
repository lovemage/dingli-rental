/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/webp'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '20mb' },
  },
};

module.exports = nextConfig;
