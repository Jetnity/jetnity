// app/feed/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import FeedGridInfinite from '@/components/feed/FeedGridInfinite'

type Session = Tables<'creator_sessions'>

function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') s.set(k, String(v))
  })
  return s.toString()
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    status?: 'draft' | 'published' | 'all'
    sort?: 'new' | 'old'
    page?: string
    perPage?: string
  }
}) {
  const supabase = createServerComponentClient()

  const q = (searchParams?.q || '').trim()
  const status = (searchParams?.status as 'draft' | 'published' | 'all') || 'draft'
  const sort = (searchParams?.sort as 'new' | 'old') || 'new'
  const perPage = Math.min(30, Math.max(6, Number(searchParams?.perPage) || 12))
  const page = Math.max(1, Number(searchParams?.page) || 1)

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Initiale Seite (SSR) + Count
  let listQuery = supabase
    .from('creator_sessions')
    .select('id,title,user_id,published_at', { count: 'exact' })

  if (status === 'draft') listQuery = listQuery.is('published_at', null)
  if (status === 'published') listQuery = listQuery.not('published_at', 'is', null)
  if (q) listQuery = listQuery.ilike('title', `%${q.replace(/\s+/g, '%')}%`)

  const { data, count, error } = await listQuery
    .order('id', { ascending: sort === 'old' })
    .range(from, to)

  if (error) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <div className="surface-1 p-6 rounded-xl text-destructive">
          Fehler beim Laden der Sessions: {error.message}
        </div>
      </main>
    )
  }

  const items = (data || []) as Session[]
  const total = count ?? 0

  // Counts für Tabs
  const [{ count: allCnt }, { count: draftCnt }, { count: pubCnt }] = await Promise.all([
    supabase.from('creator_sessions').select('id', { head: true, count: 'exact' }),
    supabase.from('creator_sessions').select('id', { head: true, count: 'exact' }).is('published_at', null),
    supabase.from('creator_sessions').select('id', { head: true, count: 'exact' }).not('published_at', 'is', null),
  ])

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Creator Sessions</h1>

        {/* Suche + Sortierung */}
        <form action="/feed" className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nach Titel suchen…"
              className="w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="perPage" value={perPage} />
          </div>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="new">Neueste zuerst</option>
            <option value="old">Älteste zuerst</option>
          </select>
          <button className="btn-premium rounded-lg bg-primary px-4 py-2 text-white text-sm" type="submit">
            Anwenden
          </button>
          {(q || status !== 'draft' || sort !== 'new') && (
            <Link
              href="/feed"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
            >
              Zurücksetzen
            </Link>
          )}
        </form>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: 'Alle', count: allCnt ?? 0 },
          { key: 'draft', label: 'Entwürfe', count: draftCnt ?? 0 },
          { key: 'published', label: 'Veröffentlicht', count: pubCnt ?? 0 },
        ] as const).map((t) => {
          const active = status === t.key
          const href = `/feed?${qs({ q, status: t.key, sort, perPage })}`
          return (
            <Link key={t.key} href={href} className={`tab-chip ${active ? 'tab-chip--active' : ''}`}>
              {t.label}
              <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-[11px] dark:bg-white/10">
                {t.count}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Grid: initiale Seite + Infinite Scroll */}
      {items.length === 0 ? (
        <div className="surface-1 rounded-xl p-8 text-center text-muted-foreground">
          Keine passenden Sessions gefunden.
        </div>
      ) : (
        <FeedGridInfinite
          initialItems={items}
          total={total}
          perPage={perPage}
          initialPage={page}
          q={q || undefined}
          status={status}
          sort={sort}
        />
      )}
    </main>
  )
}
