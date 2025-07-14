// app/api/copilot/hero-image/route.ts

import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: 'A breathtaking travel landscape with mountains, ocean, and vibrant colors, cinematic style, ultra high-resolution, sunlight, travel mood',
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      response_format: 'url',
    })

    const url = response.data && response.data[0]?.url

    if (!url) {
      return NextResponse.json({ error: 'No image returned from DALL·E' }, { status: 500 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('DALL·E API Fehler:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
