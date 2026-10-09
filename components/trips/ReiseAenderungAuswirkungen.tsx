'use client'
import * as React from 'react'
import { auswirkungen, type Auswirkungsgruppe } from '@/lib/reiseaenderung/direct/auswirkungen'
import { workspaceEditFocus } from '@/lib/trips/workspace-edit-focus'
import type { Trip } from '@/types/trips'

function Gruppe({ gruppe }: { gruppe: Auswirkungsgruppe }) {
  const [offen, setOffen] = React.useState(false)
  const [seite, setSeite] = React.useState(0)
  const summary = React.useRef<HTMLElement>(null)
  const page = (next: number) => { setSeite(next); requestAnimationFrame(() => workspaceEditFocus(summary.current)) }
  if (!gruppe.zeilen.length) return null
  const limit = 20, count = gruppe.zeilen.length
  return <details className="min-w-0 rounded-2xl border border-line-200 p-4" open={offen} onToggle={e => setOffen(e.currentTarget.open)}>
    <summary ref={summary} className="min-h-11 cursor-pointer font-semibold text-brand-900 focus-visible:outline focus-visible:outline-2">{gruppe.titel} ({count})</summary>
    {offen && <>
      <ul className="mt-3 grid gap-3 text-sm leading-6 [overflow-wrap:anywhere]">{gruppe.zeilen.slice(seite * limit, (seite + 1) * limit).map(row => <li key={row.id}>{row.text}</li>)}</ul>
      {count > limit && <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="min-h-11 rounded-xl border px-3" disabled={!seite} onClick={() => page(seite - 1)}>Vorherige Einträge</button>
        <span aria-live="polite">{seite * limit + 1}–{Math.min((seite + 1) * limit, count)} von {count}</span>
        <button type="button" className="min-h-11 rounded-xl border px-3" disabled={(seite + 1) * limit >= count} onClick={() => page(seite + 1)}>Weitere Einträge</button>
      </div>}
    </>}
  </details>
}
export default function ReiseAenderungAuswirkungen({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const gruppen = React.useMemo(() => auswirkungen(vorher, nachher), [vorher, nachher])
  return <section className="grid min-w-0 gap-3" aria-label="Vollständige Auswirkungen">
    <p className="text-sm leading-6">Diese Änderungen würden nach deiner Bestätigung übernommen. Öffne die Gruppen für alle betroffenen Einträge. Buchungen werden weder umgebucht noch storniert; offene Vorbereitungen bleiben offen.</p>
    <p className="rounded-xl bg-surface-100 p-3 text-sm leading-6">{gruppen.filter(g => g.zeilen.length).length} Gruppen mit Auswirkungen. Jeder betroffene Eintrag ist über die Gruppen erreichbar; höchstens 20 Einträge pro Seite.</p>
    {gruppen.map(g => <Gruppe key={g.titel} gruppe={g} />)}
  </section>
}
