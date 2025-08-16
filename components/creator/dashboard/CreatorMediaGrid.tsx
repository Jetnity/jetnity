'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CreatorMediaCard from '../CreatorMediaCard'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

export default function CreatorMediaGrid() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [mood, setMood] = useState('')
  const [tag, setTag] = useState('')

  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Nicht authentifiziert')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('creator_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) toast.error('Fehler beim Laden der Uploads')
      setUploads(data ?? [])
      setLoading(false)
    }
    fetchUploads()
  }, [])

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(u => (
            <CreatorMediaCard key={u.id} upload={u} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-neutral-500 py-10 text-center">
              Keine Ergebnisse.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
