// components/admin/CopilotDockPanel.tsx
import { createServerClient } from '@/lib/supabase/server'
import type { Database, Tables } from '@/types/supabase'
import CopilotDockPanelClient from './_parts/CopilotDockPanelClient'

type Mode = 'assist' | 'auto' | 'simulate' | null

type UISuggestion = {
  id: string
  title: string | null
  body: string | null
  mode: Mode
  created_at: string
}

function parseModeFromSource(src?: string | null): Mode {
  if (!src) return null
  const s = src.toLowerCase()
  if (s.includes('assist')) return 'assist'
  if (s.includes('auto')) return 'auto'
  if (s.includes('simulate')) return 'simulate'
  return null
}

export default async function CopilotDockPanel() {
  const supabase = createServerClient<Database>()

  // WICHTIG: nur existierende Spalten selektieren – KEIN "mode", KEIN "body"
  const { data, error } = await supabase
    .from('copilot_suggestions')
    .select('id, title, detail, prompt, source, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    return (
      <div className="sticky top-6 bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">CoPilot Pro</h3>
          <span className="text-xs text-muted-foreground">Docked</span>
        </div>
        <p className="text-sm text-muted-foreground">Keine Vorschläge verfügbar.</p>
      </div>
    )
  }

  type RowPick = Pick<
    Tables<'copilot_suggestions'>,
    'id' | 'title' | 'detail' | 'prompt' | 'source' | 'created_at'
  >

  const rows = (data ?? []) as RowPick[]

  const suggestions: UISuggestion[] = rows.map((r) => ({
    id: String(r.id),
    title: r.title ?? null,
    body:
      (typeof r.detail === 'string' && r.detail.length ? r.detail : null) ??
      (typeof r.prompt === 'string' && r.prompt.length ? r.prompt : null),
    mode: parseModeFromSource((r as any).source ?? null),
    created_at: r.created_at,
  }))

  return (
    <div className="sticky top-6 bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">CoPilot Pro</h3>
        <span className="text-xs text-muted-foreground">Docked</span>
      </div>
      <CopilotDockPanelClient initialSuggestions={suggestions} />
    </div>
  )
}
