'use client'
import * as React from 'react'
import { auswirkungen, type Auswirkungsgruppe } from '@/lib/reiseaenderung/direct/auswirkungen'
import { workspaceEditFocus } from '@/lib/trips/workspace-edit-focus'
import type { Trip } from '@/types/trips'

const seitenknopf = 'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-line-300 bg-white px-3 text-sm font-semibold text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800 disabled:opacity-50 sm:w-auto'

function Gruppe({ gruppe }: { gruppe: Auswirkungsgruppe }) {
  const [offen, setOffen] = React.useState(false)
  const [seite, setSeite] = React.useState(0)
  const summary = React.useRef<HTMLElement>(null)
  const page = (next: number) => { setSeite(next); requestAnimationFrame(() => workspaceEditFocus(summary.current)) }
  if (!gruppe.zeilen.length) return null
  const limit = 20, count = gruppe.zeilen.length
  return (
    <details className="min-w-0 rounded-2xl border border-line-200 bg-white p-4" open={offen} onToggle={e => setOffen(e.currentTarget.open)}>
      <summary ref={summary} className="min-h-11 cursor-pointer break-words rounded-lg py-2 font-semibold leading-6 text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-800">
        {gruppe.titel} ({count})
      </summary>
      {offen && <>
        <ul className="mt-3 grid min-w-0 gap-3 text-sm leading-6 text-ink-900 [overflow-wrap:anywhere]">
          {gruppe.zeilen.slice(seite * limit, (seite + 1) * limit).map(row => (
            <li key={row.id} className="min-w-0 break-words rounded-xl bg-surface-25 px-3 py-3">{row.text}</li>
          ))}
        </ul>
        {count > limit && (
          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" className={seitenknopf} disabled={!seite} onClick={() => page(seite - 1)}>Vorherige Einträge</button>
            <span aria-live="polite" className="break-words text-sm leading-6 text-ink-800">{seite * limit + 1}–{Math.min((seite + 1) * limit, count)} von {count}</span>
            <button type="button" className={seitenknopf} disabled={(seite + 1) * limit >= count} onClick={() => page(seite + 1)}>Weitere Einträge</button>
          </div>
        )}
      </>}
    </details>
  )
}

export default function ReiseAenderungAuswirkungen({ vorher, nachher }: { vorher: Trip; nachher: Trip }) {
  const gruppen = React.useMemo(() => auswirkungen(vorher, nachher), [vorher, nachher])
  const sichtbar = gruppen.filter(g => g.zeilen.length).length
  return (
    <section className="grid min-w-0 gap-4" aria-label="Vollständige Auswirkungen">
      <div className="min-w-0">
        <h3 className="break-words text-base font-semibold leading-6 text-brand-900 sm:text-lg">Was ändert sich in deiner Reise?</h3>
        <p className="mt-2 max-w-prose break-words text-sm leading-6 text-ink-800">
          Diese Änderungen würden nach deiner Bestätigung übernommen. Öffne die Gruppen für alle betroffenen Einträge. Buchungen werden weder umgebucht noch storniert; offene Vorbereitungen bleiben offen.
        </p>
      </div>
      <p className="min-w-0 break-words rounded-xl bg-surface-100 p-3 text-sm leading-6 text-ink-900">
        {sichtbar} Gruppen mit Auswirkungen. Jeder betroffene Eintrag steht in einer Gruppe. Pro Seite siehst du höchstens 20 Einträge.
      </p>
      {gruppen.map(g => <Gruppe key={g.titel} gruppe={g} />)}
    </section>
  )
}
