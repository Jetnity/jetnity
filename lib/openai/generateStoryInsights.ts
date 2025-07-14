import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY ist nicht gesetzt!')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateStoryInsights(storyText: string): Promise<{
  rating: number
  insights: string
}> {
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

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein professioneller Story-Editor für Reiseblogs.'
        },
        {
          role: 'user',
          content: `${prompt}\n\n${storyText}`
        }
      ],
      max_tokens: 500
    })

    const content = res.choices[0].message?.content || ''
    const ratingMatch = content.match(/Bewertung:\s*(\d+)/i)
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 0
    const feedback = content
      .replace(/Bewertung:\s*\d+/i, '')
      .replace(/^Feedback:\s*/i, '')
      .trim()

    return { rating, insights: feedback }
  } catch (error) {
    console.error('❌ Fehler bei OpenAI-Analyse:', error)
    return {
      rating: 0,
      insights: 'Keine Bewertung verfügbar. Die Analyse ist fehlgeschlagen.'
    }
  }
}

