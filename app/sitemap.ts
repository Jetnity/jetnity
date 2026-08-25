// app/sitemap.ts
import type { MetadataRoute } from 'next'

import { SITEMAP_OEFFENTLICHE_PFADE } from '@/lib/seo/index-grenze'

export const revalidate = 3600 // 1h

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

export default function sitemap(): MetadataRoute.Sitemap {
  // Nur bewusst öffentliche Flächen. Private Reiseübersichten und Trip-URLs
  // gehören nicht hierher, auch wenn sie später serverseitig existieren.
  return SITEMAP_OEFFENTLICHE_PFADE.map((pfad) => ({
    url: `${APP_URL}${pfad}`,
    lastModified: new Date(),
    changeFrequency: pfad === '/' ? 'daily' : 'weekly',
    priority: pfad === '/' ? 0.9 : 0.8,
  }))
}
