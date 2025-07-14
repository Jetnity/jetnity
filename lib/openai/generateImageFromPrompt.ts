import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY ist nicht gesetzt!')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'url'
  })

  const url = response.data?.[0]?.url
  if (!url) throw new Error('Keine Bild-URL von OpenAI zurückgegeben')

  return url
}
