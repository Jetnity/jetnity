// lib/intelligence/copilot-image.ts

import OpenAI from 'openai'
import { randomUUID } from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

/**
 * Generiert ein realistisches Hero-Bild für die Startseite via DALL·E
 */
export async function generateHeroImage(region?: string): Promise<string | null> {
  try {
    const prompt = region
      ? `Stunning travel photo of ${region}, professional composition, dreamy atmosphere, ultra realistic`
      : `Inspiring travel destination, wide landscape, cinematic style, rich colors, ultra realistic`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1536',
    })

    return response.data?.[0]?.url ?? null
  } catch (err) {
    console.error('❌ Fehler bei DALL·E Hero-Image:', err)
    return null
  }
}
