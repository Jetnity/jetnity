// components/admin/SecurityWidget.tsx
import { createServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

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

export default async function SecurityWidget() {
  const supabase = createServerClient<Database>()
  // RPC ist nicht in den generierten Typen → any
  const { data, error } = await (supabase as any).rpc('admin_security_overview', {
    tables: TABLES_TO_CHECK as any,
  })

  if (error) {
    return (
      <div className="rounded-xl border border-destructive p-4 text-sm">
        <p className="font-medium text-destructive">Security RPC fehlt/fehlerhaft.</p>
        <p className="text-muted-foreground">Bitte Funktion `admin_security_overview(text[])` prüfen.</p>
      </div>
    )
  }

  const rows = (data ?? []) as Row[]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr>
            <th className="py-2 pr-4">Tabelle</th>
            <th className="py-2 pr-4">RLS</th>
            <th className="py-2 pr-4">Policies</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.table_name} className="border-t border-border">
              <td className="py-2 pr-4 font-medium">{r.table_name}</td>
              <td className="py-2 pr-4">
                {r.rls_enabled ? (
                  <span className="inline-flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-emerald-500">aktiv</span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-amber-500">inaktiv</span>
                )}
              </td>
              <td className="py-2 pr-4">{r.policy_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
