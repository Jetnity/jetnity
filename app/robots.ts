// app/robots.ts
import type { MetadataRoute } from 'next'

import { robotsDokument } from '@/lib/seo/robots-regeln'

export default function robots(): MetadataRoute.Robots {
  const dokument = robotsDokument()

  if (!dokument.sitemap || !dokument.host) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...dokument.disallow],
      },
    ],
    sitemap: dokument.sitemap,
    host: dokument.host,
  }
}
