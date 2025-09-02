// components/creator/media-studio/MediaUploadForm.tsx
'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateImageMetadata } from '@/lib/openai/generateImageMetadata'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface MediaUploadFormProps {
  sessionId: string
  userId: string
}

type ItemStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'error' | 'canceled'
type ItemKind = 'image' | 'video'

type QueueItem = {
  id: string
  file: File
  name: string
  size: number
  kind: ItemKind
  status: ItemStatus
  progress: number
  error?: string
  previewUrl?: string
  resultUrl?: string
  thumbUrl?: string
  meta?: {
    mime?: string
    width?: number
    height?: number
    durationSec?: number
    frameRate?: number
    exif?: { gps?: { lat?: number; lon?: number } }
  }
}

const BUCKET_ORIGINAL = 'media-original'
const BUCKET_THUMBS = 'media-thumbs'
const BUCKET_FALLBACK = 'media'
const CONCURRENCY = 3
const MAX_RETRIES = 3

export default function MediaUploadForm({ sessionId, userId }: MediaUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<QueueItem[]>([])
  const [busy, setBusy] = useState(false)

  // ---------- utils
  const isImage = (f: File) => f.type.startsWith('image/')
  const isVideo = (f: File) => f.type.startsWith('video/')
  const toKind = (f: File): ItemKind => (isVideo(f) ? 'video' : 'image')

  const fmtSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1_048_576 ? `${(b / 1024).toFixed(1)} KB` :
    b < 1_073_741_824 ? `${(b / 1_048_576).toFixed(1)} MB` : `${(b / 1_073_741_824).toFixed(1)} GB`

  async function sha256(file: File) {
    const buf = await file.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  function extFromFile(file: File) {
    const n = file.name
    const dot = n.lastIndexOf('.')
    return dot >= 0 ? n.slice(dot + 1).toLowerCase() : (isImage(file) ? 'png' : 'mp4')
  }

  function drawContain(el: HTMLImageElement | HTMLVideoElement, maxW: number, maxH: number) {
    const ratio = (el as any).videoWidth
      ? (el as HTMLVideoElement).videoWidth / (el as HTMLVideoElement).videoHeight
      : (el as HTMLImageElement).naturalWidth / (el as HTMLImageElement).naturalHeight
    let w = maxW, h = Math.round(w / ratio)
    if (h > maxH) { h = maxH; w = Math.round(h * ratio) }
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(el as any, 0, 0, w, h)
    return { canvas, ctx }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  function grabVideo(atUrl: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.muted = true
      v.playsInline = true
      v.onloadedmetadata = () => resolve(v)
      v.onerror = reject
      v.src = atUrl
    })
  }

  async function probeImageMeta(file: File) {
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      const meta: QueueItem['meta'] = {
        mime: file.type,
        width: (img as any).naturalWidth,
        height: (img as any).naturalHeight,
      }
      try {
        // optional: exifr
        // @ts-ignore
        const exifr = await import('exifr').catch(() => null)
        if (exifr?.gps) {
          const gps = await exifr.gps(file).catch(() => null)
          if (gps && (gps.latitude || gps.longitude)) {
            meta.exif = { gps: { lat: gps.latitude, lon: gps.longitude } }
          }
        }
      } catch {}
      return meta
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function probeVideoMeta(file: File) {
    const url = URL.createObjectURL(file)
    try {
      const v = await grabVideo(url)
      const durationSec = Number.isFinite(v.duration) ? v.duration : undefined
      const meta: QueueItem['meta'] = {
        mime: file.type,
        width: (v as any).videoWidth,
        height: (v as any).videoHeight,
        durationSec,
      }
      return meta
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function createImageThumb(file: File, maxSize = 640): Promise<Blob> {
    const url = URL.createObjectURL(file)
    try {
      const img = await loadImage(url)
      const { canvas } = drawContain(img, maxSize, maxSize)
      return await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85)
      )
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function createVideoThumb(file: File, maxSize = 640, atSeconds = 1): Promise<Blob> {
    const url = URL.createObjectURL(file)
    try {
      const v = await grabVideo(url)
      v.currentTime = Math.min(Math.max(atSeconds, 0.01), (v.duration || 1) - 0.01)
      await new Promise((r) => setTimeout(r, 200))
      const { canvas } = drawContain(v, maxSize, maxSize)
      return await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85)
      )
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  async function uploadToPreferredBucket(
    bucketName: string,
    path: string,
    data: Blob | File,
    contentType?: string,
    attempt = 0
  ): Promise<{ bucket: string; path: string }> {
    const { error } = await supabase.storage.from(bucketName).upload(path, data, {
      cacheControl: '31536000',
      upsert: false,
      contentType,
    })
    if (!error) return { bucket: bucketName, path }

    const msg = (error as any)?.message?.toLowerCase?.() ?? ''
    if (msg.includes('not found') || msg.includes('does not exist') || msg.includes('bucket')) {
      const fallbackPath = path.includes('/') ? path.split('/').slice(1).join('/') : path
      const up2 = await supabase.storage
        .from(BUCKET_FALLBACK)
        .upload(`media/${sessionId}/${fallbackPath}`, data, {
          cacheControl: '31536000',
          upsert: false,
          contentType,
        })
      if (!up2.error) return { bucket: BUCKET_FALLBACK, path: `media/${sessionId}/${fallbackPath}` }
      if (up2.error.message?.toLowerCase().includes('exists')) {
        return { bucket: BUCKET_FALLBACK, path: `media/${sessionId}/${fallbackPath}` }
      }
      throw up2.error
    }

    if (msg.includes('exists')) return { bucket: bucketName, path }

    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)))
      return uploadToPreferredBucket(bucketName, path, data, contentType, attempt + 1)
    }

    throw error
  }

  async function signUrl(bucket: string, path: string, seconds = 60 * 60 * 6) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, seconds)
    if (error) {
      const pub = supabase.storage.from(bucket).getPublicUrl(path)
      return pub.data.publicUrl
    }
    return data.signedUrl
  }

  // ---------- queue handling
  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const next: QueueItem[] = []
    Array.from(files).forEach((file) => {
      if (!isImage(file) && !isVideo(file)) return
      next.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        kind: toKind(file),
        status: 'queued',
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      })
    })
    setItems((prev) => [...next, ...prev])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id)
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl)
      return prev.filter((x) => x.id !== id)
    })
  }, [])

  const clearDone = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => {
        if ((it.status === 'done' || it.status === 'error' || it.status === 'canceled') && it.previewUrl) {
          URL.revokeObjectURL(it.previewUrl)
        }
      })
      return prev.filter((it) => ['uploading','processing','queued'].includes(it.status))
    })
  }, [])

  const startUploads = useCallback(async () => {
    if (busy) return
    setBusy(true)
    try {
      const queueIds = items.filter(i => i.status === 'queued').map(i => i.id)
      let index = 0
      async function worker() {
        while (index < queueIds.length) {
          const id = queueIds[index++]
          // eslint-disable-next-line no-await-in-loop
          await uploadOneById(id)
        }
      }
      const workers = Array.from({ length: Math.min(CONCURRENCY, queueIds.length) }, () => worker())
      await Promise.all(workers)
    } finally {
      setBusy(false)
    }
  }, [busy, items])

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  async function uploadOneById(id: string) {
    const it = items.find((x) => x.id === id)
    if (!it || it.status !== 'queued') return

    updateItem(it.id, { status: 'uploading', progress: 4 })

    const file = it.file
    const ext = extFromFile(file)
    const hash = await sha256(file).catch(() => crypto.randomUUID().replace(/-/g, ''))
    const originalPath = `${userId}/${sessionId}/${hash}.${ext}`
    const thumbPath = `${userId}/${sessionId}/thumbs/${hash}.jpg`

    // lokale Metadaten
    let meta: QueueItem['meta'] | undefined
    try { meta = it.kind === 'image' ? await probeImageMeta(file) : await probeVideoMeta(file) } catch {}
    updateItem(it.id, { meta })

    // Thumbnail
    updateItem(it.id, { progress: 18 })
    let thumbBlob: Blob | undefined
    try {
      thumbBlob = it.kind === 'image'
        ? await createImageThumb(file, 640)
        : await createVideoThumb(file, 640, 1)
    } catch {}

    // Upload Original
    let upOriginal!: { bucket: string; path: string }
    try {
      upOriginal = await uploadToPreferredBucket(BUCKET_ORIGINAL, originalPath, file, file.type)
      updateItem(it.id, { progress: 45 })
    } catch (e: any) {
      updateItem(it.id, { status: 'error', error: e?.message ?? 'Upload fehlgeschlagen (Original)', progress: 0 })
      return
    }

    // Upload Thumb
    let upThumb: { bucket: string; path: string } | undefined
    if (thumbBlob) {
      try {
        upThumb = await uploadToPreferredBucket(BUCKET_THUMBS, thumbPath, thumbBlob, 'image/jpeg')
        updateItem(it.id, { progress: 62 })
      } catch {}
    }

    // URLs
    const signedOriginal = await signUrl(upOriginal.bucket, upOriginal.path)
    const signedThumb = upThumb ? await signUrl(upThumb.bucket, upThumb.path) : undefined
    updateItem(it.id, { progress: 74, resultUrl: signedOriginal, thumbUrl: signedThumb })

    // Insert minimal
    const insertPayload: any = {
      session_id: sessionId,
      user_id: userId,
      image_url: signedOriginal,
      thumbnail_url: signedThumb ?? null,
      is_ai_generated: false,
    }
    const { data: row, error: insErr } = await supabase.from('session_media').insert(insertPayload).select().single()
    if (insErr || !row) {
      updateItem(it.id, { status: 'error', error: insErr?.message ?? 'DB insert fehlgeschlagen', progress: 0 })
      return
    }

    updateItem(it.id, { status: 'processing', progress: 82 })

    // optionale Metadaten & Pfade
    const optionalUpdates: Record<string, any> = {
      mime_type: file.type,
      storage_bucket: upOriginal.bucket,
      storage_path: upOriginal.path,
    }
    if (upThumb) {
      optionalUpdates.thumb_bucket = upThumb.bucket
      optionalUpdates.thumb_path = upThumb.path
    }
    if (meta?.width) optionalUpdates.width = meta.width
    if (meta?.height) optionalUpdates.height = meta.height
    if (typeof meta?.durationSec === 'number') optionalUpdates.duration_seconds = Math.round(meta.durationSec * 100) / 100
    if (typeof meta?.frameRate === 'number') optionalUpdates.frame_rate = meta.frameRate

    await updateOptionalColumnsSafe('session_media', row.id as string, optionalUpdates)

    // KI-Metadaten (nur Bilder)
    if (it.kind === 'image' && row.image_url) {
      try {
        const { description, tags } = await generateImageMetadata(row.image_url as string)
        await updateOptionalColumnsSafe('session_media', row.id as string, { description, tags })
      } catch {}
    }

    // (optional) Transcode-Job vormerken
    if (it.kind === 'video') {
      try {
        await fetch('/api/media/transcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            sourceBucket: upOriginal.bucket,
            sourcePath: upOriginal.path,
            mediaId: row.id,
            profile: 'hls-720p',
          }),
        }).catch(() => {})
      } catch {}
    }

    updateItem(it.id, { status: 'done', progress: 100 })
  }

  async function updateOptionalColumnsSafe(table: string, id: string, patch: Record<string, any>) {
    for (const [key, value] of Object.entries(patch)) {
      try {
        // Cast, damit variable Tabellen-Namen typseitig akzeptiert werden
        const { error } = await (supabase.from as any)(table).update({ [key]: value }).eq('id', id)
        if (error) {
          const msg = (error as any)?.message ?? ''
          if (/column .* does not exist/i.test(msg) || /unknown column/i.test(msg)) continue
        }
      } catch {}
    }
  }

  // ---------- derived
  const queuedCount = useMemo(() => items.filter(i => i.status === 'queued').length, [items])
  const uploadingCount = useMemo(() => items.filter(i => i.status === 'uploading' || i.status === 'processing').length, [items])
  const doneCount = useMemo(() => items.filter(i => i.status === 'done').length, [items])

  // ---------- render
  return (
    <div className="space-y-4">
      <Label className="block text-sm font-medium">Medien hochladen</Label>

      <div
        className={cn(
          'rounded-xl border border-dashed p-4 md:p-6 text-center transition',
          'bg-card/50 hover:bg-card/70',
          'focus:outline-none focus:ring-2 focus:ring-primary/30'
        )}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); addFiles(e.dataTransfer.files) }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
        aria-label="Dateien hier ablegen, um hochzuladen"
      >
        <p className="text-sm text-muted-foreground">
          Ziehe Bilder oder Videos hierher, oder wähle Dateien aus.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="max-w-sm"
            onChange={(e) => addFiles(e.target.files)}
            disabled={busy}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            Dateien wählen
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={startUploads} disabled={busy || queuedCount === 0}>
          {busy ? 'Lädt…' : `Upload starten (${queuedCount})`}
        </Button>
        <Button variant="outline" onClick={clearDone} disabled={items.every(i => ['queued','uploading','processing'].includes(i.status))}>
          Liste bereinigen
        </Button>
        {uploadingCount > 0 && <span className="text-sm text-muted-foreground">{uploadingCount} in Bearbeitung…</span>}
        {doneCount > 0 && <span className="text-sm text-muted-foreground">{doneCount} fertig</span>}
      </div>

      {items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => (
            <li key={it.id} className="flex gap-3 rounded-lg border bg-card p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {it.previewUrl ? <img src={it.previewUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium">{it.name}</div>
                  <div className="text-xs tabular-nums text-muted-foreground">{fmtSize(it.size)}</div>
                </div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">{it.kind}</div>
                {it.meta && (
                  <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                    <div>{it.meta.mime || ''}</div>
                    {(it.meta.width && it.meta.height) ? <div>{it.meta.width}×{it.meta.height}</div> : <div />}
                    {typeof it.meta.durationSec === 'number' ? <div>{it.meta.durationSec.toFixed(1)}s</div> : <div />}
                  </div>
                )}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-all',
                      it.status === 'error' ? 'bg-red-600' : it.status === 'done' ? 'bg-green-600' : 'bg-primary'
                    )}
                    style={{ width: `${it.progress}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    {it.status === 'queued' && 'In Warteschlange'}
                    {it.status === 'uploading' && 'Wird hochgeladen…'}
                    {it.status === 'processing' && 'Wird verarbeitet…'}
                    {it.status === 'done' && 'Fertig'}
                    {it.status === 'error' && <span className="text-red-600">Fehler: {it.error}</span>}
                  </div>
                  {(it.status === 'queued' || it.status === 'error') && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(it.id)}>
                      Entfernen
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
