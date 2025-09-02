'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Tables } from '@/types/supabase'
import CreatorMediaCard from '@/components/creator/CreatorMediaCard'
import EditUploadModal from '@/components/creator/EditUploadModal'
import CreatorMediaPreviewModal from '@/components/creator/CreatorMediaPreviewModal'
import { deleteUpload } from '@/lib/supabase/actions/uploads'

type Upload = Tables<'creator_uploads'>
const PAGE_SIZE = 12

export default function CreatorMediaGrid() {
  /* ───────── State ───────── */
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
  const fetchTokenRef = useRef(0) // verhindert Race Conditions

  // Filter
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [mood, setMood] = useState('')
  const [tag, setTag] = useState('')

  // Edit / Preview
  const [editingUpload, setEditingUpload] = useState<Upload | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  /* ───────── Fetch (paginiert) ───────── */
  const fetchPage = useCallback(async (nextPage = 0) => {
    const isFirst = nextPage === 0
    isFirst ? setLoading(true) : setLoadingMore(true)

    const token = ++fetchTokenRef.current
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Nicht authentifiziert')
        return
      }

      const from = nextPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error, count } = await supabase
        .from('creator_uploads')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

      // Abgebrochene/überholte Requests ignorieren
      if (fetchTokenRef.current !== token) return
      if (error) throw error

      setTotalCount(count ?? null)

      if (isFirst) {
        setUploads(data ?? [])
        setPage(0)
      } else {
        // Dedupe + Sort via Map (kein Closure auf alten State)
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
    } catch (e) {
      console.error(e)
      toast.error('Fehler beim Laden der Uploads')
    } finally {
      isFirst ? setLoading(false) : setLoadingMore(false)
    }
  }, [])

  // initial
  useEffect(() => {
    void fetchPage(0)
  }, [fetchPage])

  /* ───────── Realtime Sync ───────── */
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      subscription = supabase
        .channel('creator_uploads_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'creator_uploads', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setUploads((prev) => [payload.new as Upload, ...prev])
              setTotalCount((c) => (typeof c === 'number' ? c + 1 : c))
            } else if (payload.eventType === 'UPDATE') {
              const upd = payload.new as Upload
              setUploads((prev) => prev.map((u) => (u.id === upd.id ? upd : u)))
            } else if (payload.eventType === 'DELETE') {
              const del = payload.old as Upload
              setUploads((prev) => prev.filter((u) => u.id !== del.id))
              setTotalCount((c) => (typeof c === 'number' ? Math.max(0, c - 1) : c))
            }
          }
        )
        .subscribe()
    })()
    return () => {
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [])

  /* ───────── Delete (Server-Action mit Storage-Cleanup) ───────── */
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Diesen Upload wirklich löschen?')) return
    const snapshot = uploadsRef.current
    // Optimistisch entfernen
    setUploads((prev) => prev.filter((u) => u.id !== id))
    try {
      await deleteUpload(id)
      toast.success('Upload gelöscht')
      setTotalCount((c) => (typeof c === 'number' ? Math.max(0, c - 1) : c))
    } catch (e: any) {
      console.error(e)
      toast.error('Löschen fehlgeschlagen', { description: e?.message })
      // rollback
      setUploads(snapshot)
    }
  }, [])

  const handleUpdate = useCallback((updated: Upload) => {
    setUploads((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }, [])

  /* ───────── Filter ───────── */
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return uploads.filter((u) => {
      const sOk = s ? (u.title ?? '').toLowerCase().includes(s) : true
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

  /* ───────── UI ───────── */
  return (
    <div>
      {/* Filterzeile */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
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
            onClick={() => fetchPage(0)}
            className="rounded-lg border px-3 py-1.5 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50"
            disabled={loading}
            aria-label="Aktualisieren"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
                onPreview={() => {
                  const idx = visibleList.findIndex((x) => x.id === u.id)
                  setPreviewIndex(Math.max(0, idx))
                  setPreviewOpen(true)
                }}
                onEdit={() => setEditingUpload(u)}
                onDelete={() => handleDelete(u.id)}
              />
            ))}
            {visibleList.length === 0 && (
              <div className="col-span-full py-10 text-center text-neutral-500">
                Keine Ergebnisse.
              </div>
            )}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
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

      {/* Preview Modal */}
      <CreatorMediaPreviewModal
        items={visibleList as any}
        index={previewIndex}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onIndexChange={setPreviewIndex}
      />

      {/* Edit Modal */}
      {editingUpload && (
        <EditUploadModal
          upload={editingUpload}
          isOpen={!!editingUpload}
          onClose={() => setEditingUpload(null)}
          onUpdate={(upd) => {
            handleUpdate(upd as Upload)
            setEditingUpload(null)
          }}
        />
      )}
    </div>
  )
}
