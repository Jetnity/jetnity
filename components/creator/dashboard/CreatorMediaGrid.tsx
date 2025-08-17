'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CreatorMediaCard from '../CreatorMediaCard'
import EditUploadModal from '../EditUploadModal'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

const PAGE_SIZE = 12

export default function CreatorMediaGrid() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [mood, setMood] = useState('')
  const [tag, setTag] = useState('')

  // Edit
  const [editingUpload, setEditingUpload] = useState<Upload | null>(null)

  // Initial + paginierte Ladung
  const fetchPage = useCallback(async (nextPage = 0) => {
    const isFirst = nextPage === 0
    isFirst ? setLoading(true) : setLoadingMore(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      toast.error('Nicht authentifiziert')
      isFirst ? setLoading(false) : setLoadingMore(false)
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

    if (error) {
      toast.error('Fehler beim Laden der Uploads')
      isFirst ? setLoading(false) : setLoadingMore(false)
      return
    }

    if (isFirst) {
      setUploads(data ?? [])
    } else {
      setUploads(prev => [...prev, ...(data ?? [])])
    }

    const total = count ?? 0
    const loaded = (isFirst ? 0 : uploads.length) + (data?.length ?? 0)
    setHasMore(loaded < total)

    isFirst ? setLoading(false) : setLoadingMore(false)
    if (isFirst) setPage(0)
    else setPage(nextPage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads.length])

  useEffect(() => {
    fetchPage(0)
  }, [fetchPage])

  // Optional: Realtime (INSERT/UPDATE/DELETE)
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null

    const sub = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      subscription = supabase
        .channel('creator_uploads_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'creator_uploads', filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setUploads(prev => [payload.new as Upload, ...prev])
            } else if (payload.eventType === 'UPDATE') {
              const upd = payload.new as Upload
              setUploads(prev => prev.map(u => (u.id === upd.id ? upd : u)))
            } else if (payload.eventType === 'DELETE') {
              const del = payload.old as Upload
              setUploads(prev => prev.filter(u => u.id !== del.id))
            }
          }
        )
        .subscribe()
    }
    sub()
    return () => {
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [])

  // Delete (optimistisch + Storage cleanup)
  const handleDelete = useCallback(async (id: string, imageUrl?: string | null) => {
    const confirmDelete = confirm('Diesen Upload wirklich löschen?')
    if (!confirmDelete) return

    const original = [...uploads]
    setUploads(prev => prev.filter(u => u.id !== id))

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) {
      toast.error('Nicht authentifiziert')
      setUploads(original)
      return
    }

    const { error: dbError } = await supabase
      .from('creator_uploads')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    // Storage key aus Public URL extrahieren
    const storageKey = (() => {
      if (!imageUrl) return null
      const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/`
      return imageUrl.startsWith(base) ? imageUrl.replace(base, '') : null
    })()

    let bucketError = null as unknown as { message?: string } | null
    if (storageKey) {
      const res = await supabase.storage.from('creator-media').remove([storageKey])
      bucketError = res.error
    }

    if (dbError || bucketError) {
      toast.error('Fehler beim Löschen')
      setUploads(original)
    } else {
      toast.success('Upload gelöscht')
    }
  }, [uploads])

  // Edit – nach dem Speichern Upload in Liste aktualisieren
  const handleUpdate = useCallback((updated: Upload) => {
    setUploads(prev => prev.map(u => (u.id === updated.id ? updated : u)))
  }, [])

  // Filter
  const filtered = useMemo(() => {
    return uploads.filter(u => {
      const s = search ? (u.title ?? '').toLowerCase().includes(search.toLowerCase()) : true
      const r = region ? u.region === region : true
      const m = mood ? u.mood === mood : true
      const t = tag ? (u.tags ?? []).includes(tag) : true
      return s && r && m && t
    })
  }, [uploads, search, region, mood, tag])

  const regions = useMemo(
    () => Array.from(new Set(uploads.map(u => u.region).filter(Boolean))),
    [uploads]
  )
  const moods = useMemo(
    () => Array.from(new Set(uploads.map(u => u.mood).filter(Boolean))),
    [uploads]
  )
  const tags = useMemo(
    () => Array.from(new Set(uploads.flatMap(u => (u.tags ?? [])).filter(Boolean))),
    [uploads]
  )

  return (
    <div>
      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suche nach Titel…"
          className="border px-3 py-2 rounded-lg shadow-sm"
        />
        <select value={region} onChange={e => setRegion(e.target.value)} className="border px-3 py-2 rounded-lg">
          <option value="">Region wählen</option>
          {regions.map(r => <option key={r as string}>{r as string}</option>)}
        </select>
        <select value={mood} onChange={e => setMood(e.target.value)} className="border px-3 py-2 rounded-lg">
          <option value="">Stimmung wählen</option>
          {moods.map(m => <option key={m as string}>{m as string}</option>)}
        </select>
        <select value={tag} onChange={e => setTag(e.target.value)} className="border px-3 py-2 rounded-lg">
          <option value="">Tag wählen</option>
          {tags.map(t => <option key={t as string}>{t as string}</option>)}
        </select>
        {(search || region || mood || tag) && (
          <button
            onClick={() => { setSearch(''); setRegion(''); setMood(''); setTag(''); }}
            className="text-sm text-blue-600 hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-60 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(u => (
              <CreatorMediaCard
                key={u.id}
                upload={u}
                // Diese Props optional nutzen, falls deine Card sie unterstützt:
                onEdit={() => setEditingUpload(u)}
                onDelete={() => handleDelete(u.id, u.image_url ?? u.file_url ?? undefined)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-neutral-500 py-10 text-center">
                Keine Ergebnisse.
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => fetchPage(page + 1)}
                disabled={loadingMore}
                className="px-6 py-2 rounded-lg border shadow-sm hover:shadow transition disabled:opacity-50"
              >
                {loadingMore ? 'Laden…' : 'Mehr laden'}
              </button>
            </div>
          )}
        </>
      )}

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
