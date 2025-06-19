/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  experimental: {
    allowedDevOrigins: ['ykk008o4ssowo4okksoco4g4.automatadr.com'],
  },
}

export default nextConfig
