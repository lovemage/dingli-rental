/* eslint-disable @typescript-eslint/no-require-imports */
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the filesystem cache without retaining a second copy in memory.
  cacheMaxMemorySize: 0,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/webp'],
  },
  experimental: {
    imgOptConcurrency: 1,
    serverActions: { bodySizeLimit: '20mb' },
  },
};

module.exports = withNextIntl(nextConfig);
