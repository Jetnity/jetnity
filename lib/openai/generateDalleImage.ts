// lib/openai/generateDalleImage.ts

import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateDalleImage(prompt: string): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    })

    const imageUrl = response.data?.[0]?.url ?? null
    return imageUrl
  } catch (error) {
    console.error('❌ Fehler bei DALL·E-Generierung:', error)
    return null
  }
}
