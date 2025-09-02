// components/creator/media-studio/StoryPdfExportButton.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, FileDown, Settings2 } from 'lucide-react'
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

type SnippetRow = Tables<'session_snippets'>
type MediaRow = Tables<'session_media'>
type SessionRow = Tables<'creator_sessions'>

interface StoryPdfExportButtonProps {
  sessionId: string
  className?: string
}

type TimelineItem =
  | { kind: 'text'; id: string; created_at: string; content: string }
  | { kind: 'image'; id: string; created_at: string; url: string; caption?: string | null }

export default function StoryPdfExportButton({ sessionId, className }: StoryPdfExportButtonProps) {
  const [title, setTitle] = React.useState('Jetnity Reise-Story')
  const [timeline, setTimeline] = React.useState<TimelineItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)

  // Optionen
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait')
  const [format, setFormat] = React.useState<'a4' | 'letter'>('a4')
  const [margin, setMargin] = React.useState<number>(12) // in mm
  const [withPageNumbers, setWithPageNumbers] = React.useState(true)

  const containerRef = React.useRef<HTMLDivElement>(null)

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

  // Inhalte laden (Titel, Snippets, Media)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
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
            .select('id, image_url, description, created_at')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true }),
        ])

        if (s?.title) setTitle(s.title)

        const items: TimelineItem[] = []
        type SnippetPick = Pick<SnippetRow, 'id' | 'content' | 'created_at'>
        ;((snippets ?? []) as SnippetPick[]).forEach((row) => {
          if (!row?.content) return
          items.push({
            kind: 'text',
            id: row.id,
            content: row.content,
            created_at: row.created_at ?? new Date().toISOString(),
          })
        })

        type MediaPick = Pick<MediaRow, 'id' | 'image_url' | 'description' | 'created_at'>
        ;((media ?? []) as MediaPick[]).forEach((m) => {
          if (!m?.image_url) return
          const caption = typeof (m as any).description === 'string' ? (m as any).description : null
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
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  // Hilfen
  const slugify = (str: string) =>
    (str || 'jetnity-story')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 64)

  const filename = React.useMemo(
    () => `${slugify(title)}-${sessionId.slice(0, 8)}.pdf`,
    [title, sessionId]
  )

  // Warten bis alle Bilder geladen sind (für html2canvas)
  const waitForImages = async (root: HTMLElement) => {
    const imgs = Array.from(root.querySelectorAll('img'))
    const promises = imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if ((img as HTMLImageElement).complete) return resolve()
          ;(img as HTMLImageElement).onload = () => resolve()
          ;(img as HTMLImageElement).onerror = () => resolve()
        })
    )
    await Promise.all(promises)
  }

  const handleExportPdf = async () => {
    if (!containerRef.current) return
    setGenerating(true)
    try {
      const el = containerRef.current

      // dynamischer Import – nur im Client
      const mod: any = (await import('html2pdf.js')).default || (await import('html2pdf.js'))

      // vor dem Render warten, bis Bilder geladen
      await waitForImages(el)

      // Rendern
      const worker = mod()
        .from(el)
        .set({
          margin,
          filename,
          pagebreak: { mode: ['css', 'legacy'] },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
          },
          jsPDF: { unit: 'mm', format, orientation },
        })
        .toPdf()

      const pdf = await worker.get('pdf')

      if (withPageNumbers) {
        const total = pdf.internal.getNumberOfPages()
        const { width, height } = pdf.internal.pageSize
        pdf.setFontSize(9)
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i)
          pdf.text(`Seite ${i} / ${total}`, width - 20, height - 8)
        }
      }

      pdf.save(filename)
    } finally {
      setGenerating(false)
    }
  }

  const disabled = loading || timeline.length === 0 || generating

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleExportPdf} disabled={disabled} size="sm">
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              PDF wird erstellt …
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Als PDF exportieren
            </>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">
              <Settings2 className="mr-2 h-4 w-4" />
              Optionen
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Seite</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFormat('a4')} inset>
              {format === 'a4' ? '• ' : ''}A4
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFormat('letter')} inset>
              {format === 'letter' ? '• ' : ''}Letter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ausrichtung</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setOrientation('portrait')} inset>
              {orientation === 'portrait' ? '• ' : ''}Hochformat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOrientation('landscape')} inset>
              {orientation === 'landscape' ? '• ' : ''}Querformat
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Ränder</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setMargin(8)} inset>
              {margin === 8 ? '• ' : ''}Schmal (8 mm)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMargin(12)} inset>
              {margin === 12 ? '• ' : ''}Mittel (12 mm)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMargin(16)} inset>
              {margin === 16 ? '• ' : ''}Breit (16 mm)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setWithPageNumbers((v) => !v)} inset>
              {withPageNumbers ? '• ' : ''}Seitennummern
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Off-screen Rendercontainer – NICHT display:none! */}
      <div
        ref={containerRef}
        // außerhalb des Viewports statt hidden, sonst rendert html2canvas leer
        style={{
          position: 'fixed',
          left: -10000,
          top: 0,
          width: '900px', // großzügig; wird von jsPDF/format skaliert
          pointerEvents: 'none',
          opacity: 1,
          background: '#ffffff',
          zIndex: -1,
        }}
      >
        <div
          style={{
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial, sans-serif',
            color: '#111827',
            lineHeight: 1.55,
            padding: '24px',
          }}
        >
          <style>{`
            .pdf-meta{ color:#6b7280; font-size:12px; margin-bottom:6px; }
            .pdf-title{ font-size:28px; font-weight:700; margin:0 0 6px 0; }
            figure{ margin:16px 0; page-break-inside: avoid; }
            img{ max-width:100%; display:block; border-radius:12px; }
            figcaption{ color:#6b7280; font-size:12px; margin-top:6px; }
            p{ margin:0 0 12px 0; page-break-inside: auto; }
            .page-break{ break-after: page; }
          `}</style>

          <div className="pdf-header">
            <div className="pdf-meta">Exportiert am {dtf.format(new Date())}</div>
            <h1 className="pdf-title">{title}</h1>
          </div>

          {timeline.map((item) =>
            item.kind === 'image' ? (
              <figure key={`img-${item.id}`}>
                <img
                  src={item.url}
                  crossOrigin="anonymous"
                  alt={(item.caption || '').replace(/\n/g, ' ').trim()}
                />
                {item.caption ? <figcaption>{item.caption}</figcaption> : null}
              </figure>
            ) : (
              <p key={`txt-${item.id}`}>{item.content}</p>
            )
          )}
        </div>
      </div>
    </div>
  )
}
