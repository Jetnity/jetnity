'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Minimize2, Play, Pause, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

type Upload = Tables<'creator_uploads'> & {
  creator_profile?: Tables<'creator_profiles'> | null
}

type Props = {
  items: Upload[]
  startIndex: number
  onClose: () => void
}

const FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/Sk9i6cAAAAASUVORK5CYII='

function parseStoragePath(urlOrPath?: string | null): { bucket: string; path: string } | null {
  if (!urlOrPath) return null
  try {
    const u = new URL(urlOrPath)
    const parts = u.pathname.split('/').filter(Boolean)
    const pubIdx = parts.findIndex(p => p === 'public')
    if (pubIdx >= 0 && parts.length > pubIdx + 2) {
      const bucket = parts[pubIdx + 1]
      const path = parts.slice(pubIdx + 2).join('/')
      return { bucket, path }
    }
    return null
  } catch {
    const slash = urlOrPath.indexOf('/')
    if (slash > 0) return { bucket: urlOrPath.slice(0, slash), path: urlOrPath.slice(slash + 1) }
    return null
  }
}
function deriveThumbCandidates(raw?: string | null) {
  const parsed = parseStoragePath(raw)
  if (!parsed) return [] as Array<{ bucket: string; path: string }>
  const { bucket, path } = parsed
  return [
    { bucket: 'media-thumbs', path },
    { bucket: 'media-proxy', path },
    { bucket, path },
  ]
}
async function getFirstSignedUrl(cands: Array<{ bucket: string; path: string }>): Promise<string | null> {
  for (const c of cands) {
    const { data, error } = await supabase.storage.from(c.bucket).createSignedUrl(c.path, 60 * 60)
    if (!error && data?.signedUrl) return data.signedUrl
  }
  return null
}

function isVideoPath(format?: string | null, raw?: string | null) {
  const f = (format || '').toLowerCase()
  if (f.includes('video')) return true
  return /\.((mp4|webm|mov|m4v|m3u8))($|\?)/i.test(raw || '')
}
function isHlsPath(raw?: string | null) {
  return /\.m3u8($|\?)/i.test(raw || '')
}

type ResolvedMedia = {
  mainSrc: string
  thumbSrc: string
  isVideo: boolean
  isHls: boolean
}

async function resolveMedia(u: Upload): Promise<ResolvedMedia> {
  const raw = u.image_url || u.file_url || FALLBACK_IMG
  // http(s)/data: direkt
  if (/^(https?:|data:)/i.test(raw)) {
    const main = raw
    const thumb = raw
    return { mainSrc: main, thumbSrc: thumb, isVideo: isVideoPath(u.format, raw), isHls: isHlsPath(raw) }
  }
  // Supabase Storage
  const thumbSigned = await getFirstSignedUrl(deriveThumbCandidates(raw))
  const parsed = parseStoragePath(raw)
  let mainSigned: string | null = null
  if (parsed) {
    const { data } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 60 * 60)
    mainSigned = data?.signedUrl ?? null
  }
  const main = mainSigned || FALLBACK_IMG
  const thumb = thumbSigned || FALLBACK_IMG
  return { mainSrc: main, thumbSrc: thumb, isVideo: isVideoPath(u.format, raw), isHls: isHlsPath(raw) }
}

