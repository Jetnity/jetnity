'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateImageMetadata } from '@/lib/openai/generateImageMetadata'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface MediaUploadFormProps {
  sessionId: string
  userId: string
}

export default function MediaUploadForm({ sessionId, userId }: MediaUploadFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `media/${sessionId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload failed:', uploadError.message)
      setUploading(false)
      return
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('media').getPublicUrl(filePath)

    // 📥 In DB eintragen
    const { data, error } = await supabase
      .from('session_media')
      .insert({
        session_id: sessionId,
        user_id: userId,
        image_url: publicUrl,
        is_ai_generated: false
      })
      .select()
      .single()

    // 🧠 KI-Beschreibung + Tags generieren
    if (data && data.image_url) {
      try {
        const { description, tags } = await generateImageMetadata(data.image_url)

        await supabase
          .from('session_media')
          .update({ description, tags })
          .eq('id', data.id)
      } catch (err) {
        console.warn('KI-Auswertung fehlgeschlagen:', err)
      }
    }

    setUploading(false)
    fileRef.current!.value = ''
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="file">Bild hochladen</Label>
      <Input id="file" type="file" accept="image/*" ref={fileRef} disabled={uploading} />
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Lade hoch…' : 'Hochladen'}
      </Button>
    </div>
  )
}
