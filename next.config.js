/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel deployment (remove standalone for Vercel)
  // output: 'standalone', // Only needed for Docker, not Vercel
  
  // Server external packages
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Image configuration for Vercel Blob and external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow Vercel Blob storage
    domains: ['*.vercel-storage.com'],
  },
  
  // Production optimizations
  experimental: {
    // Additional experimental features can be added here
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize packages that cause issues in builds
      config.externals.push('_http_common')
    }
    
    // Optimize bundle for Leaflet
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet$': 'leaflet/dist/leaflet.js',
    }
    
    return config
  },
  
  // Transpile packages that need it
  transpilePackages: ['leaflet', 'react-leaflet'],
}

module.exports = nextConfig