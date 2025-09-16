// app/api/admin/copilot/suggest/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServerComponentClient } from '@/lib/supabase/server'

type Idea = { title: string; detail?: string; tags?: string[] }

function buildSuggestions(prompt: string): Idea[] {
  const p = prompt.toLowerCase()
  const base: Idea[] = [
    { title: 'Performance Sweep', detail: 'LCP/CLS prüfen, Preload & Caching anpassen', tags: ['perf','seo'] },
    { title: 'Security Review', detail: 'RLS/Policies prüfen, Suspicious IPs scannen', tags: ['security'] },
    { title: 'Growth Quick Wins', detail: 'Landing A/B, Copy-Hooks, Mobile CTR', tags: ['growth','ux'] },
  ]
  if (p.includes('video') || p.includes('media')) {
    base.unshift({ title: 'Media Pipeline Tuning', detail: 'Rendertime & Queues optimieren', tags: ['media','ops'] })
  }
  return base.slice(0, 3)
}

export async function POST(req: Request) {
  await requireAdmin() // wir sind im Admin-Kontext

  const { prompt = '' } = (await req.json().catch(() => ({ prompt: '' }))) as { prompt?: string }
  const ideas = buildSuggestions(String(prompt || ''))

  const supabase = createServerComponentClient()
  try {
    // aktuelle Session für created_by
    const { data: { session } } = await supabase.auth.getSession()
    const created_by = session?.user?.id ?? null

    await supabase
      .from('copilot_suggestions')
      .insert(
        ideas.map((s) => ({
          title: s.title,
          detail: s.detail ?? null,
          tags: s.tags ? JSON.stringify(s.tags) : null, // falls Spalte JSONB, Supabase nimmt auch JS-Objekte an – so sind wir safe
          prompt: prompt || null,
          source: 'heuristic',
          created_by,
        }))
      )
      .throwOnError()
  } catch (e: any) {
    // Falls RLS/Policy hakt, geben wir eine klare Fehlermeldung zurück
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'insert failed' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, ideas })
}
