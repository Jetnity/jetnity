'use client'
import * as React from 'react'
import { auswirkungen, type Auswirkungsgruppe } from '@/lib/reiseaenderung/direct/auswirkungen'
import { workspaceEditFocus } from '@/lib/trips/workspace-edit-focus'
import type { Trip } from '@/types/trips'

const seitenknopf = 'inline-flex min-h-11 w-full items-center justify-center rounded-full border border-input bg-background px-4 text-body font-semibold text-foreground motion-safe:active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

function Gruppe({ gruppe }: { gruppe: Auswirkungsgruppe }) {
  const [offen, setOffen] = React.useState(false)
  const [seite, setSeite] = React.useState(0)
  const summary = React.useRef<HTMLElement>(null)
  const page = (next: number) => { setSeite(next); requestAnimationFrame(() => workspaceEditFocus(summary.current)) }
  if (!gruppe.zeilen.length) return null
  const limit = 20, count = gruppe.zeilen.length
  return (
    <details className="min-w-0 rounded-card border border-border bg-card p-4 shadow-none" open={offen} onToggle={e => setOffen(e.currentTarget.open)}>
      <summary ref={summary} className="min-h-11 cursor-pointer break-words rounded-control py-2 text-subtitle text-card-foreground outline-none motion-safe:active:translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {gruppe.titel} ({count})
      </summary>
      {offen && <>
        <ul className="mt-3 grid min-w-0 gap-3 text-body text-card-foreground [overflow-wrap:anywhere]">
          {gruppe.zeilen.slice(seite * limit, (seite + 1) * limit).map(row => (
            <li key={row.id} className="min-w-0 break-words rounded-control bg-muted px-3 py-3">{row.text}</li>
          ))}
        </ul>
        {count > limit && (
          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" className={seitenknopf} disabled={!seite} onClick={() => page(seite - 1)}>Vorherige Einträge</button>
            <span aria-live="polite" className="break-words text-meta text-muted-foreground">{seite * limit + 1}–{Math.min((seite + 1) * limit, count)} von {count}</span>
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
        <h3 className="break-words text-title text-foreground">Was ändert sich in deiner Reise?</h3>
        <p className="mt-2 max-w-prose break-words text-body text-muted-foreground">
          Diese Änderungen würden nach deiner Bestätigung übernommen. Öffne die Gruppen für alle betroffenen Einträge. Buchungen werden weder umgebucht noch storniert; offene Vorbereitungen bleiben offen.
        </p>
      </div>
      <p className="min-w-0 break-words rounded-control bg-muted p-3 text-meta text-foreground">
        {sichtbar} Gruppen mit Auswirkungen. Jeder betroffene Eintrag steht in einer Gruppe. Pro Seite siehst du höchstens 20 Einträge.
      </p>
      {gruppen.map(g => <Gruppe key={g.titel} gruppe={g} />)}
    </section>
  )
}
