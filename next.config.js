/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false, // 👈 keep this if needed
  images: {
    unoptimized: true,
  },
  // Remove the experimental.appDir entirely
};

module.exports = nextConfig;
