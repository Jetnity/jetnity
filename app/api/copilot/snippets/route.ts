import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Session ID fehlt oder ungültig' }, { status: 400 })
    }

    const supabase = createServerComponentClient()

    const { data: snippets, error } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase-Fehler:', error.message)
      return NextResponse.json({ error: 'Fehler beim Laden der Snippets' }, { status: 500 })
    }

    if (!snippets || snippets.length === 0) {
      return NextResponse.json({ snippets: [] })
    }

    const context = snippets.map((s) => s.content).join('\n---\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein kreativer Redakteur für eine Reiseplattform. Analysiere vorhandene Inhalte (Snippets) einer Session und gib 2–3 konkrete, kreative Textvorschläge, die thematisch ergänzen, verbessern oder inspirieren. Antworte nur mit einer nummerierten Liste.',
        },
        {
          role: 'user',
          content: `Hier sind die bisherigen Inhalte:\n\n${context}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const rawOutput = response.choices[0].message?.content || ''
    // Extrahiere nummerierte Vorschläge (1. ... 2. ... 3. ...)
    const lines = rawOutput
      .split(/\n+/)
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 10)

    const snippetsOut = lines.slice(0, 3).map((text, index) => ({
      id: `${Date.now()}-${index}`,
      content: text,
    }))

    return NextResponse.json({ snippets: snippetsOut })
  } catch (err) {
    console.error('Allgemeiner Fehler in /api/copilot/snippets:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
