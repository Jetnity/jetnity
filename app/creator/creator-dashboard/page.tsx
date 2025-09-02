// app/creator/creator-dashboard/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'

import CreatorProfileCard from '@/components/creator/dashboard/CreatorProfileCard'
import CreatorDashboardWelcome from '@/components/creator/CreatorDashboardWelcome.server'
import ContentUploadForm from '@/components/creator/ContentUploadForm'
import CreatorMediaGrid from '@/components/creator/dashboard/CreatorMediaGrid'
import CreatorBlogSection from '@/components/creator/dashboard/CreatorBlogSection'
import SessionStatsPanel from '@/components/creator/dashboard/SessionStatsPanel'
import ImpactScorePanel from '@/components/creator/dashboard/ImpactScorePanel'
import TimeframeTabs from '@/components/creator/dashboard/TimeframeTabs'
import SectionHeader from '@/components/ui/SectionHeader'
import GoToMediaStudioButton from '@/components/creator/GoToMediaStudioButton'
import KpiTiles from '@/components/creator/dashboard/KpiTiles'
import QuickActions from '@/components/creator/dashboard/QuickActions'
import MobileQuickbar from '@/components/creator/dashboard/MobileQuickbar'
import Link from 'next/link'

import { timeframeFromSearch } from '@/lib/analytics/timeframe'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CreatorDashboardPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  noStore()

  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent('/creator/creator-dashboard')
    redirect(`/auth/sign-in?next=${next}`)
  }

  // Einheitliche Timeframe-Auswertung (30|90|180|all)
  const tf = timeframeFromSearch(searchParams ?? null, 'range', '90')
  const days: number | 'all' = tf.days

  // TODO: echte KPIs anbinden – Platzhalter stabilisieren Layout
  const kpis = {
    views: 0,
    earnings: 0,
    ctr: 0,
    uploads: 0,
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 md:py-12 xl:px-10">
      {/* ===== Top Action Bar ===== */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 md:mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Creator-Dashboard</h1>
        <div className="flex items-center gap-3">
          <TimeframeTabs />
          <Link
            href="/creator/analytics"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent"
          >
            Analytics
          </Link>
          <GoToMediaStudioButton />
        </div>
      </header>

      {/* ===== KPI Tiles + Quick Actions ===== */}
      <div className="mb-6 space-y-4 md:mb-8 md:space-y-5">
        <KpiTiles {...kpis} />
        <QuickActions />
      </div>

      {/* ===== Hauptbereich ===== */}
      <div className="grid grid-cols-1 gap-y-10 gap-x-6 lg:grid-cols-12 lg:gap-x-10">
        {/* -------- Main Content (8) -------- */}
        <main className="space-y-10 lg:col-span-8" aria-labelledby="main-content">
          <h2 id="main-content" className="sr-only">
            Hauptinhalte
          </h2>

          <Suspense fallback={<CardSkeleton height="h-32" />}>
            <CreatorDashboardWelcome />
          </Suspense>

          <section className="mt-2">
            <SectionHeader title="Neuen Inhalt hochladen" subtitle="Videos, Bilder oder Guides direkt per Upload." />
            <div className="mt-5">
              <Suspense fallback={<FormSkeleton />}>
                <ContentUploadForm />
              </Suspense>
            </div>
          </section>

          <section className="mt-2">
            <SectionHeader title="Deine Uploads & Stories" subtitle="Alle von dir erstellten Inhalte im Überblick." />
            <Suspense fallback={<GridSkeleton />}>
              <CreatorMediaGrid />
            </Suspense>
          </section>

          <section className="mt-2">
            <SectionHeader title="Blogposts & Stories" subtitle="Verwalte und veröffentliche deine Beiträge." />
            <Suspense fallback={<ListSkeleton />}>
              <CreatorBlogSection />
            </Suspense>
          </section>
        </main>

        {/* -------- Right Rail (4) -------- */}
        <aside className="lg:col-span-4" aria-labelledby="right-rail">
          <h2 id="right-rail" className="sr-only">
            Überblick & Kennzahlen
          </h2>

          {/* sticky erst ab lg */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            <Suspense fallback={<CardSkeleton />}>
              <ImpactScorePanel days={days} />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <SessionStatsPanel days={days} hideWhenEmpty />
            </Suspense>
            <Suspense fallback={<CardSkeleton />}>
              <CreatorProfileCard />
            </Suspense>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Actions */}
      <MobileQuickbar />
    </div>
  )
}

/* ===== Skeletons ===== */
function CardSkeleton({ height = 'h-48' as const }: { height?: string }) {
  return (
    <div
      className={`w-full rounded-2xl border border-border bg-card shadow-sm ${height} animate-pulse`}
      aria-hidden="true"
    />
  )
}
function FormSkeleton() {
  return (
    <div
      className="animate-pulse space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
      aria-hidden="true"
    >
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-24 rounded-md bg-muted" />
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-10 rounded-md bg-muted" />
      <div className="h-10 rounded-md bg-muted" />
    </div>
  )
}
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 animate-pulse sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-xl border border-border bg-card shadow-sm" />
      ))}
    </div>
  )
}
function ListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl border border-border bg-card shadow-sm" />
      ))}
    </div>
  )
}
