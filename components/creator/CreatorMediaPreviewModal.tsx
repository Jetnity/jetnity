'use client'

import * as React from 'react'
import NextImage from 'next/image' // <— alias, damit kein Konflikt mit window.Image
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TooltipTitle,
  TooltipDescription,
  TooltipShortcut,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  X,
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tag,
  MapPin,
  Gauge,
  Calendar,
  Film,
  ImageIcon,
} from 'lucide-react'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'> & {
  creator_profile?: Tables<'creator_profiles'> | null
}

type Props = {
  items: Upload[]
  index: number
  open: boolean
  onOpenChange: (v: boolean) => void
  onIndexChange?: (i: number) => void
}

const FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/Sk9i6cAAAAASUVORK5CYII='

function isVideo(url?: string | null, format?: string | null) {
  const f = (format ?? '').toLowerCase()
  if (f.includes('video')) return true
  const u = (url ?? '').toLowerCase()
  return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.ogv') || u.includes('/video/')
}
function mediaUrl(u: Upload) {
  return u.image_url || u.file_url || ''
}
function fileNameFromUrl(url: string) {
  try {
    const p = new URL(url)
    return decodeURIComponent(p.pathname.split('/').pop() || 'download')
  } catch {
    return 'download'
  }
}

export default function CreatorMediaPreviewModal({
  items,
  index,
  open,
  onOpenChange,
  onIndexChange,
}: Props) {
  const [i, setI] = React.useState(index)
  const [copied, setCopied] = React.useState(false)
  const touchStartX = React.useRef<number | null>(null)

  React.useEffect(() => setI(index), [index])

  // Keyboard-Navigation
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i, items.length])

  const clampIndex = (x: number) => (items.length ? Math.max(0, Math.min(items.length - 1, x)) : 0)
  const go = (delta: number) => {
    const next = clampIndex(i + delta)
    setI(next)
    onIndexChange?.(next)
    setCopied(false)
  }

  const u = items[i]
  const url = u ? mediaUrl(u) : ''
  const isVid = isVideo(url, u?.format ?? null)

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileNameFromUrl(url)
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  // Preload Nachbarbilder – ACHTUNG: window.Image, nicht NextImage
  React.useEffect(() => {
    const next = items[i + 1]
    const prev = items[i - 1]
    ;[next, prev].forEach((it) => {
      const m = it ? mediaUrl(it) : ''
      if (m && !isVideo(m, it?.format ?? null)) {
        const img = new window.Image() // <— fix: DOM Image-Konstruktor
        img.src = m
      }
    })
  }, [i, items])

  if (!u) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn('max-w-[min(1100px,96vw)] overflow-hidden p-0 sm:rounded-2xl')}
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') {
            touchStartX.current = e.clientX
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch' && touchStartX.current !== null) {
            const dx = e.clientX - touchStartX.current
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1)
            touchStartX.current = null
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="space-y-0 p-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="truncate">{u.title || 'Ohne Titel'}</DialogTitle>
              <DialogDescription className="truncate">
                {u.region && (
                  <span className="mr-2 inline-flex items-center gap-1 text-xs">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {u.region}
                  </span>
                )}
                {u.mood && (
                  <span className="mr-2 inline-flex items-center gap-1 text-xs">
                    <Gauge className="h-3 w-3" aria-hidden />
                    {u.mood}
                  </span>
                )}
                {u.created_at && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" aria-hidden />
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                )}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={copy} aria-label="Link kopieren">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent tone="inverted" withArrow>
                    <TooltipTitle>Link kopiert</TooltipTitle>
                    <TooltipDescription>Teile den direkten Medienlink.</TooltipDescription>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={download}
                      aria-label="Herunterladen"
                      disabled={!url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent tone="inverted" withArrow>
                    <TooltipTitle>Herunterladen</TooltipTitle>
                    <TooltipDescription>Datei lokal speichern.</TooltipDescription>
                  </TooltipContent>
                </Tooltip>

                {url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted'
                        )}
                        aria-label="In neuem Tab öffnen"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent tone="inverted" withArrow>
                      In neuem Tab öffnen <TooltipShortcut keys="⌘↵" />
                    </TooltipContent>
                  </Tooltip>
                )}

                <DialogClose asChild>
                  <Button size="icon" variant="ghost" aria-label="Schließen">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        <Separator className="opacity-60" />

        {/* Body */}
        <div className="grid gap-0 sm:grid-cols-[1fr_340px]">
          {/* Media */}
          <div className="relative bg-black/5 dark:bg-black/50">
            {/* Prev/Next (Desktop) */}
            <button
              className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/70 p-1 shadow-sm backdrop-blur hover:bg-background sm:inline-flex"
              onClick={() => go(-1)}
              aria-label="Vorheriges"
              disabled={i <= 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-background/70 p-1 shadow-sm backdrop-blur hover:bg-background sm:inline-flex"
              onClick={() => go(1)}
              aria-label="Nächstes"
              disabled={i >= items.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="relative aspect-[16/10]">
              {isVid ? (
                <video src={url} controls playsInline className="h-full w-full bg-black object-contain" />
              ) : (
                <NextImage
                  src={url || FALLBACK_IMG}
                  alt={u.title || 'Media'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
              )}

              {/* Media badge */}
              <div className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-1 text-[11px] font-medium shadow backdrop-blur">
                <span className="inline-flex items-center gap-1">
                  {isVid ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  {u.format ?? (isVid ? 'Video' : 'Bild')}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <aside className="max-h-[70vh] overflow-y-auto p-4 sm:max-h-[78vh]">
            {u.description && (
              <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">{u.description}</p>
            )}

            {u.tags && u.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {u.tags.slice(0, 15).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                  >
                    <Tag className="h-3 w-3" aria-hidden />
                    {t}
                  </span>
                ))}
              </div>
            )}

            {u.creator_profile ? (
              <div className="text-sm text-muted-foreground">
                Von{' '}
                <span className="text-foreground font-medium">
                  {u.creator_profile.name || '@' + (u.creator_profile.username || 'creator')}
                </span>
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground">Kein Profil verknüpft</div>
            )}

            <div className="mt-4 text-xs text-muted-foreground">
              ID: <span className="font-mono">{u.id}</span>
            </div>
          </aside>
        </div>

        <Separator className="opacity-60" />

        {/* Footer */}
        <DialogFooter className="flex w-full items-center justify-between px-4 py-2 text-xs text-muted-foreground sm:px-4">
          <span>
            {i + 1} / {items.length}
          </span>
          <div className="hidden gap-4 sm:flex">
            <span>← / → zum Navigieren</span>
            <span>Esc schließen</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
