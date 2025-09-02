// app/api/storyboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

export const runtime = 'nodejs'

// Eingabe: Zahlen-FPS (passt zu deinem Frontend)
const InputSchema = z.object({
  script: z.string().min(8, 'Script zu kurz'),
  aspect: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  style: z.enum(['cinematic', 'travel_magazine', 'vlog', 'documentary']).default('travel_magazine'),
  fps: z.union([z.literal(24), z.literal(25), z.literal(30)]).default(25 as 25),
})

const ShotSchema = z.object({
  prompt: z.string(),
  vo: z.string().optional().nullable(),
  durationSec: z.number().int().min(1).max(30).optional().nullable(),
  camera: z.string().optional().nullable(),
  motion: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const SceneSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  durationSec: z.number().int().min(3).max(120).optional().nullable(),
  shots: z.array(ShotSchema).min(1),
  musicHint: z.string().optional().nullable(),
  transition: z.string().optional().nullable(),
})

const ScenesOutSchema = z.object({
  scenes: z.array(SceneSchema).min(1),
})

function extractJson(text: string): unknown {
  try { return JSON.parse(text) } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) { try { return JSON.parse(fence[1]) } catch {} }
  const s = text.indexOf('{'); const e = text.lastIndexOf('}')
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)) } catch {} }
  throw new Error('Konnte JSON nicht extrahieren')
}

const SYSTEM = `You are a seasoned travel video producer. Given a topic/script, output a compact JSON storyboard.
Rules:
- 3–8 scenes total. Each scene has 2–6 shots.
- Use integer seconds for durations.
- Return JSON ONLY (no prose).`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const input = InputSchema.parse(body)

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const userPrompt = `
Topic/Script:
"""
${input.script}
"""

Preferences:
- Aspect: ${input.aspect}
- Style: ${input.style}
- FPS: ${input.fps}

Return JSON like:
{
  "scenes":[
    {
      "title":"..",
      "summary":"..",
      "durationSec": 12,
      "shots":[
        {"prompt":"..","vo":"..","durationSec":4,"camera":"..","motion":"..","location":"..","notes":".."}
      ],
      "musicHint":"..",
      "transition":"Cross dissolve 12f"
    }
  ]
}
`.trim()

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_STORYBOARD_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = completion.choices[0]?.message?.content || ''
    const raw = extractJson(content)

    const parsed = ScenesOutSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.issues },
        { status: 422 }
      )
    }

    // TS: Szene-Typ explizit, damit kein implizites any in map
    type SceneT = z.infer<typeof SceneSchema>
    const scenesArr = parsed.data.scenes as SceneT[]

    const trimmed = {
      scenes: scenesArr.slice(0, 12).map((s: SceneT) => ({
        ...s,
        shots: s.shots.slice(0, 6),
      })),
    }

    return NextResponse.json(trimmed, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 })
  }
}
