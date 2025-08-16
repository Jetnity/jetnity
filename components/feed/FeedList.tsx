'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import FeedCard from './FeedCard'
import type { Tables } from '@/types/supabase'

type Session = Tables<'creator_sessions'> & { cover_image?: string | null }
type CreatorProfile = Tables<'creator_profiles'>

export default function FeedList() {
  const [sessions, setSessions] = useState<(Session & { creator: CreatorProfile | null })[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('creator_sessions')
        .select(`
          *,
          cover_image,
          creator:creator_profiles (
            id, name, avatar_url, username
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) {
        setLoading(false)
        return
      }
      // Filter out rows where creator is a SelectQueryError
      const validSessions = (data || []).filter(
        (session: any) =>
          !session.creator ||
          (typeof session.creator === 'object' &&
            !('code' in session.creator && 'details' in session.creator))
      ).map((session: any) => {
        // If creator is a SelectQueryError, set it to null
        if (
          session.creator &&
          typeof session.creator === 'object' &&
          'code' in session.creator &&
          'details' in session.creator
        ) {
          return { ...session, creator: null }
        }
        return session
      })
      setSessions(validSessions)
      setLoading(false)
    }

    fetchFeed()
  }, [])

  if (loading) {
    return <p className="text-center">Feed wird geladen…</p>
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map(session => (
        <FeedCard
          key={session.id}
          id={session.id}
          title={session.title}
          rating={session.rating ?? undefined}
          imageUrl={session.cover_image ?? undefined}
          creator={session.creator}
        />
      ))}
      {sessions.length === 0 && (
        <div className="col-span-full text-center text-neutral-400">
          Noch keine Stories gefunden.
        </div>
      )}
    </div>
  )
}
