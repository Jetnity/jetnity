'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { generateImageFromPrompt } from '@/lib/openai/generateImageFromPrompt'
import { generateImageMetadata } from '@/lib/openai/generateImageMetadata'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  sessionId: string
  userId: string
}

export default function TextToImageGenerator({ sessionId, userId }: Props) {
  
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt) return

    setLoading(true)

    try {
      // 🧠 Echte DALL·E Bildgenerierung
      const generatedImageUrl = await generateImageFromPrompt(prompt)

      // 📥 In Supabase einfügen
      const { data, error } = await supabase
        .from('session_media')
        .insert({
          session_id: sessionId,
          user_id: userId,
          image_url: generatedImageUrl,
          is_ai_generated: true
        })
        .select()
        .single()

      // 🧠 Metadaten ergänzen
      if (data && data.image_url) {
        const { description, tags } = await generateImageMetadata(data.image_url)

        await supabase
          .from('session_media')
          .update({ description, tags })
          .eq('id', data.id)
      }
    } catch (err) {
      console.error('DALL·E-Fehler:', err)
    }

    setPrompt('')
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <Label htmlFor="prompt">KI-Bildbeschreibung</Label>
      <Input
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="z. B. Sonnenuntergang an einer tropischen Küste"
        disabled={loading}
      />
      <Button onClick={handleGenerate} disabled={loading || !prompt}>
        {loading ? 'Generiere…' : 'Bild erzeugen'}
      </Button>
    </div>
  )
}
