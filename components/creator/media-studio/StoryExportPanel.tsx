'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface StoryExportPanelProps {
  sessionId: string
  children?: React.ReactNode
}

export default function StoryExportPanel({ sessionId, children }: StoryExportPanelProps) {
  const [textBlocks, setTextBlocks] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)

      const { data: snippets, error: snippetError } = await supabase
        .from('session_snippets')
        .select('content')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      const { data: media, error: mediaError } = await supabase
        .from('session_media')
        .select('image_url')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (snippetError || mediaError) {
        console.error('Fehler beim Laden:', snippetError || mediaError)
      }

      setTextBlocks(snippets?.map((s) => s.content) || [])
      setImageUrls(media?.map((m) => m.image_url) || [])
      setLoading(false)
    }

    loadContent()
  }, [sessionId])

  const generateHTML = () => {
    const html = `
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Jetnity Reise-Story</title>
        <style>
          body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
          img { max-width: 100%; margin: 1rem 0; border-radius: 8px; }
          p { margin-bottom: 1rem; }
        </style>
      </head>
      <body>
        ${imageUrls.map((url) => `<img src="${url}" />`).join('')}
        ${textBlocks.map((t) => `<p>${t}</p>`).join('')}
      </body>
      </html>
    `.trim()

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="bg-white border rounded p-4 space-y-4">
      <h4 className="text-sm font-semibold text-gray-700">📤 Story exportieren</h4>

      {loading ? (
        <p className="text-gray-500">Lade Inhalte…</p>
      ) : textBlocks.length === 0 && imageUrls.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Keine Inhalte zum Exportieren vorhanden.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {textBlocks.length} Textabschnitte, {imageUrls.length} Bilder gefunden.
          </p>

          <Button onClick={generateHTML} size="sm">
            HTML-Vorschau anzeigen
          </Button>

          {/* Optional: Download statt Vorschau – später erweiterbar */}
          {/* <Button onClick={downloadHTML} size="sm" variant="outline">Als Datei speichern</Button> */}

          {children && <div className="pt-4">{children}</div>}
        </>
      )}
    </div>
  )
}
