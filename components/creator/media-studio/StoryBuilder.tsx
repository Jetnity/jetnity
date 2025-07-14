'use client'

import { useEffect, useState, useTransition } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface StoryBuilderProps {
  sessionId: string
}

const snippetTemplates = [
  '🏝️ Beschreibe den schönsten Ort, den du gesehen hast.',
  '🚶 Wie verlief dein erster Tag auf der Reise?',
  '🍜 Was war dein kulinarisches Highlight?',
  '📸 Welche Momente hast du festgehalten?',
  '🎧 Was hast du auf der Reise gefühlt, gedacht, gehört?'
]

export default function StoryBuilder({ sessionId }: StoryBuilderProps) {
  const [story, setStory] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSnippets, setShowSnippets] = useState(false)

  const loadStory = async () => {
    const { data } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.content) {
      setStory(data.content)
    }
  }

  const saveStory = async () => {
    startTransition(async () => {
      await supabase.from('session_snippets').insert([
        {
          session_id: sessionId,
          content: story,
        },
      ])
    })
  }

  const appendSnippet = (text: string) => {
    setStory((prev) => (prev.length ? `${prev}\n\n${text}` : text))
  }

  useEffect(() => {
    loadStory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">📝 StoryBuilder</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowSnippets((prev) => !prev)}
              disabled={isPending}
            >
              ✨ Vorschläge
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
              disabled={isPending}
            >
              {isPreview ? 'Bearbeiten' : 'Vorschau'}
            </Button>
            <Button onClick={saveStory} disabled={isPending}>
              Speichern
            </Button>
          </div>
        </div>

        {showSnippets && (
          <div className="flex flex-wrap gap-2">
            {snippetTemplates.map((snippet, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => appendSnippet(snippet)}
              >
                {snippet}
              </Button>
            ))}
          </div>
        )}

        {isPreview ? (
          <div className="prose max-w-none">
            {story ? (
              <pre className="whitespace-pre-wrap">{story}</pre>
            ) : (
              <p className="text-muted-foreground italic">Noch kein Inhalt</p>
            )}
          </div>
        ) : (
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={12}
            placeholder="Erzähle deine Reise-Story hier in Markdown..."
            className="resize-none"
          />
        )}
      </CardContent>
    </Card>
  )
}
