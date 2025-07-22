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
      return NextResponse.json({ error: 'Ungültige oder fehlende Session-ID' }, { status: 400 })
    }

    const supabase = createServerComponentClient()

    const { data: snippets, error } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase-Fehler:', error.message)
      return NextResponse.json({ error: 'Datenbankfehler' }, { status: 500 })
    }

    const context = snippets?.map((s) => s.content).join('\n') || ''

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Du bist ein kreativer Reise-CoAuthor. Verfasse einen inspirierenden, neuen Beitrag, der thematisch an den bisherigen Inhalt der Session anschließt.',
        },
        {
          role: 'user',
          content: `Bisherige Snippets:\n\n${context}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 300,
    })

    const text = response.choices[0].message?.content?.trim() || ''

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Allgemeiner Fehler in generate-cocreation:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
