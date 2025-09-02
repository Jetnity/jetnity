// components/creator/media-studio/StoryExportPanel.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/supabase'
import { Loader2, Eye, Download, Copy, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type SnippetRow = Tables<'session_snippets'>
type MediaRow = Tables<'session_media'>
type SessionRow = Tables<'creator_sessions'>

interface StoryExportPanelProps {
  sessionId: string
  children?: React.ReactNode
  className?: string
}

type TimelineItem =
  | { kind: 'text'; id: string; created_at: string; content: string }
  | { kind: 'image'; id: string; created_at: string; url: string; alt?: string | null }

export default function StoryExportPanel({ sessionId, children, className }: StoryExportPanelProps) {
  const [title, setTitle] = React.useState<string>('Jetnity Reise-Story')
  const [timeline, setTimeline] = React.useState<TimelineItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const dtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('de-CH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  )

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // Titel der Session (falls vorhanden)
        const { data: session } = await supabase
          .from('creator_sessions')
          .select('title')
          .eq('id', sessionId)
          .maybeSingle()

        if (session?.title) setTitle(session.title)

        const [{ data: snippets }, { data: media }] = await Promise.all([
          supabase
            .from('session_snippets')
            .select('id, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
          supabase
            .from('session_media')
            .select('id, image_url, caption, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
        ])

        const items: TimelineItem[] = []

        ;(snippets ?? []).forEach((s: Pick<SnippetRow, 'id' | 'content' | 'created_at'>) => {
          if (!s?.content) return
          items.push({
            kind: 'text',
            id: s.id,
            created_at: s.created_at ?? new Date().toISOString(),
            content: s.content,
          })
        })

        ;(media ?? [])
          .filter((m: any) => !!m?.image_url)
          .forEach((m: any) => {
            items.push({
              kind: 'image',
              id: m.id,
              created_at: m.created_at ?? new Date().toISOString(),
              url: m.image_url as string,
              alt: (m.caption as string) || null,
            })
          })

        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (!cancelled) setTimeline(items)
      } catch (e: any) {
        console.error(e)
        if (!cancelled) setError('Inhalte konnten nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  // ───────────────────────── helpers ─────────────────────────

  const escapeHtml = (input: string) =>
    input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const paragraphsHtml = (text: string) => {
    const safe = escapeHtml(text.trim())
    // Absätze anhand doppelter Zeilenumbrüche
    return safe
      .split(/\n{2,}/g)
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('\n')
  }

  const makeHtmlDocument = React.useCallback(
    (bodyHtml: string) => {
      const safeTitle = escapeHtml(title || 'Jetnity Reise-Story')
      return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root{
      --bg:#0b0c10; --fg:#111827; --paper:#ffffff; --text:#111827; --muted:#6b7280;
      --accent:#0ea5e9;
    }
    @media(prefers-color-scheme:dark){
      :root { --paper:#0b0c10; --text:#e5e7eb; --muted:#9ca3af; }
    }
    *{box-sizing:border-box}
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;background:var(--paper);color:var(--text);line-height:1.65}
    .container{max-width:880px;margin:0 auto;padding:2rem 1.25rem}
    header{margin-bottom:1.5rem}
    h1{font-size:2rem; line-height:1.2; margin:0 0 0.25rem}
    .meta{color:var(--muted); font-size:0.9rem}
    figure{margin:1.25rem 0}
    img{max-width:100%;display:block;border-radius:12px}
    figcaption{color:var(--muted); font-size:0.9rem; margin-top:0.35rem}
    p{margin:0 0 1rem}
    hr{border:none; border-top:1px solid rgba(0,0,0,.08); margin:2rem 0}
    @media print {
      .no-print{display:none!important}
      body{background:white; color:black}
      img{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${safeTitle}</h1>
      <div class="meta">Exportiert am ${dtf.format(new Date())}</div>
    </header>
    ${bodyHtml}
  </div>
</body>
</html>`
    },
    [title, dtf]
  )

  const timelineAsHtml = React.useMemo(() => {
    if (timeline.length === 0) return ''
    const pieces = timeline.map((item) => {
      if (item.kind === 'image') {
        const alt = escapeHtml(item.alt || '')
        return `<figure>
  <img src="${escapeHtml(item.url)}" alt="${alt}"/>
  ${alt ? `<figcaption>${alt}</figcaption>` : ''}
</figure>`
      }
      // text
      return paragraphsHtml(item.content)
    })
    return pieces.join('\n')
  }, [timeline])

  const timelineAsMarkdown = React.useMemo(() => {
    if (timeline.length === 0) return ''
    const parts = timeline.map((item) => {
      if (item.kind === 'image') {
        const alt = (item.alt || '').replace(/\n/g, ' ').trim()
        return `![${alt}](${item.url})`
      }
      return item.content.trim()
    })
    const mdTitle = `# ${title || 'Jetnity Reise-Story'}\n\n*Exportiert am ${dtf.format(
      new Date()
    )}*\n\n`
    return mdTitle + parts.join('\n\n')
  }, [timeline, title, dtf])

  const openPreviewHtml = () => {
    if (!timeline.length) return
    const html = makeHtmlDocument(timelineAsHtml)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    // neues Tab
    window.open(url, '_blank', 'noopener,noreferrer')
    // URL später freigeben
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const downloadHtml = () => {
    if (!timeline.length) return
    const html = makeHtmlDocument(timelineAsHtml)
    const name = (title || 'jetnity-story').trim().toLowerCase().replace(/\s+/g, '-')
    downloadFile(`${name}.html`, html, 'text/html')
  }

  const downloadMarkdown = () => {
    if (!timeline.length) return
    const name = (title || 'jetnity-story').trim().toLowerCase().replace(/\s+/g, '-')
    downloadFile(`${name}.md`, timelineAsMarkdown, 'text/markdown')
  }

  const copyToClipboard = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`${label} kopiert.`)
    } catch {
      toast.error('Kopieren fehlgeschlagen.')
    }
  }

  // ───────────────────────── render ─────────────────────────

  return (
    <div className={cn('rounded-2xl border bg-card p-4 sm:p-5 space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">📤 Story exportieren</h4>
        <div className="text-xs text-muted-foreground">
          {loading ? 'Lädt …' : `${timeline.length} Einträge`}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Inhalte werden geladen …
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Keine Inhalte zum Exportieren vorhanden.
        </p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button size="sm" onClick={openPreviewHtml} className="justify-start">
              <Eye className="mr-2 h-4 w-4" />
              HTML-Vorschau
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadHtml} className="justify-start">
              <Download className="mr-2 h-4 w-4" />
              Als HTML speichern
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadMarkdown} className="justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Als Markdown speichern
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(makeHtmlDocument(timelineAsHtml), 'HTML')}
              className="justify-start"
            >
              <Copy className="mr-2 h-4 w-4" />
              HTML kopieren
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(timelineAsMarkdown, 'Markdown')}
              className="justify-start"
            >
              <Copy className="mr-2 h-4 w-4" />
              Markdown kopieren
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {title ? <span className="font-medium">{title}</span> : 'Story'} — exportiert am{' '}
            {dtf.format(new Date())}
          </p>

          {children && <div className="pt-2">{children}</div>}
        </>
      )}
    </div>
  )
}
