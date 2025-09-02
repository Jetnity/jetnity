// components/creator/media-studio/StoryLinkCopyButton.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Link as LinkIcon, ExternalLink, Copy, Check, Share2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'

type SessionRow = Tables<'creator_sessions'>

interface Props {
  sessionId: string
  className?: string
}

export default function StoryLinkCopyButton({ sessionId, className }: Props) {
  const [copied, setCopied] = React.useState<'url' | 'md' | 'html' | null>(null)
  const [origin, setOrigin] = React.useState<string>('')
  const [isPublic, setIsPublic] = React.useState<boolean | null>(null)
  const [loadingMeta, setLoadingMeta] = React.useState<boolean>(true)

  // Robust: Origin ermitteln (Client) + Fallback auf NEXT_PUBLIC_SITE_URL
  React.useEffect(() => {
    const env = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
    const current =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : ''
    setOrigin(current || env)
  }, [])

  // Sichtbarkeit (optional) laden – nur für Hinweisanzeige
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingMeta(true)
      try {
        const { data } = await supabase
          .from('creator_sessions')
          .select('visibility, status')
          .eq('id', sessionId)
          .maybeSingle()

        // Heuristik: öffentlich, wenn visibility === 'public' ODER status === 'published'
        const publicFlag =
          ((data as Partial<SessionRow>)?.visibility as any) === 'public' ||
          (data as any)?.status === 'published'
        if (!cancelled) setIsPublic(!!publicFlag)
      } catch {
        if (!cancelled) setIsPublic(null)
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  const storyUrl = React.useMemo(() => {
    const base = origin || ''
    // Wenn base leer ist (sehr früher Render), zeigen wir relativen Pfad an;
    // Copy/Share/Open verwenden dann trotzdem den zusammengesetzten Wert zur Laufzeit.
    const path = `/story/${encodeURIComponent(sessionId)}`
    return base ? `${base}${path}` : path
  }, [origin, sessionId])

  const withCopied = (what: 'url' | 'md' | 'html') => {
    setCopied(what)
    setTimeout(() => setCopied(null), 1600)
  }

  const copyText = async (text: string, label: 'Link' | 'Markdown' | 'HTML', key: 'url' | 'md' | 'html') => {
    try {
      await navigator.clipboard.writeText(text)
      withCopied(key)
      toast.success(`${label} kopiert.`)
    } catch {
      toast.error(`${label} konnte nicht kopiert werden.`)
    }
  }

  const handleCopyUrl = async () => {
    // zur Sicherheit zur Laufzeit noch einmal origin prüfen
    const finalUrl =
      (typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : origin || '') + `/story/${encodeURIComponent(sessionId)}`
    await copyText(finalUrl, 'Link', 'url')
  }

  const handleCopyMarkdown = () => {
    const md = `[Jetnity-Story](${storyUrl})`
    return copyText(md, 'Markdown', 'md')
  }

  const handleCopyHtml = () => {
    const html = `<a href="${storyUrl}">Jetnity-Story</a>`
    return copyText(html, 'HTML', 'html')
  }

  const handleOpen = () => {
    const finalUrl =
      (typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : origin || '') + `/story/${encodeURIComponent(sessionId)}`
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  const canShare = typeof navigator !== 'undefined' && !!(navigator as any).share
  const handleShare = async () => {
    try {
      if (!(navigator as any).share) {
        toast.message('Teilen wird von diesem Gerät/Browser nicht unterstützt.')
        return
      }
      await (navigator as any).share({
        title: 'Jetnity-Story',
        text: 'Schau dir meine Jetnity-Story an:',
        url: storyUrl,
      })
    } catch {
      // Abbruch durch User ist ok; kein Toast notwendig
    }
  }

  return (
    <div className={cn('space-y-3 rounded-2xl border bg-card p-4', className)}>
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4" aria-hidden="true" />
        <h4 className="text-sm font-semibold">Story-Link</h4>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={storyUrl}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Öffentlicher Story-Link"
          className="w-full"
        />
        <div className="flex gap-2">
          <Button onClick={handleCopyUrl} aria-label="Story-Link kopieren" size="sm">
            {copied === 'url' ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            Kopieren
          </Button>
          <Button onClick={handleOpen} variant="secondary" aria-label="Story im neuen Tab öffnen" size="sm">
            <ExternalLink className="mr-1 h-4 w-4" />
            Öffnen
          </Button>
          {canShare && (
            <Button onClick={handleShare} variant="outline" aria-label="Teilen" size="sm">
              <Share2 className="mr-1 h-4 w-4" />
              Teilen
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCopyMarkdown} variant="ghost" size="sm" aria-label="Markdown kopieren">
          {copied === 'md' ? <Check className="mr-1 h-4 w-4" /> : <FileText className="mr-1 h-4 w-4" />}
          Markdown
        </Button>
        <Button onClick={handleCopyHtml} variant="ghost" size="sm" aria-label="HTML kopieren">
          {copied === 'html' ? <Check className="mr-1 h-4 w-4" /> : <FileText className="mr-1 h-4 w-4" />}
          HTML
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {loadingMeta
          ? 'Sichtbarkeit wird geprüft …'
          : isPublic === true
          ? 'Diese Story ist öffentlich abrufbar.'
          : isPublic === false
          ? 'Hinweis: Diese Story ist aktuell privat. Der Link kann zu einer 404-Seite führen, bis die Story veröffentlicht ist.'
          : 'Sichtbarkeit konnte nicht ermittelt werden.'}
      </p>
    </div>
  )
}
