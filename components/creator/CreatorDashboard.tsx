'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import CreatorProfileCard from './dashboard/CreatorProfileCard'
import CreatorMediaGrid from './dashboard/CreatorMediaGrid'
import CreatorBlogSection from './dashboard/CreatorBlogSection'
import SessionStatsPanel from './dashboard/SessionStatsPanel'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'> & { creator_profile?: Tables<'creator_profiles'> | null }
type CreatorProfile = Tables<'creator_profiles'>

type Props = {
  sidebarOnly?: boolean
  gridOnly?: boolean
  blogOnly?: boolean
  statsOnly?: boolean
}

export default function CreatorDashboard(props: Props) {
  // ...States wie gehabt...
  const [uploads, setUploads] = useState<Upload[]>([])
  const [sessionMetrics, setSessionMetrics] = useState<Tables<'creator_session_metrics'>[]>([])
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  // ...weitere States und Fetch-Logic...

  useEffect(() => {
    // ...fetchData wie gehabt...
  }, [])

  // Props-Steuerung für modulare Anzeige
  if (props.sidebarOnly) {
    return (
      <CreatorProfileCard profile={profile} setProfile={setProfile} />
    )
  }
  if (props.gridOnly) {
    return (
      <CreatorMediaGrid uploads={uploads} setUploads={setUploads} />
    )
  }
  if (props.blogOnly) {
    return (
      <CreatorBlogSection />
    )
  }
  if (props.statsOnly) {
    return (
      <SessionStatsPanel metrics={sessionMetrics} />
    )
  }
  // Default: Klassischer, kompletter Aufbau (optional, falls direkt verwendet)
  return (
    <div>
      <CreatorProfileCard profile={profile} setProfile={setProfile} />
      <CreatorMediaGrid uploads={uploads} setUploads={setUploads} />
      <CreatorBlogSection />
      <SessionStatsPanel metrics={sessionMetrics} />
    </div>
  )
}