export default function GalleryLightbox({ items, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const total = items.length

  // Cache für bereits aufgelöste Medien
  const cacheRef = useRef<Map<number, ResolvedMedia>>(new Map())
  const [current, setCurrent] = useState<ResolvedMedia | null>(null)
  const [playing, setPlaying] = useState(false)

  // Zoom/Pan nur für Bilder
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const dragging = useRef(false)
  const last = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<any>(null)

  const item = items[index]

  const loadAt = useCallback(async (i: number) => {
    if (i < 0 || i >= total) return
    if (cacheRef.current.has(i)) return
    try {
      const m = await resolveMedia(items[i])
      cacheRef.current.set(i, m)
    } catch {
      cacheRef.current.set(i, { mainSrc: FALLBACK_IMG, thumbSrc: FALLBACK_IMG, isVideo: false, isHls: false })
    }
  }, [items, total])

  // Aktuellen + Nachbarn vorladen
  useEffect(() => {
    ;(async () => {
      await loadAt(index)
      await Promise.all([loadAt(index - 1), loadAt(index + 1)])
      setCurrent(cacheRef.current.get(index) || null)
      // Bild-Preload
      const prev = cacheRef.current.get(index + 1)
      if (prev && !prev.isVideo) {
        const img = new Image()
        img.src = prev.mainSrc
      }
      const next = cacheRef.current.get(index - 1)
      if (next && !next.isVideo) {
        const img = new Image()
        img.src = next.mainSrc
      }
      // Reset Zoom/Pan beim Bildwechsel
      setScale(1); setTx(0); setTy(0)
      setPlaying(false)
    })()
  }, [index, loadAt])

  // HLS initialisieren, wenn nötig
  useEffect(() => {
    if (!current?.isVideo) return
    if (!current.isHls) {
      // Nicht-HLS: native Quelle setzen
      if (videoRef.current) videoRef.current.src = current.mainSrc
      return
    }
    const v = videoRef.current
    if (!v) return
    if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = current.mainSrc
      return
    }
    ;(async () => {
      try {
        const Hls = (await import('hls.js')).default
        if (Hls.isSupported()) {
          const hls = new Hls()
          hlsRef.current = hls
          hls.loadSource(current.mainSrc)
          hls.attachMedia(v)
        } else {
          v.src = current.mainSrc
        }
      } catch {
        v.src = current.mainSrc
      }
    })()
    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy() } catch {}
        hlsRef.current = null
      }
    }
  }, [current])

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total])

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowLeft') goPrev()
    else if (e.key === 'ArrowRight') goNext()
  }, [goPrev, goNext, onClose])

  useEffect(() => { window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onKey])

  // Zoom/Pan Handlers
  const resetZoom = useCallback(() => { setScale(1); setTx(0); setTy(0) }, [])
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY
    setScale(s => Math.min(4, Math.max(1, s + (delta > 0 ? 0.15 : -0.15))))
  }, [])
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale === 1) return
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }, [scale])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setTx(v => v + dx); setTy(v => v + dy)
  }, [])
  const onMouseUpLeave = useCallback(() => { dragging.current = false }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      const url = current?.mainSrc || ''
      await navigator.clipboard.writeText(url)
      toast.success('Link kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }, [current?.mainSrc])

  if (!current) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* Navigation clickable areas */}
      <button
        aria-label="Vorheriges Element"
        onClick={(e) => { e.stopPropagation(); goPrev() }}
        disabled={index === 0}
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 rounded-full border bg-white/10 p-2 text-white hover:bg-white/20',
          index === 0 && 'opacity-40 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        aria-label="Nächstes Element"
        onClick={(e) => { e.stopPropagation(); goNext() }}
        disabled={index >= total - 1}
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 rounded-full border bg-white/10 p-2 text-white hover:bg-white/20',
          index >= total - 1 && 'opacity-40 cursor-not-allowed'
        )}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        className="relative max-h-[90vh] max-w-[94vw] overflow-hidden rounded-2xl bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute left-3 top-3 z-20 flex items-center gap-2 text-white">
          <span className="text-xs opacity-80">{index + 1} / {total}</span>
        </div>
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          {!current.isVideo && (
            <>
              <button
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                onClick={() => setScale(s => Math.min(4, s + 0.2))}
                aria-label="Zoom In"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                onClick={() => setScale(s => Math.max(1, s - 0.2))}
                aria-label="Zoom Out"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
                onClick={resetZoom}
                aria-label="Zoom zurücksetzen"
                title="Zoom zurücksetzen"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
            onClick={handleCopyLink}
            aria-label="Link kopieren"
            title="Link kopieren"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          {current.isVideo && (
            <button
              className="rounded-lg px-2.5 py-1.5 text-white hover:bg-white/20"
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                if (v.paused) { v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
              }}
              aria-label={playing ? 'Pause' : 'Abspielen'}
              title={playing ? 'Pause' : 'Abspielen'}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          <button
            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="Schließen"
            title="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Media */}
        <div className="relative max-h-[90vh] max-w-[94vw]">
          {current.isVideo ? (
            <video
              ref={videoRef}
              className="max-h-[90vh] max-w-[94vw]"
              poster={current.thumbSrc || FALLBACK_IMG}
              controls
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          ) : (
            <div
              className="relative"
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUpLeave}
              onMouseLeave={onMouseUpLeave}
            >
              <img
                src={current.mainSrc || FALLBACK_IMG}
                alt={items[index].title || 'Media'}
                className="select-none"
                draggable={false}
                style={{
                  maxHeight: '90vh',
                  maxWidth: '94vw',
                  transform: `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`,
                  transformOrigin: 'center center',
                  cursor: scale > 1 ? 'grab' : 'default',
                }}
                onDoubleClick={resetZoom}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
