// app/(public)/page.tsx
import { Suspense } from 'react'
import HeroSection from '@/components/layout/Hero/HeroSection'
import InspirationGrid from '@/components/home/InspirationGrid'
import TrendingUploadsSection from '@/components/home/TrendingUploadsSection'
import TrendingUploadsSkeleton from '@/components/home/TrendingUploadsSkeleton'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import Link from 'next/link'

export const revalidate = 120 // ISR: alle 2 Min.

type Upload = Tables<'creator_uploads'>

export default async function HomePage() {
  const supabase = createServerComponentClient()

  let uploads: Upload[] = []
  try {
    const { data } = await supabase
      .from('creator_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    uploads = (data ?? []) as Upload[]
  } catch {
    uploads = []
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <main>
      <HeroSection />

      {/* Inspirationen */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex items-end justify-between gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Inspiration für deine nächste Reise
          </h2>
          <Link
            href="/search?sort=recent"
            className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
          >
            Alle ansehen
          </Link>
        </div>

        {uploads.length > 0 ? <InspirationGrid uploads={uploads} /> : <EmptyState />}
      </section>

      {/* 🔥 Trending Uploads (mit Suspense-Skeleton) */}
      <Suspense fallback={<TrendingUploadsSkeleton />}>
        {/* Server-Komponente lädt selbst via getHomeTrendingUploads() */}
        <TrendingUploadsSection />
      </Suspense>

      {/* Strukturierte Daten: WebSite + integrierte Suche */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Jetnity',
            url: appUrl,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${appUrl}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />
    </main>
  )
}

/** kleiner Skeleton/Empty-State */
function EmptyState() {
  return (
    <div className="rounded-2xl border bg-muted/30 p-8">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
      <p className="text-sm text-muted-foreground">
        Noch keine Inhalte verfügbar. Schau später vorbei oder{' '}
        <Link href="/inspiration" className="underline underline-offset-2">
          entdecke unsere Inspirationen
        </Link>
        .
      </p>
    </div>
  )
}
