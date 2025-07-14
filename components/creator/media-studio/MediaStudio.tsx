'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'

import MediaUploadForm from './MediaUploadForm'
import TextToImageGenerator from './TextToImageGenerator'
import GalleryGrid from './GalleryGrid'
import StoryExportPanel from './StoryExportPanel'
import StoryPdfExportButton from './StoryPdfExportButton'
import StoryMarkdownExportButton from './StoryMarkdownExportButton'
import StoryLinkCopyButton from './StoryLinkCopyButton'
import VisibilityToggle from './VisibilityToggle'
import StoryBuilder from './StoryBuilder'
import StorySessionExport from './StorySessionExport'
import SessionRating from './SessionRating'
import SessionPerformancePanel from './SessionPerformancePanel'

type MediaItem = Tables<'session_media'>
type SessionMetric = Tables<'creator_session_metrics'>

interface MediaStudioProps {
  sessionId: string
  userId: string
}

export default function MediaStudio({ sessionId, userId }: MediaStudioProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [performance, setPerformance] = useState<{ impressions: number; views: number }>({
    impressions: 0,
    views: 0,
  })

  useEffect(() => {
    const loadMedia = async () => {
      const { data } = await supabase
        .from('session_media')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      setMedia((data as MediaItem[]) || [])
    }

    const loadPerformance = async () => {
      const { data } = await supabase
        .from('creator_session_metrics')
        .select('impressions, views')
        .eq('session_id', sessionId)
        .single()

      if (data) {
        const metrics = data as SessionMetric
        setPerformance({
          impressions: metrics.impressions ?? 0,
          views: metrics.views ?? 0,
        })
      }
    }

    loadMedia()
    loadPerformance()
  }, [sessionId])

  return (
    <div className="space-y-6">
      <MediaUploadForm sessionId={sessionId} userId={userId} />
      <TextToImageGenerator sessionId={sessionId} userId={userId} />
      <GalleryGrid media={media} />

      <StoryExportPanel sessionId={sessionId}>
        <StoryPdfExportButton sessionId={sessionId} />
        <StoryMarkdownExportButton sessionId={sessionId} />
        <StoryLinkCopyButton sessionId={sessionId} />
      </StoryExportPanel>

      <VisibilityToggle sessionId={sessionId} currentVisibility="private" />
      <StoryBuilder sessionId={sessionId} />
      <StorySessionExport sessionId={sessionId} />
      <SessionRating
        sessionId={sessionId}
        storyText=""
        existingRating={undefined}
        existingInsights=""
      />

      <SessionPerformancePanel
        impressions={performance.impressions}
        views={performance.views}
      />
    </div>
  )
}
