// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // OpenAI DALL·E Storage
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        pathname: '/**',
      },
      // Supabase Storage (dein eigener Bucket)
      {
        protocol: 'https',
        hostname: 'qscbgcdmivbbnzrcyegn.supabase.co',
        pathname: '/storage/v1/object/public/creator-media/**',
      },
    ],
  },
};

module.exports = nextConfig;
