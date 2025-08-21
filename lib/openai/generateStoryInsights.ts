// lib/openai/generateStoryInsights.ts

// Flag, damit UI-Komponenten das Feature ggf. deaktiviert anzeigen können
export const OPENAI_ENABLED = Boolean(process.env.OPENAI_API_KEY)

export async function generateStoryInsights(
  storyText: string
): Promise<{ rating: number; insights: string }> {
  if (!storyText?.trim()) {
    return { rating: 0, insights: 'Kein Text übergeben.' }
  }

  // Kein API-Key? – Kein Crash! Sauberer Fallback:
  if (!OPENAI_ENABLED) {
    return {
      rating: 0,
      insights:
        'KI-Analyse deaktiviert: Kein OPENAI_API_KEY gesetzt. Upload/Seite funktionieren weiterhin.',
    }
  }

  try {
    // Dynamischer Import verhindert Build-/Import-Error ohne Key
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

    const prompt = `
Bewerte folgenden Reisetext in drei Aspekten:
1. Klarheit
2. Emotionaler Ausdruck
3. Sprachqualität

Gib am Ende eine Gesamtbewertung (0–100) und ein kurzes, hilfreiches Feedback.

Antworte in folgendem Format:

Bewertung: [Zahl von 0–100]
Feedback:
[Text]
`.trim()

    const res = await openai.chat.completions.create({
      // Modell konfigurierbar, mit sinnvollem Default
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'Du bist ein professioneller Story-Editor für Reiseblogs.',
        },
        {
          role: 'user',
          content: `${prompt}\n\n${storyText}`,
        },
      ],
    })

    const content = res.choices?.[0]?.message?.content?.trim() ?? ''

    const ratingMatch = content.match(/Bewertung:\s*(\d{1,3})/i)
    const rating = ratingMatch
      ? Math.min(100, Math.max(0, parseInt(ratingMatch[1], 10)))
      : 0

    const feedback = content
      .replace(/Bewertung:\s*\d{1,3}/i, '')
      .replace(/^Feedback:\s*/i, '')
      .trim()

    return {
      rating,
      insights: feedback || 'Keine zusätzlichen Hinweise.',
    }
  } catch (error) {
    console.error('❌ Fehler bei OpenAI-Analyse:', error)
    return {
      rating: 0,
      insights: 'Keine Bewertung verfügbar. Die Analyse ist fehlgeschlagen.',
    }
  }
}
