'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  sessionId: string
}

export default function StorySessionExport({ sessionId }: Props) {
  const [markdown, setMarkdown] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: story } = await supabase
        .from('session_snippets')
        .select('content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const { data: media } = await supabase
        .from('session_media')
        .select('image_url, description')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      const lines = []

      if (story?.content) {
        lines.push(`# 📝 Story\n\n${story.content.trim()}`)
      }

      if (media?.length) {
        lines.push('\n---\n\n## 📸 Mediengalerie')
        for (const item of media) {
          lines.push(`![Bild](${item.image_url})`)
          if (item.description) {
            lines.push(`> ${item.description}`)
          }
          lines.push('')
        }
      }

      setMarkdown(lines.join('\n'))
    }

    load()
  }, [sessionId])

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">📤 Session Markdown Export</h3>
        <Button size="sm" onClick={handleCopy}>
          📋 Kopieren
        </Button>
      </div>
      <Textarea value={markdown} readOnly rows={20} className="resize-none" />
    </div>
  )
}
