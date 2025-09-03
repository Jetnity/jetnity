/** @type {import('next').NextConfig} */

// Supabase-Host robust aus ENV ableiten (Build-Time)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHost = 'example.supabase.co';
try {
  if (SUPABASE_URL) supabaseHost = new URL(SUPABASE_URL).hostname;
} catch {}

const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
    typedRoutes: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'jetnity.ai',
        pathname: '/static/avatars/**',
      },
    ],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

module.exports = nextConfig;
