/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Server external packages
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['your-domain.vercel.app'], // Keep for Vercel compatibility
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize packages that cause issues in Docker builds
      config.externals.push('_http_common')
    }
    return config
  },
}

module.exports = nextConfig