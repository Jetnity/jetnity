// app/api/admin/copilot/actions/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createRouteHandlerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import OpenAI from 'openai'

export async function POST(req: Request) {
  await requireAdmin()
  const { mode, prompt } = await req.json().catch(() => ({} as { mode?: string; prompt?: string }))
  if (!mode || !['assist', 'auto', 'simulate'].includes(mode)) {
    return NextResponse.json({ error: 'Ungültiger Modus' }, { status: 400 })
  }

  const supabase = createRouteHandlerClient<Database>()

  let title = `CoPilot ${mode}`
  let detail = ''

  try {
    if (process.env.OPENAI_API_KEY && mode !== 'simulate') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const chat = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du bist CoPilot Pro für Jetnity. Antworte kurz und mit nächsten Schritten.' },
          { role: 'user', content: (prompt?.trim() || `Führe '${mode}' aus und gib nächste Schritte.`) },
        ],
        temperature: 0.2,
      })
      detail = chat.choices[0]?.message?.content?.trim() ?? ''
    } else {
      detail = mode === 'simulate'
        ? 'Simulation ausgeführt: Keine Änderungen.'
        : 'OpenAI-Schlüssel fehlt – setze OPENAI_API_KEY.'
    }
  } catch (e: any) {
    detail = `Fehler bei CoPilot: ${e?.message ?? 'unbekannt'}`
  }

  // WICHTIG: kein "mode"-Feld in DB. Wir schreiben den Modus in "source".
  const { data: inserted, error } = await supabase
    .from('copilot_suggestions')
    .insert({
      title,
      detail,
      prompt: prompt ?? null,
      source: `admin/copilot/actions:${mode}`,
    } as any)
    .select('id, title, detail, prompt, source, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, suggestion: inserted })
}
