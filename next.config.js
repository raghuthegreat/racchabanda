/** @type {import('next').NextConfig} */
// రచ్చబండ lives at www.yaasalu.com/racchabanda: nginx on the yaasalu site sends that path here.
// Links to the rest of the site (/, /yaasa/<word>, /login, /Static/...) are plain <a> tags,
// outside this basePath.
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
}
module.exports = nextConfig
