// app/(admin)/admin/copilot/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import CopilotPanel from '@/components/admin/copilot/CopilotPanel'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Zählt Einträge in einer Tabelle – absichtlich sehr tolerant typisiert,
 * damit keine TS-Generics kollidieren (unabhängig vom lokalen Database-Types Stand).
 */
async function safeCount(
  sb: SupabaseClient<any>,
  table: string,
  filter?: (q: any) => any
): Promise<number> {
  try {
    let q = sb.from(table as any).select('id', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count } = await q
    return count ?? 0
  } catch {
    return 0
  }
}

export default async function CopilotPage() {
  // Admin-Gate
  await requireAdmin()

  const sb = createServerComponentClient() as unknown as SupabaseClient<any>

  // Sanfte KPIs (nichts bricht, falls Tabellen fehlen)
  const [users, media, jobsQueued, secAlerts, refundsOpen] = await Promise.all([
    safeCount(sb, 'creator_profiles'),
    safeCount(sb, 'session_media'),
    safeCount(sb, 'render_jobs', (q) => q.eq('status', 'queued')),
    safeCount(
      sb,
      'security_events',
      (q) => q.gte('created_at', new Date(Date.now() - 24 * 3600e3).toISOString())
    ),
    safeCount(sb, 'payments', (q) => q.eq('refund_status', 'requested')),
  ])

  const cards = [
    { label: 'Users', value: users },
    { label: 'Media Assets', value: media },
    { label: 'Jobs (queued)', value: jobsQueued },
    { label: 'Security Alerts (24h)', value: secAlerts },
    { label: 'Refunds open', value: refundsOpen },
  ]

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CoPilot Pro Zentrale</h1>
          <p className="text-sm text-muted-foreground">Assist • Auto • Simulate</p>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-card p-4">
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">
              {Number.isFinite(c.value) ? c.value.toLocaleString('de-CH') : '0'}
            </div>
          </div>
        ))}
      </section>

      {/* CoPilot UI (Aktionen, Vorschläge, Simulationen) */}
      <CopilotPanel />
    </main>
  )
}
