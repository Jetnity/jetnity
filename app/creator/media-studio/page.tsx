// app/creator/media-studio/page.tsx
export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import MediaStudioShell from '@/components/creator/media-studio/MediaStudioShell'
import GalleryContainer from '@/components/creator/media-studio/GalleryContainer'
import type { Tables } from '@/types/supabase'
import { Suspense } from 'react'

// ⚠️ Typ-Aliasse: KEIN ['Row'] und keine Kollision mit Komponenten-Namen
type CreatorProfileRow = Tables<'creator_profiles'>
type SessionMediaRow   = Tables<'session_media'>
type CreatorSessionRow = Tables<'creator_sessions'>

export default async function MediaStudioPage() {
  noStore() // keine Caches – immer frische Daten

  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Profil + Media-Count parallel laden
  const [{ data: profile }, mediaCountRes] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('session_media')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  // Rollen-Gate
  const allowedRoles: CreatorProfileRow['role'][] = ['pro', 'verified']
  if (!profile || !allowedRoles.includes(profile.role)) {
    redirect('/creator-dashboard')
  }

  const mediaCount = mediaCountRes?.count ?? 0

  return (
    <main className="mx-auto w-full max-w-none px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Media Studio</h1>
          <p className="text-sm text-muted-foreground">
            Erstelle Sessions, verwalte Uploads und nutze KI-Workflows – alles in einem Workspace.
          </p>
        </div>

        <Link
          href="/creator-dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15"
        >
          Zurück zum Dashboard
        </Link>
      </div>

      {/* Workspace */}
      <Suspense
        fallback={<div className="mb-10 h-[420px] w-full animate-pulse rounded-2xl border bg-muted/30" />}
      >
        <MediaStudioShell userId={user.id} />
      </Suspense>

      {/* Globale Medien-Library */}
      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Meine Medien</h2>
          <span className="text-xs text-muted-foreground">{mediaCount} Dateien</span>
        </div>

        <Suspense
          fallback={<div className="h-[320px] w-full animate-pulse rounded-2xl border bg-muted/30" />}
        >
          <GalleryContainer userId={user.id} className="mt-4" />
        </Suspense>
      </section>
    </main>
  )
}
