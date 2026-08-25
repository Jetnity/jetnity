// app/robots.ts
import type { MetadataRoute } from 'next'

import {
  ROBOTS_DISALLOW_ALLOW_MODUS,
  robotsDarfIndexieren,
  robotsHostAusUrl,
} from '@/lib/seo/robots-regeln'

export default function robots(): MetadataRoute.Robots {
  const { host } = robotsHostAusUrl(process.env.NEXT_PUBLIC_APP_URL)
  const allowIndex = robotsDarfIndexieren({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING,
  })

  return {
    rules: allowIndex
      ? [
          {
            userAgent: '*',
            allow: '/',
            disallow: [...ROBOTS_DISALLOW_ALLOW_MODUS],
          },
        ]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${host}/sitemap.xml`,
    host,
  }
}
