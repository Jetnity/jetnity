'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import type { TablesInsert } from '@/types/supabase'
import UploadDropzone from '@/components/creator/UploadDropzone'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, Upload as UploadIcon, X } from 'lucide-react'

type InsertUpload = TablesInsert<'creator_uploads'>

const BUCKET = 'creator-media'
const MAX_IMAGE_MB = 15
const MAX_VIDEO_MB = 250

export default function ContentUploadForm() {
  const router = useRouter()

  // form state
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [destination, setDestination] = React.useState('')
  const [region, setRegion] = React.useState('')
  const [format, setFormat] = React.useState<'Foto' | 'Video' | 'Reel' | 'Story'>('Foto')
  const [tags, setTags] = React.useState('')
  const [language, setLanguage] = React.useState<'de' | 'en'>('de')
  const [mood, setMood] = React.useState('')

  // file
  const [file, setFile] = React.useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  // ux
  const [submitting, setSubmitting] = React.useState(false)
  const [errMsg, setErrMsg] = React.useState<string>('')

  const abortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  /* ---------- Helpers ---------- */

  function cleanTags(input: string): string[] {
    const arr = input
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => t.replace(/^#/, '').toLowerCase())
    // dedupe, max 15
    return Array.from(new Set(arr)).slice(0, 15)
  }

  function inferFormat(f: File, fallback: InsertUpload['format']): InsertUpload['format'] {
    const mime = f.type || ''
    if (mime.startsWith('video/')) return 'Video' as any
    if (mime.startsWith('image/')) return 'Foto' as any
    return fallback ?? ('Foto' as any)
  }

  function validateFile(f: File | null): string | null {
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

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) throw Object.assign(new Error('Not authenticated'), { status: 401 })
    return data.user.id
  }

  function makeObjectPath(userId: string, f: File) {
    const ext = (() => {
      const m = /\.([a-z0-9]+)$/i.exec(f.name)
      return m ? m[1].toLowerCase() : (f.type.split('/')[1] || 'bin')
    })()
    // yyyy/mm/ für bessere Bucket-Aufräumung
    const d = new Date()
    const folder = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
    return `${userId}/${folder}/${uuidv4()}.${ext}`
  }

  /* ---------- Submit ---------- */

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setErrMsg('')
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const fileError = validateFile(file)
      if (fileError) throw new Error(fileError)

      const userId = await getUserId()
      const f = file as File

      // Format automatisch bestimmen (kann durch Auswahl überschrieben werden)
      const chosenFormat = (format || 'Foto') as InsertUpload['format']
      const effectiveFormat = inferFormat(f, chosenFormat)

      // 1) Upload nach Supabase Storage
      const objectPath = makeObjectPath(userId, f)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(objectPath, f, {
          cacheControl: '31536000, immutable',
          upsert: false,
          contentType: f.type || 'application/octet-stream',
          signal: abortRef.current.signal as any, // toleranter cast – supabase nutzt fetch intern
        } as any)

      if (upErr) {
        throw new Error(upErr.message || 'Upload fehlgeschlagen.')
      }

      // 2) Öffentliche URL sauber via API (statt String zusammenbauen)
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath)
      const publicUrl = pub?.publicUrl
      if (!publicUrl) throw new Error('Konnte öffentliche URL nicht ermitteln.')

      // 3) DB-Insert
      const payload: InsertUpload = {
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        destination: destination.trim() || null,
        region: region.trim() || null,
        format: effectiveFormat,
        tags: cleanTags(tags),
        language,
        mood: mood.trim() || null,
        image_url: publicUrl,
        file_url: publicUrl,
        // created_at lässt man i. d. R. von der DB (default now()) setzen – aber falls nötig:
        // created_at: new Date().toISOString() as any,
      }

      const { error: dbErr } = await supabase.from('creator_uploads').insert([payload])
      if (dbErr) throw new Error(dbErr.message || 'Fehler beim Speichern in der Datenbank.')

      toast.success('Upload erfolgreich gespeichert.')
      // Reset
      setTitle('')
      setDescription('')
      setDestination('')
      setRegion('')
      setTags('')
      setMood('')
      setFile(null)
      setPreviewUrl(null)

      // Seite aktualisieren (Grid etc.)
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

  const onCancelUpload = () => {
    abortRef.current?.abort()
    setSubmitting(false)
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
              value={format}
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
              value={language}
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

        {/* Datei */}
        <div className="grid grid-cols-1 gap-3">
          <UploadDropzone
            accept="image/*,video/*"
            onFile={(f) => setFile(f)}
            disabled={submitting}
          />
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
                onClick={() => { setFile(null); setPreviewUrl(null) }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {errMsg && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {errMsg}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={submitting || !file}
            className={cn('inline-flex items-center gap-2 rounded-xl')}
          >
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
