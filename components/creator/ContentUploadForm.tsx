'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import type { TablesInsert } from '@/types/supabase'
import UploadDropzone from '@/components/creator/UploadDropzone'

export default function ContentUploadForm() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [destination, setDestination] = useState('')
  const [region, setRegion] = useState('')
  const [format, setFormat] = useState('Foto')
  const [tags, setTags] = useState('')
  const [language, setLanguage] = useState('de')
  const [mood, setMood] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    const { data: userData } = await supabase.auth.getUser()
    const user_id = userData?.user?.id

    if (!user_id || !file) {
      setError('Fehlende Datei oder Benutzer nicht eingeloggt.')
      setUploading(false)
      return
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `${user_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('creator-media')
      .upload(filePath, file)

    if (uploadError) {
      setError('Upload fehlgeschlagen.')
      setUploading(false)
      return
    }

    const image_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/creator-media/${filePath}`

    const newUpload: TablesInsert<'creator_uploads'> = {
      title,
      description,
      format,
      destination,
      region,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean) as string[],
      language,
      mood,
      image_url,
      user_id,
      created_at: new Date().toISOString(),
      file_url: image_url,
    }

    const { error: insertError } = await supabase
      .from('creator_uploads')
      .insert([newUpload])

    if (insertError) {
      setError('Fehler beim Speichern in der Datenbank.')
      setUploading(false)
      return
    }

    setUploading(false)
    router.refresh()
    // Optional: Formular zurücksetzen
    setTitle(''); setDescription(''); setDestination(''); setRegion('')
    setTags(''); setMood(''); setFile(null)
  }

  return (
    <form onSubmit={handleUpload} className="space-y-4 max-w-2xl">
      <input
        type="text" placeholder="Titel" value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded focus:ring-2 ring-blue-200" required
      />
      <textarea
        placeholder="Beschreibung" value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded focus:ring-2 ring-blue-200" rows={4} required
      />
      <input
        type="text" placeholder="Reiseziel (destination)" value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full border p-2 rounded focus:ring-2 ring-blue-200" required
      />
      <input
        type="text" placeholder="Region" value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="w-full border p-2 rounded focus:ring-2 ring-blue-200"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select value={format} onChange={(e) => setFormat(e.target.value)} className="border p-2 rounded">
          <option>Foto</option><option>Video</option><option>Reel</option><option>Story</option>
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-2 rounded">
          <option value="de">Deutsch</option><option value="en">Englisch</option>
        </select>
        <input
          type="text" placeholder="Mood (z. B. entspannt, abenteuerlich)" value={mood}
          onChange={(e) => setMood(e.target.value)} className="border p-2 rounded"
        />
      </div>

      <input
        type="text" placeholder="Tags (Komma getrennt)" value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="w-full border p-2 rounded"
      />

      {/* NEU: Dropzone */}
      <UploadDropzone onFile={(f) => setFile(f)} accept="image/*" />
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit" disabled={uploading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full sm:w-auto disabled:bg-neutral-300"
      >
        {uploading ? 'Hochladen…' : 'Upload starten'}
      </button>
    </form>
  )
}
