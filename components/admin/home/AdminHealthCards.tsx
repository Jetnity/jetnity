// components/admin/home/AdminHealthCards.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import AdminEvidenceDetails from './AdminEvidenceDetails'

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
          label: 'RLS-Regeln',
          value: '–',
          hint: 'Keine Auskunft erhalten',
          ok: false,
        },
      ]
    : [
        {
          label: 'RLS aktiv',
          value: `${rows.length - ohneRls}/${rows.length}`,
          hint: ohneRls ? `${ohneRls} Tabellen ohne RLS` : 'Im gelesenen Katalog aktiv',
          ok: ohneRls === 0,
        },
        {
          label: 'RLS-Regeln',
          value: String(policies),
          hint: 'Anzahl hinterlegter Regeln',
          ok: false,
        },
      ]

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Security · Datenzugriff</h3>
        <Link href="/admin/security" className="text-xs underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Security öffnen</Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {karten.map((karte) => (
          <div key={karte.label} className="min-w-0 rounded-xl border border-border bg-background p-3 sm:p-4">
            <p className="text-sm text-muted-foreground">{karte.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{karte.value}</p>
            <p className={cn('text-xs mt-1', karte.ok ? 'text-foreground' : 'text-muted-foreground')}>
              {karte.hint}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <AdminEvidenceDetails label="Datenqualität & Nachweis · Security">
          <p>{ADMIN_EHRLICHE_TEXTE.rlsKatalogHinweis}</p>
          <p>Aktiviertes RLS und die Anzahl der Regeln belegen nicht deren Wirksamkeit. Security-Ereignisse werden nicht vollständig erfasst; die IP-Blockliste wird derzeit nicht durchgesetzt.</p>
        </AdminEvidenceDetails>
      </div>
    </div>
  )
}
