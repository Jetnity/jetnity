import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY ist nicht gesetzt!')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateImageMetadata(imageUrl: string): Promise<{
  description: string
  tags: string[]
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      {
        role: 'system',
        content: 'Du bist ein Experte für Reiseinhalte. Analysiere das Bild und gib eine Beschreibung plus passende Schlagwörter (Tags).'
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          },
          {
            type: 'text',
            text: 'Was zeigt dieses Bild? Bitte gib eine präzise Beschreibung und 3–5 passende Tags. Antworte im Format:\nBeschreibung: ...\nTags: tag1, tag2, tag3'
          }
        ]
      }
    ],
    max_tokens: 300
  })

  const content = response.choices[0]?.message?.content || ''

  // Robustere Extraktion
  let description = ''
  let tags: string[] = []
  const descMatch = content.match(/Beschreibung:\s*(.*)/i)
  const tagsMatch = content.match(/Tags:\s*(.*)/i)
  if (descMatch) description = descMatch[1].trim()
  if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)

  return { description, tags }
}
