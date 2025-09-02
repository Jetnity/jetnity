// components/home/TrendingUploadsSection.tsx
import Link from 'next/link'
import SectionHeader from '@/components/ui/SectionHeader'
import { getHomeTrendingUploads } from '@/lib/intelligence/copilot-feed.server'
import type { TrendingUpload } from '@/lib/intelligence/copilot-feed.server'
import CreatorMediaCard from '@/components/creator/CreatorMediaCard'

export default async function TrendingUploadsSection() {
  const uploads: TrendingUpload[] = await getHomeTrendingUploads()
  if (!uploads || uploads.length === 0) return null

  return (
    <section
      id="trending-uploads"
      aria-labelledby="trending-uploads-title"
      className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <SectionHeader
          title="Im Trend"
          subtitle="Aktuell gefragte Uploads – automatisch kuratiert"
        />
        <Link
          href="/search?sort=trending"
          className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition"
        >
          Mehr entdecken
        </Link>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        role="list"
        aria-label="Trending Uploads"
      >
        {uploads.map((u) => (
          <div
            key={u.id}
            role="listitem"
            className="relative rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md"
          >
            <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-border bg-background/70 px-2 py-1 text-xs font-medium backdrop-blur">
              🔥 {Math.round(u.trendingScore * 100)}%
            </div>
            <CreatorMediaCard upload={u} />
          </div>
        ))}
      </div>
    </section>
  )
}
