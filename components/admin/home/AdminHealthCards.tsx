// components/admin/home/AdminHealthCards.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { cn } from '@/lib/utils'

type Row = Database['public']['Functions']['admin_security_overview']['Returns'][number]

export default async function AdminHealthCards() {
  const supabase = await createServerComponentClient<Database>()
  const { data, error } = await supabase.rpc('admin_security_overview')

  const rows: Row[] = data ?? []
  // Ohne Zeilen lässt sich nichts aussagen. Bis Phase 1.4 zeigte die Karte in
  // genau diesem Fall „0/0 – alle Tabellen geschützt".
  const unbekannt = error !== null || rows.length === 0

  const ohneRls = rows.filter((r) => !r.rls_enabled).length
  const policies = rows.reduce((summe, r) => summe + r.policy_count, 0)

  const karten = unbekannt
    ? [
        {
          label: 'RLS aktiv',
          value: '–',
          hint: error ? 'Abfrage fehlgeschlagen' : 'Keine Auskunft erhalten',
          ok: false,
        },
        {
          label: 'Policy-Abdeckung',
          value: '–',
          hint: 'Keine Auskunft erhalten',
          ok: false,
        },
      ]
    : [
        {
          label: 'RLS aktiv',
          value: `${rows.length - ohneRls}/${rows.length}`,
          hint: ohneRls ? `${ohneRls} Tabellen ohne RLS` : 'Alle Tabellen geschützt',
          ok: ohneRls === 0,
        },
        {
          label: 'Policy-Abdeckung',
          value: String(policies),
          hint: 'Summe aller Policies',
          ok: policies > 0,
        },
      ]

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{ADMIN_EHRLICHE_TEXTE.rlsKatalogTitel}</h2>
      <p className="mb-3 text-sm text-muted-foreground">{ADMIN_EHRLICHE_TEXTE.rlsKatalogHinweis}</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {karten.map((karte) => (
          <div key={karte.label} className="rounded-xl border border-border p-4 bg-background">
            <p className="text-sm text-muted-foreground">{karte.label}</p>
            <p className="mt-1 text-2xl font-semibold">{karte.value}</p>
            <p className={cn('text-xs mt-1', karte.ok ? 'text-emerald-600' : 'text-amber-600')}>
              {karte.hint}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
