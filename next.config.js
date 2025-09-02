// next.config.js
/** @type {import('next').NextConfig} */

// Supabase-Host robust aus ENV ableiten (Build-Time)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
let supabaseHost = 'example.supabase.co'
try {
  if (SUPABASE_URL) supabaseHost = new URL(SUPABASE_URL).hostname
} catch {
  // noop – fällt auf example.supabase.co zurück
}

const nextConfig = {
  reactStrictMode: true,

  // Kleine Bundle-/DX-Optimierungen
  experimental: {
    optimizePackageImports: ['lucide-react'], // reduziert Lucide-Bundle
    typedRoutes: true,                        // Tippfehler in Routen zur Buildzeit finden
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 1 Tag Remote-Cache
    remotePatterns: [
      // OpenAI DALL·E CDN
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
      // Supabase Storage – alle öffentlichen Buckets (creator-media, public/hero, avatars, …)
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
      // Eigene statische Avatare
      {
        protocol: 'https',
        hostname: 'jetnity.ai',
        pathname: '/static/avatars/**',
      },
    ],
    // Optional für lokale Dev-Setups ohne Image Optimizer
    // unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
  },

  // Konsolenrauschen in Prod entfernen (Fehler/Warnungen bleiben)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Sinnvolle Security-/Perf-Header (idempotent)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
