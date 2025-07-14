'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import EditUploadModal from './EditUploadModal'
import CreatorMediaCard from './CreatorMediaCard'
import SessionStatsCard from './dashboard/SessionStatsCard'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

export default function CreatorDashboard() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(false)
  const [editingUpload, setEditingUpload] = useState<Upload | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [sessionMetrics, setSessionMetrics] = useState<Tables<'creator_session_metrics'>[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Nicht authentifiziert')
        setLoading(false)
        return
      }

      // Uploads laden
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('creator_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (uploadsError) {
        toast.error('Fehler beim Laden der Uploads')
      } else {
        setUploads(uploadsData || [])
      }

      // Session-Metriken laden
      const { data: metricsData, error: metricsError } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (metricsError) {
        toast.error('Fehler beim Laden der Session-Metriken')
      } else {
        setSessionMetrics(metricsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const handleDelete = async (id: string, imageUrl: string) => {
    const confirmDelete = confirm('Diesen Upload wirklich löschen?')
    if (!confirmDelete) return

    const original = [...uploads]
    setUploads((prev) => prev.filter((u) => u.id !== id))

    const { data: session } = await supabase.auth.getUser()
    const userId = session.user?.id

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

    const storagePath = imageUrl.replace(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/`,
      ''
    )

    const { error: bucketError } = await supabase.storage
      .from('creator-media')
      .remove([storagePath])

    if (dbError || bucketError) {
      toast.error('Fehler beim Löschen')
      setUploads(original)
    } else {
      toast.success('Upload gelöscht')
    }
  }

  const handleUpdateUpload = (updated: Upload) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    )
  }

  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      const matchSearch = u.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRegion = selectedRegion ? u.region === selectedRegion : true
      const matchMood = selectedMood ? u.mood === selectedMood : true
      const matchTag = selectedTag ? u.tags?.includes(selectedTag) : true
      return matchSearch && matchRegion && matchMood && matchTag
    })
  }, [uploads, searchTerm, selectedRegion, selectedMood, selectedTag])

  if (loading) return <p className="text-center">Lade Inhalte…</p>

  return (
    <div className="p-4 space-y-10">
      {/* Filter UI */}
      <div className="flex flex-wrap gap-4 items-center">
        <input
          type="text"
          placeholder="Suche nach Titel..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-lg shadow-sm"
        />
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="">Region wählen</option>
          {[...new Set(uploads.map((u) => u.region))].map((region) => (
            <option key={region}>{region}</option>
          ))}
        </select>
        <select
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="">Stimmung wählen</option>
          {[...new Set(uploads.map((u) => u.mood))].map((mood) => (
            <option key={mood}>{mood}</option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        >
          <option value="">Tag wählen</option>
          {[...new Set(uploads.flatMap((u) => u.tags || []))].map((tag) => (
            <option key={tag}>{tag}</option>
          ))}
        </select>
        {(selectedRegion || selectedMood || selectedTag || searchTerm) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedRegion('')
              setSelectedMood('')
              setSelectedTag('')
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Upload Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredUploads.map((upload) => (
          <CreatorMediaCard
            key={upload.id}
            upload={upload}
            onEdit={() => setEditingUpload(upload)}
            onDelete={() => handleDelete(upload.id, upload.image_url ?? '')}
          />
        ))}
        {filteredUploads.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            Keine Ergebnisse gefunden.
          </p>
        )}
      </div>

      {/* Modal für Edit */}
      <EditUploadModal
        upload={editingUpload!}
        isOpen={!!editingUpload}
        onClose={() => setEditingUpload(null)}
        onUpdate={handleUpdateUpload}
      />

      {/* Session Performance – SessionStatsCard */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">📊 Session Performance</h2>
        {sessionMetrics.length === 0 ? (
          <p className="text-neutral-500">Noch keine Sessions vorhanden.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessionMetrics.map((metrics) => (
              <SessionStatsCard key={metrics.session_id} metrics={metrics} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
