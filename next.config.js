/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/racchabanda',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/racchabanda',
        basePath: false,
        permanent: false,
      },
    ]
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
        basePath: false,
      },
    ]
  },
  images: {
    domains: ['res.cloudinary.com'],
  },
}
module.exports = nextConfig
