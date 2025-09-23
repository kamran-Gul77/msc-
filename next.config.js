const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false, // 👈 important

  images: { unoptimized: true },
  experimental: {
    appDir: true,
  },
};
