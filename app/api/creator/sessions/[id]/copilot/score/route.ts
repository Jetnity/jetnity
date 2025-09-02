// app/api/creator/sessions/[id]/copilot/score/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase/server'

type Body = { title?: string; content?: string | null }

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    // Zugriff prüfen
    const { data: s, error } = await supabase
      .from('creator_sessions')
      .select('id,user_id,shared_with')
      .eq('id', params.id)
      .single()
    if (error || !s) return new NextResponse('Not found', { status: 404 })
    const allowed = s.user_id === user.id || (Array.isArray(s.shared_with) && s.shared_with.includes(user.id))
    if (!allowed) return new NextResponse('Forbidden', { status: 403 })

    const body = (await req.json().catch(() => ({}))) as Body
    const title = (body.title ?? '').trim()
    const content = (body.content ?? '').trim()

    // Fallback-Heuristik (ohne OpenAI)
    const len = content.length
    let score = Math.min(100, Math.round((Math.log10(1 + len) / Math.log10(1 + 4000)) * 100))
    if (/#\w/.test(content)) score += 5
    if (/[!?.]$/.test(content)) score += 2
    if (/call to action|jetzt|mehr erfahren|klick/i.test(content)) score += 4
    score = Math.max(0, Math.min(100, score))

    const tips: string[] = []
    if (!/#\w/.test(content)) tips.push('Füge 2–4 relevante Hashtags hinzu.')
    if (!/[!?.]$/.test(content)) tips.push('Beende den Teaser mit einem starken Punkt oder Ausruf.')
    if (!/jetzt|mehr erfahren|folge/i.test(content)) tips.push('Baue einen klaren Call-to-Action ein.')
    if (title.split(' ').length < 3) tips.push('Formuliere einen konkreteren Titel mit 3–6 Wörtern.')

    // einfache Caption-Empfehlung
    const caption =
      title && content
        ? `${title} — ${content.slice(0, 180)}${content.length > 180 ? '…' : ''} #travel #inspire`
        : (content || 'Neuer Post ✨ #creative')

    // Optional: OpenAI, falls KEY gesetzt (sanft hinzu)
    try {
      if (process.env.OPENAI_API_KEY) {
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
        const sys = 'Du bist ein knapper Creative-CoPilot. Antworte mit JSON: {score:0..100,label:"",tips:[...],caption:""}'
        const userMsg = `Titel: ${title}\nContent:\n${content}\nBitte bewerte für Social (IG/TikTok/YT Shorts).`
        const chat = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: sys }, { role: 'user', content: userMsg }],
          temperature: 0.5,
        })
        const txt = chat.choices?.[0]?.message?.content?.trim()
        if (txt) {
          const parsed = JSON.parse(txt)
          if (typeof parsed.score === 'number') score = Math.max(0, Math.min(100, Math.round(parsed.score)))
          if (Array.isArray(parsed.tips)) parsed.tips.forEach((t: string) => tips.push(String(t)))
          if (typeof parsed.caption === 'string' && parsed.caption.length > 0) {
            // preferiere KI-Caption
            // eslint-disable-next-line prefer-destructuring
            const c: string = parsed.caption
            // schlanker cutoff
            tips.splice(0, tips.length, ...Array.from(new Set(tips)))
            return NextResponse.json({
              score,
              label: labelForScore(score),
              tips,
              caption: c,
            })
          }
        }
      }
    } catch {
      // stiller Fallback
    }

    return NextResponse.json({
      score,
      label: labelForScore(score),
      tips,
      caption,
    })
  } catch (e: any) {
    console.error('[copilot.score] error', e)
    return new NextResponse('Unexpected error', { status: 500 })
  }
}

function labelForScore(s: number) {
  if (s >= 85) return 'sehr gut'
  if (s >= 70) return 'gut'
  if (s >= 50) return 'okay'
  return 'optimieren'
}
