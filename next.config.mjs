/** @type {import('next').NextConfig} */

// Detect if we're building for Tauri (desktop app) or Web (server)
const isTauriBuild = process.env.TAURI_BUILD === 'true';

const nextConfig = {
  // For Tauri: Use static export (no server needed, files are bundled with app)
  // For Web/Railway: Use standalone output (optimized Docker builds)
  output: isTauriBuild ? 'export' : 'standalone',
  
  images: {
    unoptimized: true,
  },
  // Disable React strict mode for better performance with 8GB RAM
  reactStrictMode: false,
  // Optimize for production
  swcMinify: true,
  // Build gates enabled for production quality
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Environment-specific rewrites (only for web server, not Tauri)
  ...(!isTauriBuild && {
    async rewrites() {
      return [
        // Redirect root to landing for web visitors
        // (This is handled client-side too, but this is a backup for SEO)
        {
          source: '/',
          has: [
            {
              type: 'header',
              key: 'user-agent',
              // Match any browser (not Tauri's internal webview)
              value: '(?!.*Tauri).*',
            },
          ],
          destination: '/landing',
        },
      ];
    },
  }),
};

export default nextConfig;
