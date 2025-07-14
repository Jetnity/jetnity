'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'

import CreatorMediaCard from './CreatorMediaCard'

type Upload = Tables<'creator_uploads'>

export default function CreatorMediaList() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('creator_uploads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fehler beim Laden der Uploads:', error.message)
      } else {
        setUploads(data ?? [])
      }

      setLoading(false)
    }

    fetchUploads()
  }, [])

  if (loading) {
    return <p className="text-muted-foreground">Lade Inhalte…</p>
  }

  if (uploads.length === 0) {
    return <p className="text-muted-foreground">Noch keine Inhalte hochgeladen.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {uploads.map((upload) => (
        <CreatorMediaCard key={upload.id} upload={upload} />
      ))}
    </div>
  )
}
