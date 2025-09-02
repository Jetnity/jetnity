'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Clipboard, ClipboardCheck, Eye, Pencil, Save, Sparkles } from 'lucide-react'

interface StoryBuilderProps {
  sessionId: string
}

const snippetTemplates = [
  '🏝️ Beschreibe den schönsten Ort, den du gesehen hast.',
  '🚶 Wie verlief dein erster Tag auf der Reise?',
  '🍜 Was war dein kulinarisches Highlight?',
  '📸 Welche Momente hast du festgehalten?',
  '🎧 Was hast du auf der Reise gefühlt, gedacht, gehört?',
]

export default function StoryBuilder({ sessionId }: StoryBuilderProps) {
  const [story, setStory] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSnippets, setShowSnippets] = useState(false)

  // Save UX
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const dirtyRef = useRef(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** ------- Helpers ------- */
  const wordCount = useMemo(
    () => (story.trim() ? story.trim().split(/\s+/).length : 0),
    [story]
  )
  const charCount = story.length

  const loadStory = useCallback(async () => {
    const { data, error } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(error)
      toast.error('Story konnte nicht geladen werden')
      return
    }
    if (data?.content) setStory(data.content)
    dirtyRef.current = false
    setLastSavedAt(null)
  }, [sessionId])

  const saveStory = useCallback(
    (mode: 'manual' | 'auto' = 'manual') => {
      if (!dirtyRef.current) return
      startTransition(async () => {
        const { error } = await supabase.from('session_snippets').insert([
          { session_id: sessionId, content: story },
        ])
        if (error) {
          console.error(error)
          if (mode === 'manual') toast.error('Speichern fehlgeschlagen')
          return
        }
        dirtyRef.current = false
        setLastSavedAt(new Date())
        if (mode === 'manual') toast.success('Story gespeichert')
      })
    },
    [sessionId, story]
  )

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => saveStory('auto'), 1200)
  }, [saveStory])

  const appendSnippet = (text: string) => {
    setStory((prev) => (prev.length ? `${prev}\n\n${text}` : text))
    dirtyRef.current = true
    scheduleAutoSave()
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(story)
    setJustCopied(true)
    setTimeout(() => setJustCopied(false), 1200)
  }

  /** ------- Effects ------- */
  useEffect(() => {
    void loadStory()
  }, [loadStory])

  // debounced auto-save on story changes
  useEffect(() => {
    if (!dirtyRef.current) return
    scheduleAutoSave()
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [story, scheduleAutoSave])

  // cmd/ctrl + s → save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveStory('manual')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [saveStory])

  /** ------- Render ------- */
  const statusLabel = (() => {
    if (isPending) return 'Speichere…'
    if (dirtyRef.current) return 'Änderungen nicht gespeichert'
    if (lastSavedAt) return `Gespeichert ${lastSavedAt.toLocaleTimeString()}`
    return ' '
  })()

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">📝 StoryBuilder</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowSnippets((v) => !v)}
              disabled={isPending}
              title="Snippet-Vorschläge einblenden"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Vorschläge
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreview((v) => !v)}
              disabled={isPending}
              title={isPreview ? 'Zur Bearbeitung' : 'Vorschau anzeigen'}
            >
              {isPreview ? (
                <>
                  <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" /> Vorschau
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={() => saveStory('manual')}
              disabled={isPending || !dirtyRef.current}
              title="Speichern (⌘/Ctrl+S)"
            >
              <Save className="mr-2 h-4 w-4" />
              Speichern
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={copyToClipboard}
              disabled={!story}
              title="In Zwischenablage kopieren"
            >
              {justCopied ? (
                <>
                  <ClipboardCheck className="mr-2 h-4 w-4" /> Kopiert
                </>
              ) : (
                <>
                  <Clipboard className="mr-2 h-4 w-4" /> Kopieren
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status-Zeile */}
        <div
          className="text-xs text-muted-foreground"
          aria-live="polite"
          role="status"
        >
          {statusLabel}
        </div>

        {/* Snippet Chips */}
        {showSnippets && (
          <div className="flex flex-wrap gap-2">
            {snippetTemplates.map((snippet, idx) => (
              <Button
                key={idx}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendSnippet(snippet)}
                title="Snippet einfügen"
              >
                {snippet}
              </Button>
            ))}
          </div>
        )}

        {/* Editor / Preview */}
        {isPreview ? (
          <div className="prose max-w-none">
            {story ? (
              <pre className="whitespace-pre-wrap">{story}</pre>
            ) : (
              <p className="italic text-muted-foreground">Noch kein Inhalt</p>
            )}
          </div>
        ) : (
          <Textarea
            value={story}
            onChange={(v) => {
              setStory(v)
              dirtyRef.current = true
            }}
            rows={12}
            placeholder="Erzähle deine Reise-Story hier in Markdown…"
            resize="auto"
            maxLength={5000}
            showCount
          />
        )}

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Wörter: <span className="tabular-nums">{wordCount}</span> · Zeichen:{' '}
            <span className="tabular-nums">{charCount}</span>
          </span>
          <span>Session-ID: {sessionId}</span>
        </div>
      </CardContent>
    </Card>
  )
}
