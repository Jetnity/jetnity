import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const hasKey = !!process.env.OPENAI_API_KEY
const openai = hasKey ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const mode = String(body?.mode ?? 'snippets') as 'snippets' | 'score'
    const content: string = String(body?.content ?? '')
    const title: string = String(body?.title ?? '')
    const prompt: string = String(body?.prompt ?? '')
    const count: number = Math.min(Math.max(Number(body?.count ?? 5), 1), 10)
    const locale: string = String(body?.locale ?? 'de')

    if (mode === 'score') {
      if (hasKey && openai) {
        const sys = `Du bewertest Reise-Storytexte mit einer Zahl 0–100 (höher = besser) und gibst kurzes, hilfreiches Feedback. Antworte in ${locale}.`
        const res = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            {
              role: 'user',
              content:
                'Bewerte den folgenden Text (Klarheit, Emotion, Sprachqualität) und gib am Ende eine Zahl 0–100 sowie 2–3 Sätze Feedback:\n\n' +
                content,
            },
          ],
          temperature: 0.3,
        })

        const text = res.choices[0]?.message?.content ?? ''
        const ratingMatch = text.match(/(\d{1,3})\s*\/?\s*100/) || text.match(/Bewertung\s*[:\-]?\s*(\d{1,3})/i)
        const rating = ratingMatch ? Math.min(100, Math.max(0, parseInt(ratingMatch[1], 10))) : 70
        const feedback = text.replace(/\n{3,}/g, '\n\n').trim()
        return NextResponse.json({ rating, feedback })
      }

      // Fallback: naive Heuristik
      const len = content.trim().length
      const hasEmoji = /[^\p{L}\p{N}\p{P}\p{Z}]/u.test(content)
      let rating = 60 + Math.min(40, Math.floor(len / 500))
      if (hasEmoji) rating += 2
      rating = Math.max(0, Math.min(100, rating))
      const feedback =
        'KI-Bewertung (Fallback): Der Text wirkt solide. Versuche klare Absätze, aktive Verben und 1–2 Emotion-Trigger (Geruch, Geräusch, Gefühl).'
      return NextResponse.json({ rating, feedback })
    }

    // mode === 'snippets'
    if (hasKey && openai) {
      const sys = `Du schreibst knappe Social-Snippets für Reise-Fotos/Videos. Antworten ausschließlich als Liste von einzelnen Snippets, keine Einleitung. Sprache: ${locale}.`
      const base =
        (title ? `Titel: ${title}\n` : '') +
        (content ? `Beschreibung:\n${content}\n` : '') +
        (prompt ? `Anweisung:\n${prompt}\n` : '')

      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: sys },
          {
            role: 'user',
            content:
              `Erzeuge ${count} unterschiedliche Snippets. Je 1–2 Sätze, optional 2–4 relevante Hashtags.\n` +
              `Kein Markdown, kein Bullet — nur nackte Snippets, Zeile pro Snippet.\n\n` +
              base,
          },
        ],
        temperature: 0.9,
      })

      const raw = (res.choices[0]?.message?.content ?? '').trim()
      const lines = raw
        .split('\n')
        .map((l) => l.replace(/^\s*[-•\d.]+\s*/g, '').trim())
        .filter(Boolean)

      // dedupe & limit
      const unique = Array.from(new Set(lines)).slice(0, count)
      return NextResponse.json({ snippets: unique })
    }

    // Fallback: statische Vorschläge
    const fallback = [
      'Goldenes Abendlicht über der Skyline – perfekter Moment für Fernweh. #TravelInspo #GoldenHour',
      'Versteckte Gasse, stille Cafés und der Duft von frischem Espresso – genau mein Tempo.',
      'Wellenrauschen im Takt – Kopf aus, Herz an. #BeachVibes #MindfulTravel',
      'Bergluft, weite Sicht und ein kleines „Wow“ bei jedem Schritt.',
      'Streetfood, Neonlichter und endlose Energie – diese Stadt schläft nie.',
    ].slice(0, count)
    return NextResponse.json({ snippets: fallback })
  } catch (e: any) {
    console.error('[API] /api/media/snippets error', e?.message || e)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
