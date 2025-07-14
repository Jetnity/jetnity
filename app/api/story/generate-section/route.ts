import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  try {
    const { sessionId, section } = await req.json()
    if (!sessionId || !section) {
      return NextResponse.json({ error: 'Fehlende Parameter.' }, { status: 400 })
    }

    const supabase = createServerComponentClient({ cookies: cookies() })

    const { data: snippets, error: snippetError } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (snippetError) {
      return NextResponse.json({ error: 'Fehler beim Laden der Snippets.' }, { status: 500 })
    }

    const context = snippets?.map((s) => s.content).join('\n') || ''

    const promptMap: Record<string, string> = {
      intro: 'Schreibe eine kreative Einleitung für eine Reise-Story.',
      highlight1: 'Beschreibe den ersten besonderen Reise-Moment.',
      highlight2: 'Füge einen weiteren Reise-Höhepunkt hinzu.',
      conclusion: 'Formuliere ein persönliches Fazit oder Abschluss.',
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein kreativer Story-CoAutor für eine Reiseplattform. Nutze den Kontext, um den gewünschten Abschnitt zu formulieren.',
        },
        {
          role: 'user',
          content: `Kontext:\n${context}\n\nAbschnitt: ${promptMap[section] || section}`,
        },
      ],
      temperature: 0.75,
      max_tokens: 400,
    })

    const text = response.choices[0].message.content || ''
    return NextResponse.json({ text })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Interner Serverfehler.' }, { status: 500 })
  }
}
