/** @type {import('next').NextConfig} */

// Supabase-Host robust aus ENV ableiten (Build-Time)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseHost = 'example.supabase.co';
try {
  if (SUPABASE_URL) supabaseHost = new URL(SUPABASE_URL).hostname;
} catch {}

// The page shell needs inline hydration/CMP bootstrap until a reviewed
// per-request nonce rollout. API HTML frames (Maps, GYG, Viator, privacy)
// already generate stricter request-scoped CSPs: never replace their policy.
const PAGE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com https://widget.getyourguide.com https://www.viator.com https://app.privacybee.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com https://app.privacybee.io`,
  "frame-src 'self' https://maps.google.com https://www.google.com https://widget.getyourguide.com https://www.viator.com https://widget.discovercars.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join('; ');

const COMMON_SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Deliberately no preload: HTTPS readiness of all subdomains is a release gate.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: COMMON_SECURITY_HEADERS },
      // API HTML frames own nonce/hash CSPs; applying the shell CSP to them
      // would block the Google map and vendor widgets by policy intersection.
      { source: '/((?!api/).*)', headers: [
        { key: 'Content-Security-Policy', value: PAGE_CSP },
      ] },
    ];
  },

  // Next 16: typedRoutes ist stabil und gehört nicht mehr nach experimental.
  typedRoutes: true,

  experimental: {
    optimizePackageImports: ['lucide-react'],
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
