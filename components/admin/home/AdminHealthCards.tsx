// components/admin/home/AdminHealthCards.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { cn } from '@/lib/utils'

const TABLES_TO_CHECK = [
  'creator_sessions',
  'creator_uploads',
  'creator_session_metrics',
  'blog_comments',
  'copilot_suggestions',
  'creator_alert_rules',
  'creator_alert_events',
  'payments',
  'payouts',
] as const

type Row = { table_name: string; rls_enabled: boolean; policy_count: number }

export default async function AdminHealthCards() {
  const supabase = createServerComponentClient<Database>()

  // --- RPC ohne `.catch()`; robust gegen unterschiedliche Return-Formate
  let rows: Row[] = []
  try {
    const res = await (supabase as any).rpc('admin_security_overview', {
      tables: TABLES_TO_CHECK as any,
    })
    const payload = res?.data
    if (payload) rows = (Array.isArray(payload) ? payload : [payload]) as Row[]
  } catch {
    rows = []
  }

  const rlsOff = rows.filter((r) => !r.rls_enabled).length
  const policySum = rows.reduce((s, r) => s + (r.policy_count || 0), 0)

  const items = [
    {
      label: 'RLS aktiv',
      value: `${rows.length - rlsOff}/${rows.length}`,
      hint: rlsOff ? `${rlsOff} Tabellen ohne RLS` : 'Alle Tabellen geschützt',
      ok: rlsOff === 0,
    },
    {
      label: 'Policy-Abdeckung',
      value: String(policySum),
      hint: 'Summe aller Policies',
      ok: policySum > 0,
    },
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Security & Health</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-border p-4 bg-background">
            <p className="text-sm text-muted-foreground">{it.label}</p>
            <p className="mt-1 text-2xl font-semibold">{it.value}</p>
            <p className={cn('text-xs mt-1', it.ok ? 'text-emerald-600' : 'text-amber-600')}>
              {it.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
