/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    API_URL: process.env.API_URL,
    AMPLITUDE_API_KEY: process.env.AMPLITUDE_API_KEY,
  },
}

export default nextConfig
