/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/racchabanda',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ]
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
}
module.exports = nextConfig
