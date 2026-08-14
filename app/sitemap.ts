// app/sitemap.ts
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600 // 1h

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

type Row = {
  id: string
  created_at?: string | null
  updated_at?: string | null
  review_status?: string | null
  is_public?: boolean | null
  visibility?: string | null
  public?: boolean | null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  let rows: Row[] = []
  if (supabaseUrl && supabaseAnonKey) {
    // Stories tolerant lesen; RLS muss Public-Read für freigegebene Inhalte erlauben.
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase
      .from('creator_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10000)

    rows = (data ?? []) as Row[]
  }

  const dynamicStories: MetadataRoute.Sitemap = rows
    .filter((r) => {
      // Sichtbarkeit
      const visible =
        r.is_public === true ||
        r.public === true ||
        (r.visibility && r.visibility.toLowerCase() === 'public') ||
        r.visibility === undefined // wenn Spalte fehlt, nicht blockieren
      // Review
      const approved = !r.review_status || r.review_status === 'approved'
      return visible && approved && !!r.id
    })
    .map((r) => ({
      url: `${APP_URL}/story/${r.id}`,
      lastModified: new Date(r.updated_at ?? r.created_at ?? Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  // WICHTIGE statische Routen
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`,              lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${APP_URL}/planen`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/reisen`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${APP_URL}/login`,         lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_URL}/register`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  return [...staticRoutes, ...dynamicStories]
}
