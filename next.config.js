// next.config.js
/** @type {import('next').NextConfig} */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : "example.supabase.co";

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],          // moderne Formate
    minimumCacheTTL: 60 * 60 * 24,                  // 1 Tag Caching für Remote Images
    remotePatterns: [
      // OpenAI DALL·E Storage
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
      // Supabase Storage (dein Bucket 'creator-media')
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/creator-media/**',
      },
    ],
    // Optional: in lokalen Dev-Setups ohne Optimizer Probleme vermeiden
    // unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === 'true',
  },
};

module.exports = nextConfig;
