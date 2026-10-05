// app/sitemap.ts
import type { MetadataRoute } from 'next'

import { sitemapOeffentlicheUrls } from '@/lib/seo/oeffentlicher-origin'

export const revalidate = 3600 // 1h

export default function sitemap(): MetadataRoute.Sitemap {
  // Deny-all liefert keine öffentliche URL-Liste. Im Allow-Modus nur
  // bewusst öffentliche Flächen. Die Reiseübersicht bleibt ausgeschlossen.
  return sitemapOeffentlicheUrls().map((url) => {
    const pfad = new URL(url).pathname
    return {
      url,
      lastModified: new Date(),
      changeFrequency: pfad === '/' ? 'daily' : 'weekly',
      priority: pfad === '/' ? 0.9 : 0.8,
    }
  })
}
