'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import CreatorMediaCard from '@/components/creator/CreatorMediaCard'
import CreatorMediaPreviewModal from '@/components/creator/CreatorMediaPreviewModal'

type Upload = Tables<'creator_uploads'>

type Props = {
  /** Datenscope: nur eigene Uploads (default) oder alle */
  scope?: 'mine' | 'all'
  /** Page Size für Pagination */
  pageSize?: number
  /** Filterleiste anzeigen */
  showFilters?: boolean
  /** Realtime aktivieren (INSERT/UPDATE/DELETE) */
  enableRealtime?: boolean
  /** Zusätzliche CSS-Klassen */
  className?: string
}

export default function CreatorMediaList({
  scope = 'mine',
  pageSize = 12,
  showFilters = true,
  enableRealtime = true,
  className,
}: Props) {
  /* -------------------- State -------------------- */
  const [uploads, setUploads] = useState<Upload[]>([])
  const uploadsRef = useRef<Upload[]>([])
  useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const fetchTokenRef = useRef(0)

  // Filter
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [mood, setMood] = useState('')
  const [tag, setTag] = useState('')

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  /* -------------------- Helpers -------------------- */
  const extractStorageKey = (publicUrl?: string | null) => {
    if (!publicUrl) return null
    try {
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/`
      if (publicUrl.startsWith(base)) return publicUrl.slice(base.length)
      const marker = '/storage/v1/object/public/creator-media/'
      const i = publicUrl.indexOf(marker)
      return i >= 0 ? publicUrl.slice(i + marker.length) : null
    } catch {
      return null
    }
  }

  /* -------------------- Laden (Seitenweise) -------------------- */
  const fetchPage = useCallback(
    async (nextPage = 0) => {
      const isFirst = nextPage === 0
      isFirst ? setLoading(true) : setLoadingMore(true)
      const token = ++fetchTokenRef.current

      try {
        let userId: string | null = null
        if (scope === 'mine') {
          const { data: { user }, error: userErr } = await supabase.auth.getUser()
          if (userErr || !user) throw new Error('Nicht authentifiziert')
          userId = user.id
        }

        const from = nextPage * pageSize
        const to = from + pageSize - 1

        let q = supabase.from('creator_uploads').select('*', { count: 'exact' })
        if (userId) q = q.eq('user_id', userId)
        const { data, error, count } = await q.order('created_at', { ascending: false }).range(from, to)

        if (fetchTokenRef.current !== token) return // jüngerer Request hat gewonnen
        if (error) throw error

        setTotalCount(count ?? null)

        if (isFirst) {
          setUploads(data ?? [])
          setPage(0)
        } else {
          setUploads((prev) => {
            const map = new Map<string, Upload>()
            for (const u of prev) map.set(u.id, u)
            for (const u of data ?? []) map.set(u.id, u)
            return Array.from(map.values()).sort((a, b) =>
              (b.created_at ?? '').localeCompare(a.created_at ?? '')
            )
          })
          setPage(nextPage)
        }

        const already = isFirst ? 0 : uploadsRef.current.length
        const loaded = already + (data?.length ?? 0)
        const total = count ?? loaded
        setHasMore(loaded < total)
      } catch (e: any) {
        console.error('[CreatorMediaList] load error:', e?.message || e)
        toast.error('Fehler beim Laden der Inhalte')
      } finally {
        isFirst ? setLoading(false) : setLoadingMore(false)
      }
    },
    [pageSize, scope]
  )

  useEffect(() => {
    void fetchPage(0)
  }, [fetchPage])

  /* -------------------- Realtime -------------------- */
  useEffect(() => {
    if (!enableRealtime) return
    let channel: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      let filter = ''
      if (scope === 'mine') {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        filter = `user_id=eq.${user.id}`
      }
      channel = supabase
        .channel('creator_uploads:realtime:list')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'creator_uploads', filter },
          (payload) => {
            setUploads((prev) => {
              if (payload.eventType === 'INSERT') {
                return [payload.new as Upload, ...prev]
              }
              if (payload.eventType === 'UPDATE') {
                const upd = payload.new as Upload
                return prev.map((u) => (u.id === upd.id ? upd : u))
              }
              if (payload.eventType === 'DELETE') {
                const del = payload.old as Upload
                return prev.filter((u) => u.id !== del.id)
              }
              return prev
            })
            // count heuristisch anpassen
            setTotalCount((c) =>
              typeof c === 'number'
                ? payload.eventType === 'INSERT'
                  ? c + 1
                  : payload.eventType === 'DELETE'
                  ? Math.max(0, c - 1)
                  : c
                : c
            )
          }
        )
        .subscribe()
    })()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [enableRealtime, scope])

  /* -------------------- Delete -------------------- */
  const handleDelete = useCallback(async (id: string, url?: string | null) => {
    if (!confirm('Diesen Upload wirklich löschen?')) return
    const snapshot = uploadsRef.current
    setUploads((prev) => prev.filter((u) => u.id !== id))

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id ?? null
      const db = supabase.from('creator_uploads').delete().eq('id', id)
      const dbReq = scope === 'mine' && userId ? db.eq('user_id', userId) : db
      const { error: dbErr } = await dbReq
      if (dbErr) throw dbErr

      const key = extractStorageKey(url)
      if (key) {
        const { error: stErr } = await supabase.storage.from('creator-media').remove([key])
        if (stErr) {
          // Nicht fatal: UI bleibt konsistent; Log nur in Console
          console.warn('[CreatorMediaList] storage remove warning:', stErr)
        }
      }

      toast.success('Upload gelöscht')
      setTotalCount((c) => (typeof c === 'number' ? Math.max(0, c - 1) : c))
    } catch (e: any) {
      console.error('[CreatorMediaList] delete error:', e?.message || e)
      toast.error('Löschen fehlgeschlagen')
      setUploads(snapshot) // rollback
    }
  }, [scope])

  /* -------------------- Filter -------------------- */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return uploads.filter((u) => {
      const sOk = q ? (u.title ?? '').toLowerCase().includes(q) : true
      const rOk = region ? u.region === region : true
      const mOk = mood ? u.mood === mood : true
      const tOk = tag ? (u.tags ?? []).includes(tag) : true
      return sOk && rOk && mOk && tOk
    })
  }, [uploads, search, region, mood, tag])

  const regions = useMemo(
    () => Array.from(new Set(uploads.map((u) => u.region).filter(Boolean))) as string[],
    [uploads]
  )
  const moods = useMemo(
    () => Array.from(new Set(uploads.map((u) => u.mood).filter(Boolean))) as string[],
    [uploads]
  )
  const tags = useMemo(
    () => Array.from(new Set(uploads.flatMap((u) => (u.tags ?? [])).filter(Boolean))) as string[],
    [uploads]
  )

  const visibleList = filtered

  /* -------------------- Render -------------------- */
  return (
    <section className={cn('w-full', className)}>
      {/* Filterleiste */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Titel…"
            className="h-9 rounded-lg border px-3 shadow-sm"
            aria-label="Uploads nach Titel suchen"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-9 rounded-lg border px-3"
            aria-label="Region filtern"
          >
            <option value="">Alle Regionen</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="h-9 rounded-lg border px-3"
            aria-label="Stimmung filtern"
          >
            <option value="">Alle Stimmungen</option>
            {moods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-9 rounded-lg border px-3"
            aria-label="Tag filtern"
          >
            <option value="">Alle Tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {(search || region || mood || tag) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setRegion('')
                setMood('')
                setTag('')
              }}
              className="text-sm text-blue-600 underline-offset-2 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
            {typeof totalCount === 'number' && (
              <span>
                {visibleList.length} / {totalCount} Einträge
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchPage(0)}
              disabled={loading}
              className="rounded-lg border px-3 py-1.5 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
              aria-label="Aktualisieren"
            >
              Aktualisieren
            </button>
          </div>
        </div>
      )}

      {/* Grid / Skeletons */}
      {loading ? (
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, 9) }).map((_, i) => (
            <div
              key={i}
              className="h-60 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-800"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleList.map((u) => (
              <CreatorMediaCard
                key={u.id}
                upload={u}
                onDelete={() =>
                  handleDelete(u.id, u.image_url ?? u.file_url ?? undefined)
                }
                onPreview={() => {
                  const idx = visibleList.findIndex((x) => x.id === u.id)
                  setPreviewIndex(Math.max(0, idx))
                  setPreviewOpen(true)
                }}
              />
            ))}

            {visibleList.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground">
                Keine Ergebnisse.
              </div>
            )}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => fetchPage(page + 1)}
                disabled={loadingMore}
                className="rounded-lg border px-6 py-2 shadow-sm transition hover:shadow disabled:opacity-50"
              >
                {loadingMore ? 'Laden…' : 'Mehr laden'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Vorschau */}
      <CreatorMediaPreviewModal
        items={visibleList as any}
        index={previewIndex}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onIndexChange={setPreviewIndex}
      />
    </section>
  )
}
