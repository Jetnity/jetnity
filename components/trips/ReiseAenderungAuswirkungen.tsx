'use client'
import * as React from 'react'
import { auswirkungen, type Auswirkungsgruppe } from '@/lib/reiseaenderung/direct/auswirkungen'
import type { Trip } from '@/types/trips'

function Gruppe({ gruppe }: { gruppe: Auswirkungsgruppe }) {
  const [offen, setOffen] = React.useState(false)
  const [seite, setSeite] = React.useState(0)
  if (!gruppe.zeilen.length) return null
  const limit = 20, count = gruppe.zeilen.length
  return <details className="min-w-0 rounded-2xl border border-line-200 p-4" open={offen} onToggle={e => setOffen(e.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer font-semibold text-brand-900 focus-visible:outline focus-visible:outline-2">{gruppe.titel} ({count})</summary>
    {offen && <>
      <ul className="mt-3 grid gap-3 text-sm leading-6 [overflow-wrap:anywhere]">{gruppe.zeilen.slice(seite * limit, (seite + 1) * limit).map(row => <li key={row.id}>{row.text}</li>)}</ul>
      {count > limit && <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className="min-h-11 rounded-xl border px-3" disabled={!seite} onClick={() => setSeite(s => s - 1)}>Vorherige Einträge</button>
        <span aria-live="polite">{seite * limit + 1}–{Math.min((seite + 1) * limit, count)} von {count}</span>
        <button type="button" className="min-h-11 rounded-xl border px-3" disabled={(seite + 1) * limit >= count} onClick={() => setSeite(s => s + 1)}>Weitere Einträge</button>
      </div>}
    </>}
  </details>
}
export default function ReiseAenderungAuswirkungen({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const gruppen = React.useMemo(() => auswirkungen(vorher, nachher), [vorher, nachher])
  return <div className="grid min-w-0 gap-3" aria-label="Vollständige Auswirkungen">
    <p className="text-sm leading-6">Diese Änderungen würden nach deiner Bestätigung übernommen. Öffne die Gruppen für alle betroffenen Einträge. Buchungen werden weder umgebucht noch storniert; offene Vorbereitungen bleiben offen.</p>
    {gruppen.map(g => <Gruppe key={g.titel} gruppe={g} />)}
  </div>
}
