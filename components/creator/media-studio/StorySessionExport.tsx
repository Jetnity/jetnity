// components/creator/media-studio/StorySessionExport.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Download, Copy, Eye, Settings2, Check } from 'lucide-react'
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

type SnippetPick = Pick<SnippetRow, 'id' | 'content' | 'created_at'>
type MediaPick = Pick<MediaRow, 'id' | 'image_url' | 'description' | 'created_at'>

type StoryMode = 'latest' | 'all'

export default function StorySessionExport({ sessionId, className }: Props) {
  const [title, setTitle] = React.useState<string>('Jetnity Reise-Story')
  const [snippets, setSnippets] = React.useState<SnippetPick[]>([])
  const [media, setMedia] = React.useState<MediaPick[]>([])
  const [markdown, setMarkdown] = React.useState<string>('')
  const [loading, setLoading] = React.useState<boolean>(true)
  const [copied, setCopied] = React.useState(false)

  // Optionen
  const [mode, setMode] = React.useState<StoryMode>('latest')
  const [withFrontmatter, setWithFrontmatter] = React.useState(true)
  const [withCaptions, setWithCaptions] = React.useState(true)

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

  // Laden
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [{ data: s }, { data: sn }, { data: me }] = await Promise.all([
          supabase.from('creator_sessions').select('title').eq('id', sessionId).maybeSingle(),
          supabase
            .from('session_snippets')
            .select('id, content, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
          supabase
            .from('session_media')
            .select('id, image_url, description, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
        ])

        if (!cancelled) {
          if (s?.title) setTitle(s.title)
          setSnippets(((sn ?? []) as SnippetPick[]).filter((r) => !!r.content))
          setMedia((me ?? []) as MediaPick[])
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) toast.error('Daten konnten nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  // Markdown erzeugen
  const escapeMd = (s: string) =>
    (s || '')
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
    const lines: string[] = []
    const cover = media.find((m) => !!m.image_url)?.image_url

    if (withFrontmatter) {
      lines.push('---')
      lines.push(`title: "${(title || 'Jetnity Reise-Story').replace(/"/g, '\\"')}"`)
      lines.push(`date: "${new Date().toISOString()}"`)
      if (cover) lines.push(`cover_image: "${cover}"`)
      lines.push('---', '')
    } else {
      lines.push(`# ${title || 'Jetnity Reise-Story'}`, '')
      lines.push(`*Exportiert am ${dtf.format(new Date())}*`, '')
    }

    // Story
    if (mode === 'latest') {
      const latest = [...snippets].reverse().find((s) => !!s.content)
      if (latest?.content) {
        lines.push('## 📝 Story', '')
        lines.push(latest.content.trim(), '')
      }
    } else {
      if (snippets.length) {
        lines.push('## 📝 Story', '')
        snippets.forEach((s) => {
          lines.push(s.content.trim(), '')
        })
      }
    }

    // Mediengalerie
    if (media.length) {
      lines.push('---', '', '## 📸 Mediengalerie', '')
      media.forEach((m) => {
        if (!m.image_url) return
        lines.push(`![Bild](${m.image_url})`)
        if (withCaptions && typeof (m as any).description === 'string' && (m as any).description.trim()) {
          lines.push(`> ${escapeMd((m as any).description.trim())}`)
        }
        lines.push('')
      })
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n')
  }, [title, dtf, mode, withFrontmatter, withCaptions, snippets, media])

  // Rebuild bei Änderungen
  React.useEffect(() => {
    setMarkdown(makeMarkdown())
  }, [makeMarkdown])

  // Actions
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success('Markdown kopiert.')
    } catch {
      toast.error('Kopieren fehlgeschlagen.')
    }
  }

  const download = () => {
    try {
      const slug = (title || 'jetnity-story')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 64)
      const name = `${slug}-${sessionId.slice(0, 8)}.md`
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download fehlgeschlagen.')
    }
  }

  const preview = () => {
    const html = `<!doctype html>
<html lang="de">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${(title || 'Jetnity Reise-Story').replace(/</g, '&lt;')}</title>
<style>
 body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Inter,Arial,sans-serif;margin:0;background:#0b0c10;color:#e5e7eb}
 .wrap{max-width:960px;margin:0 auto;padding:2rem}
 pre{white-space:pre-wrap;word-break:break-word;background:#111827;padding:1.25rem;border-radius:12px}
 .meta{color:#9ca3af;margin:0 0 1rem}
</style></head>
<body>
 <div class="wrap">
  <h1>${(title || 'Jetnity Reise-Story').replace(/</g, '&lt;')}</h1>
  <p class="meta">Markdown-Vorschau (Rohtext) — exportiert am ${dtf.format(new Date())}</p>
  <pre>${markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
 </div>
</body>
</html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const disabled = loading || (!snippets.length && !media.length)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">📤 Session Markdown Export</h3>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" aria-label="Export-Optionen">
                <Settings2 className="mr-2 h-4 w-4" />
                Optionen
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Story-Inhalt</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setMode('latest')} inset>
                {mode === 'latest' ? '• ' : ''}Nur neuester Snippet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('all')} inset>
                {mode === 'all' ? '• ' : ''}Alle Snippets zusammen
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Optionen</DropdownMenuLabel>
              <div className="px-2 py-1.5 text-sm flex items-center justify-between">
                <span>Frontmatter (YAML)</span>
                <Switch checked={withFrontmatter} onCheckedChange={setWithFrontmatter} />
              </div>
              <div className="px-2 py-1.5 text-sm flex items-center justify-between">
                <span>Bild-Captions einfügen</span>
                <Switch checked={withCaptions} onCheckedChange={setWithCaptions} />
              </div>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={copy} inset>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Markdown kopieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={preview} inset>
                <Eye className="mr-2 h-4 w-4" />
                Vorschau öffnen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={copy} disabled={disabled} size="sm">
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            Kopieren
          </Button>
          <Button onClick={download} disabled={disabled} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download .md
          </Button>
        </div>
      </div>

      <Textarea value={markdown} readOnly rows={20} className="resize-none" />

      <p className="text-xs text-muted-foreground">
        {loading
          ? 'Lade Inhalte …'
          : `${snippets.length} Snippets · ${media.length} Medien`}
      </p>
    </div>
  )
}
