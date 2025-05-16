/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable API routes by removing output: 'export'
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;