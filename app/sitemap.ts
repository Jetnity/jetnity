// app/sitemap.ts
import type { MetadataRoute } from 'next'

export const revalidate = 3600 // 1h

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function sitemap(): MetadataRoute.Sitemap {
  // Gastreisen liegen ausschliesslich im Browser des Nutzers und sind deshalb
  // nicht indexierbar. Sobald Reisen serverseitig gespeichert werden, kommen
  // hier nur ausdrücklich öffentlich freigegebene Reisen hinzu.
  return [
    { url: `${APP_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/planen`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/reisen`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]
}
