// components/creator/media-studio/StoryMarkdownExportButton.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Copy, Download, Eye, Settings2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

type SnippetRow = Tables<'session_snippets'>
type MediaRow = Tables<'session_media'>
type SessionRow = Tables<'creator_sessions'>

interface Props {
  sessionId: string
  className?: string
}

type TimelineItem =
  | { kind: 'text'; id: string; created_at: string; content: string }
  | { kind: 'image'; id: string; created_at: string; url: string; caption?: string | null }

export default function StoryMarkdownExportButton({ sessionId, className }: Props) {
  const [title, setTitle] = React.useState<string>('Jetnity Reise-Story')
  const [timeline, setTimeline] = React.useState<TimelineItem[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)

  // Export-Optionen
  const [withFrontmatter, setWithFrontmatter] = React.useState(true)
  const [withCaptions, setWithCaptions] = React.useState(true)

  const [copied, setCopied] = React.useState(false)

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
        const [{ data: s }, { data: snippets }, { data: media }] = await Promise.all([
          supabase.from('creator_sessions').select('title').eq('id', sessionId).maybeSingle(),
          supabase
            .from('session_snippets')
            .select('id, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
          supabase
            .from('session_media')
            .select('id, image_url, description, created_at') // ⬅️ description statt caption
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
        ])

        if (s?.title) setTitle(s.title)

        const items: TimelineItem[] = []

        // Array-Typen gezielt "picken" und dann iterieren (keine strengen Param-Typen im Callback)
        type SnippetPick = Pick<SnippetRow, 'id' | 'content' | 'created_at'>
        const snippetRows = (snippets ?? []) as SnippetPick[]

        snippetRows.forEach((row) => {
          if (!row?.content) return
          items.push({
            kind: 'text',
            id: row.id,
            content: row.content,
            created_at: row.created_at ?? new Date().toISOString(),
          })
        })

        type MediaPick = Pick<MediaRow, 'id' | 'image_url' | 'description' | 'created_at'>
        const mediaRows = (media ?? []) as MediaPick[]

        mediaRows.forEach((m) => {
          if (!m?.image_url) return
          // description kann Json | string | null sein → nur string übernehmen
          const caption =
            typeof (m as any).description === 'string' ? ((m as any).description as string) : null

          items.push({
            kind: 'image',
            id: m.id,
            url: m.image_url as string,
            caption,
            created_at: m.created_at ?? new Date().toISOString(),
          })
        })

        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (!cancelled) setTimeline(items)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Daten konnten nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  // ───────────────────────── helpers ─────────────────────────

  const slugify = (str: string) =>
    (str || 'jetnity-story')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 64)

  const escapeMd = (s: string) =>
    s
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/\!/g, '\\!')

  const makeMarkdown = React.useCallback(() => {
    if (timeline.length === 0) return '# Jetnity Reise-Story\n'
    const pieces: string[] = []

    const cover = timeline.find((t) => t.kind === 'image') as Extract<TimelineItem, { kind: 'image' }> | undefined

    if (withFrontmatter) {
      pieces.push('---')
      pieces.push(`title: "${(title || 'Jetnity Reise-Story').replace(/"/g, '\\"')}"`)
      pieces.push(`date: "${new Date().toISOString()}"`)
      if (cover) pieces.push(`cover_image: "${cover.url}"`)
      pieces.push('---', '')
    } else {
      pieces.push(`# ${title || 'Jetnity Reise-Story'}`, '')
      pieces.push(`*Exportiert am ${dtf.format(new Date())}*`, '')
    }

    timeline.forEach((item) => {
      if (item.kind === 'image') {
        const alt = (withCaptions && item.caption ? item.caption : '')?.replace(/\n/g, ' ').trim() || ''
        pieces.push(`![${escapeMd(alt)}](${item.url})`)
        if (withCaptions && alt) pieces.push(`*${escapeMd(alt)}*`)
        pieces.push('')
      } else {
        const text = (item.content || '').trim()
        if (text) pieces.push(text, '')
      }
    })

    return pieces.join('\n').replace(/\n{3,}/g, '\n\n')
  }, [timeline, title, withFrontmatter, withCaptions, dtf])

  const filename = React.useMemo(() => `${slugify(title)}-${sessionId.slice(0, 8)}.md`, [title, sessionId])

  const downloadMarkdown = () => {
    try {
      const content = makeMarkdown()
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export fehlgeschlagen.')
    }
  }

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(makeMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success('Markdown kopiert.')
    } catch {
      toast.error('Markdown konnte nicht kopiert werden.')
    }
  }

  const previewMarkdown = () => {
    const md = makeMarkdown()
    const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${(title || 'Jetnity Reise-Story').replace(/</g, '&lt;')}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;background:#0b0c10;color:#e5e7eb}
  .wrap{max-width:960px;margin:0 auto;padding:2rem;}
  pre{white-space:pre-wrap; word-break:break-word; background:#111827; padding:1.25rem; border-radius:12px; overflow:auto}
  .meta{color:#9ca3af;margin:0 0 1rem 0}
</style></head>
<body><div class="wrap">
<h1>${(title || 'Jetnity Reise-Story').replace(/</g, '&lt;')}</h1>
<p class="meta">Markdown-Vorschau (Rohtext) – exportiert am ${dtf.format(new Date())}</p>
<pre>${md.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
</div></body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  // ───────────────────────── render ─────────────────────────

  const disabled = loading || !!error || timeline.length === 0

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Button onClick={downloadMarkdown} disabled={disabled} size="sm">
        <Download className="mr-2 h-4 w-4" />
        Als Markdown exportieren
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" aria-label="Export-Optionen">
            <Settings2 className="mr-2 h-4 w-4" />
            Optionen
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Export-Optionen</DropdownMenuLabel>
          <div className="px-2 py-1.5 text-sm flex items-center justify-between">
            <span>Frontmatter (YAML)</span>
            <Switch checked={withFrontmatter} onCheckedChange={setWithFrontmatter} />
          </div>
          <div className="px-2 py-1.5 text-sm flex items-center justify-between">
            <span>Bild-Captions einfügen</span>
            <Switch checked={withCaptions} onCheckedChange={setWithCaptions} />
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyMarkdown}>
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Markdown kopieren
          </DropdownMenuItem>
          <DropdownMenuItem onClick={previewMarkdown}>
            <Eye className="mr-2 h-4 w-4" />
            Vorschau öffnen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {loading ? (
        <span className="text-xs text-muted-foreground">Lade Inhalte …</span>
      ) : error ? (
        <span className="text-xs text-destructive">{error}</span>
      ) : timeline.length === 0 ? (
        <span className="text-xs text-muted-foreground">Keine Inhalte gefunden</span>
      ) : (
        <span className="text-xs text-muted-foreground">
          {timeline.filter((t) => t.kind === 'text').length} Abschnitte · {timeline.filter((t) => t.kind === 'image').length} Bilder
        </span>
      )}
    </div>
  )
}
