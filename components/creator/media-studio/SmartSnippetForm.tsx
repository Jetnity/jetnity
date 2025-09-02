// components/creator/media-studio/SmartSnippetForm.tsx
'use client'

import * as React from 'react'
import { Sparkles, Send, Loader2, Type, Lightbulb, Hash, Megaphone, Clapperboard, Eraser } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export type SnippetType = 'text' | 'idea' | 'hashtag' | 'cta' | 'script'

type Props = {
  /** Wird bei Submit aufgerufen */
  onSubmit: (content: string, type: SnippetType) => void | Promise<void>
  /** Externer Ladezustand (z. B. während Speicherung) */
  isLoading?: boolean
  /** Vorbelegung des Typs */
  defaultType?: SnippetType
  /** Maximale Zeichenlänge (UI-Hinweis + Blockierung) */
  maxLen?: number
  /** Optionale Token-Namen, die der User per Klick einfügen kann ({{token}}) */
  placeholders?: string[]
  className?: string
}

/** UI-Definition für die Type-Pills */
const TYPES: { value: SnippetType; label: string; icon: React.ComponentType<any> }[] = [
  { value: 'text',    label: 'Text',         icon: Type },
  { value: 'idea',    label: 'Idee',         icon: Lightbulb },
  { value: 'hashtag', label: 'Hashtag',      icon: Hash },
  { value: 'cta',     label: 'Call to Action', icon: Megaphone },
  { value: 'script',  label: 'Video-Skript', icon: Clapperboard },
]

export default function SmartSnippetForm({
  onSubmit,
  isLoading = false,
  defaultType = 'text',
  maxLen = 500,
  placeholders = ['name', 'brand', 'product', 'link'],
  className,
}: Props) {
  const [type, setType] = React.useState<SnippetType>(() => {
    // letzte Auswahl merken
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('smartSnippet:lastType') as SnippetType) || defaultType
    }
    return defaultType
  })
  const [content, setContent] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(draftKey(type)) || ''
    }
    return ''
  })
  const [loadingSuggestion, setLoadingSuggestion] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const taRef = React.useRef<HTMLTextAreaElement | null>(null)
  const left = Math.max(0, maxLen - content.length)

  // Draft + lastType persistieren (debounced)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('smartSnippet:lastType', type)
    // beim Typwechsel Draft laden
    const draft = localStorage.getItem(draftKey(type)) || ''
    setContent(draft)
  }, [type])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const id = setTimeout(() => {
      localStorage.setItem(draftKey(type), content)
    }, 250)
    return () => clearTimeout(id)
  }, [type, content])

  function draftKey(t: string) { return `smartSnippet:draft:${t}` }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      setError('Bitte Inhalt eingeben.')
      return
    }
    if (trimmed.length > maxLen) {
      setError(`Maximal ${maxLen} Zeichen.`)
      return
    }
    setError(null)
    Promise.resolve(onSubmit(trimmed, type)).finally(() => {
      setContent('')
      if (typeof window !== 'undefined') localStorage.removeItem(draftKey(type))
    })
  }

  async function handleGenerate() {
    setError(null)
    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/copilot/snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const json = await res.json().catch(() => ({}))
      const suggestion = String(json?.suggestion ?? '').trim()
      if (suggestion) setContent(suggestion)
      else setError('Kein Vorschlag erhalten.')
    } catch (err) {
      console.error(err)
      setError('KI-Vorschlag fehlgeschlagen.')
    } finally {
      setLoadingSuggestion(false)
    }
  }

  // Hotkeys: ⌘/Ctrl+Enter = senden, Alt+G = Vorschlag
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault()
        handleSubmit()
      }
      if (e.altKey && (e.key.toLowerCase() === 'g')) {
        e.preventDefault()
        if (!loadingSuggestion) void handleGenerate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [loadingSuggestion, content, type])

  const insertToken = (token: string) => {
    const el = taRef.current
    const snippet = `{{${token}}}`
    if (!el) {
      setContent((c) => (c ? `${c} ${snippet}` : snippet))
      return
    }
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const next = el.value.slice(0, start) + snippet + el.value.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + snippet.length
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3 rounded-xl border bg-muted/40 p-4', className)}>
      {/* Type Pills */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs',
              type === value ? 'bg-primary/10 border-primary font-semibold' : 'hover:bg-accent'
            )}
            aria-pressed={type === value}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div>
        <label htmlFor="smart-snippet-content" className="mb-1 block text-sm font-medium">
          Inhalt
        </label>
        <textarea
          id="smart-snippet-content"
          ref={taRef}
          className="min-h-28 w-full rounded-md border border-input bg-background p-2 text-sm"
          rows={6}
          placeholder="Neues Snippet eingeben oder per 💡 KI vorschlagen lassen…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={maxLen + 500} /* Hardstop etwas großzügiger, wir blocken selbst */
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1">Tokens:</span>
            {placeholders.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => insertToken(t)}
                className="rounded-full border bg-white/60 px-2 py-0.5 hover:bg-white"
                title={`Token {{${t}}} einfügen`}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setContent('')}
              className="ml-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-accent"
              title="Feld leeren"
            >
              <Eraser className="h-3 w-3" /> leeren
            </button>
          </div>
          <span className={cn(left < 0 && 'text-red-600 font-medium')}>
            {left} Zeichen übrig
          </span>
        </div>
      </div>

      {/* Actions */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loadingSuggestion}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline disabled:opacity-50"
          title="Alt+G"
        >
          {loadingSuggestion ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loadingSuggestion ? 'KI generiert…' : '💡 Vorschlag erhalten'}
        </button>

        <button
          type="submit"
          disabled={isLoading || content.trim().length === 0 || content.trim().length > maxLen}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-white transition hover:bg-primary/90 disabled:opacity-50"
          title="⌘/Ctrl + Enter"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isLoading ? 'Speichern…' : 'Snippet hinzufügen'}
        </button>
      </div>
    </form>
  )
}


