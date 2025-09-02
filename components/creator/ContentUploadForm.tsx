// components/creator/ContentUploadForm.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { TablesInsert } from '@/types/supabase'
import UploadDropzone from '@/components/creator/UploadDropzone'
import { Button } from '@/components/ui/button'
import { Loader2, Upload as UploadIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type InsertUpload = TablesInsert<'creator_uploads'>
const BUCKET = 'creator-media'
const MAX_IMAGE_MB = 15
const MAX_VIDEO_MB = 250

export default function ContentUploadForm() {
  const router = useRouter()

  // form
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [destination, setDestination] = React.useState('')
  const [region, setRegion] = React.useState('')
  const [format, setFormat] = React.useState<InsertUpload['format']>('Foto' as any)
  const [tags, setTags] = React.useState('')
  const [language, setLanguage] = React.useState<InsertUpload['language']>('de' as any)
  const [mood, setMood] = React.useState('')

  // file
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // ux
  const [submitting, setSubmitting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [errMsg, setErrMsg] = React.useState<string>('')

  const xhrRef = React.useRef<XMLHttpRequest | null>(null)

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  /* ---------- helpers ---------- */

  function cleanTags(input: string): string[] {
    const arr = input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/^#/, '').toLowerCase())
    return Array.from(new Set(arr)).slice(0, 15)
  }

  function validateFile(f: File | null) {
    if (!f) return 'Bitte eine Datei auswählen.'
    const sizeMB = f.size / (1024 * 1024)
    if (f.type.startsWith('image/')) {
      if (sizeMB > MAX_IMAGE_MB) return `Bild ist zu groß (>${MAX_IMAGE_MB} MB).`
    } else if (f.type.startsWith('video/')) {
      if (sizeMB > MAX_VIDEO_MB) return `Video ist zu groß (>${MAX_VIDEO_MB} MB).`
    } else {
      return 'Nur Bilder oder Videos sind erlaubt.'
    }
    return null
  }

  function inferFormat(f: File, fallback: InsertUpload['format']): InsertUpload['format'] {
    const mime = f.type
    if (mime.startsWith('video/')) return 'Video' as any
    if (mime.startsWith('image/')) return 'Foto' as any
    return fallback ?? ('Foto' as any)
  }

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 })
    return data.user.id
  }

  /* ---------- signed upload ---------- */

  async function createSignedUrl(mime: string): Promise<{ signedUrl: string; path: string; publicUrl: string }> {
    const res = await fetch('/api/uploads/signed-url', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mime }),
    })
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({})))?.error || 'Konnte Signed URL nicht erstellen.'
      throw new Error(msg)
    }
    const json = (await res.json()) as { signedUrl: string; path: string; publicUrl: string }
    return json
  }

  async function putWithProgress(url: string, file: File, mime: string) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr
      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', mime)

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed with status ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('Netzwerkfehler beim Upload'))
      xhr.onabort = () => reject(new Error('Upload abgebrochen'))
      xhr.send(file)
    })
  }

  const onCancelUpload = () => {
    xhrRef.current?.abort()
    setSubmitting(false)
    setProgress(0)
  }

  /* ---------- submit ---------- */

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErrMsg('')
    setProgress(0)

    try {
      const fileError = validateFile(file)
      if (fileError) throw new Error(fileError)

      // sichergehen: user eingeloggt (auch für spätere DB-Insert)
      await getUserId()

      const f = file as File
      const effectiveFormat = inferFormat(f, format)

      // 1) Signed URL anfordern
      const { signedUrl, path, publicUrl } = await createSignedUrl(f.type || 'application/octet-stream')

      // 2) Hochladen (mit Progress)
      await putWithProgress(signedUrl, f, f.type || 'application/octet-stream')

      // 3) DB-Insert (TS-Fix: keine nulls für string-Felder)
      const payload: InsertUpload = {
        created_at: new Date().toISOString(),
        title: title.trim(),
        description: description.trim(),
        destination: (destination.trim() || '') as InsertUpload['destination'],
        region: (region.trim() || '') as InsertUpload['region'],
        format: effectiveFormat,
        tags: cleanTags(tags),
        language,
        mood: (mood.trim() || null) as InsertUpload['mood'],
        image_url: publicUrl,
        file_url: publicUrl,
        user_id: (await getUserId()) as InsertUpload['user_id'],
      }

      const { error: dbErr } = await supabase.from('creator_uploads').insert([payload])
      if (dbErr) throw new Error(dbErr.message || 'Fehler beim Speichern in der Datenbank.')

      toast.success('Upload erfolgreich gespeichert.')
      // reset
      setTitle('')
      setDescription('')
      setDestination('')
      setRegion('')
      setTags('')
      setMood('')
      setFile(null)
      setPreviewUrl(null)
      setProgress(0)

      router.refresh()
    } catch (err: any) {
      console.error('[ContentUploadForm]', err)
      const message =
        err?.status === 401
          ? 'Bitte melde dich an, um Inhalte hochzuladen.'
          : err?.message || 'Unbekannter Fehler beim Upload.'
      setErrMsg(message)
      toast.error('Upload fehlgeschlagen', { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------- UI ---------- */

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Titel</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 ring-blue-200"
            placeholder="Titel"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Beschreibung</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border px-3 py-2 focus:ring-2 ring-blue-200"
            placeholder="Beschreibe kurz deinen Upload"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Reiseziel (destination)</span>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              maxLength={120}
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 ring-blue-200"
              placeholder="z. B. Bali"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Region</span>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              maxLength={120}
              className="w-full rounded-lg border px-3 py-2 focus:ring-2 ring-blue-200"
              placeholder="z. B. Ubud"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Format</span>
            <select
              value={format as any}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option>Foto</option>
              <option>Video</option>
              <option>Reel</option>
              <option>Story</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Sprache</span>
            <select
              value={language as any}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="de">Deutsch</option>
              <option value="en">Englisch</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Mood</span>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              maxLength={60}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="z. B. entspannt, abenteuerlich"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Tags (Komma getrennt)</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="bali, ubud, landschaft"
          />
          <span className="mt-1 block text-xs text-muted-foreground">Max. 15 Tags, „#“ optional.</span>
        </label>

        {/* Dropzone + optional Overlay bei submitting */}
        <div className="relative">
          <UploadDropzone accept="image/*,video/*" onFile={(f) => setFile(f)} />
          {submitting && (
            <div className="absolute inset-0 rounded-lg bg-background/50 backdrop-blur-sm pointer-events-none" />
          )}
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="relative rounded-xl border p-2">
            {file?.type.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Vorschau" className="max-h-64 w-full rounded-lg object-cover" />
            ) : (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={previewUrl} className="max-h-64 w-full rounded-lg" controls />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => {
                setFile(null)
                setPreviewUrl(null)
              }}
              aria-label="Datei entfernen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Progress */}
        {submitting && (
          <div className="flex items-center gap-3">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="w-12 text-right text-sm tabular-nums">{progress}%</div>
          </div>
        )}

        {/* Error */}
        {errMsg && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {errMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={submitting || !file} className="inline-flex items-center gap-2 rounded-xl">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
            {submitting ? 'Hochladen…' : 'Upload starten'}
          </Button>

          {submitting && (
            <Button type="button" variant="outline" onClick={onCancelUpload}>
              Abbrechen
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
