'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import {
  ENTDECKEN_ZIELE, THEMEN, SUCHLAENGE, entdeckerHref, entdeckerParams, entdeckerTreffer,
  type EntdeckenZustand,
} from '@/lib/inspiration/explorer-1/katalog'
import Inspirationskarte from './Inspirationskarte'

export default function InspirationExplorer({ initial }: { initial: EntdeckenZustand }) {
  const [zustand, setZustand] = useState(initial)
  const schreibt = useRef(false)
  const suche = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const lesen = () => {
      const params = new URLSearchParams(window.location.search)
      setZustand(entdeckerParams({ q: params.getAll('q'), thema: params.getAll('thema') }))
      schreibt.current = false
    }
    // Gleiche Bereinigung wie beim Server; keine Navigation/Netzwerk-Anfrage.
    window.history.replaceState(null, '', entdeckerHref(initial))
    window.addEventListener('popstate', lesen)
    return () => window.removeEventListener('popstate', lesen)
  }, [initial])

  function aendern(neu: EntdeckenZustand, ersetzen = false) {
    setZustand(neu)
    const href = entdeckerHref(neu)
    if (href !== `${window.location.pathname}${window.location.search}`) {
      window.history[ersetzen ? 'replaceState' : 'pushState'](null, '', href)
    }
  }

  const treffer = entdeckerTreffer(zustand)
  const gefiltert = Boolean(zustand.q || zustand.thema !== 'alle')
  const reset = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    schreibt.current = false
    aendern({ q: '', thema: 'alle' })
    suche.current?.focus()
  }

  return (
    <div>
      <form action="/entdecken" method="get" role="search" aria-label="Reiseinspiration suchen"
        className="rounded-[28px] border border-line-200 bg-surface-0 p-5 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault()
          schreibt.current = false
          aendern(entdeckerParams(zustand), true)
        }}>
        <label htmlFor="entdecken-suche" className="block text-sm font-semibold">Wohin zieht es dich?</label>
        <p id="entdecken-suchhilfe" className="mt-1 text-sm leading-6 text-ink-950">Suche nach Ziel, Land oder einer Idee, zum Beispiel „Museen“.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-[1_1_260px]">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-ink-900" aria-hidden="true" />
            <input ref={suche} id="entdecken-suche" name="q" type="search" value={zustand.q} maxLength={SUCHLAENGE}
              aria-describedby="entdecken-suchhilfe" autoComplete="off"
              className="min-h-12 w-full min-w-0 rounded-2xl border border-line-400 bg-surface-0 py-3 pl-12 pr-4 text-base text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              onChange={(event) => {
                aendern({ ...zustand, q: event.target.value.slice(0, SUCHLAENGE) }, schreibt.current)
                schreibt.current = true
              }} onBlur={() => { schreibt.current = false }} />
          </div>
          <button type="submit" className="min-h-12 rounded-2xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">Suchen</button>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">Was möchtest du erleben?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {THEMEN.map((thema) => (
              <label key={thema.id} className="relative cursor-pointer">
                <input type="radio" name="thema" value={thema.id} checked={zustand.thema === thema.id}
                  className="peer sr-only" onChange={() => { schreibt.current = false; aendern({ ...zustand, thema: thema.id }) }} />
                <span className="flex min-h-11 items-center rounded-full border border-line-300 px-4 py-2 text-sm font-medium peer-checked:border-brand-800 peer-checked:bg-brand-800 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-brand-600">{thema.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="mt-4 text-xs leading-5 text-ink-950">Themen sind redaktionelle Anregungen. Die Auswahl umfasst {ENTDECKEN_ZIELE.length} Ziele.</p>
        <noscript><p className="mt-3 text-sm">Wähle ein Thema und bestätige mit „Suchen“, um die Auswahl zu aktualisieren.</p></noscript>
      </form>

      <section aria-labelledby="entdecken-ergebnisse" className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="entdecken-ergebnisse" className="text-xl font-semibold" aria-live="polite" aria-atomic="true">{treffer.length} von {ENTDECKEN_ZIELE.length} Zielen</h2>
          {gefiltert && <a href="/entdecken" onClick={reset} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">Suche & Themen zurücksetzen</a>}
        </div>
        {treffer.length ? (
          <ul className="mt-4 grid gap-5 md:grid-cols-2">
            {treffer.map((ziel, index) => <li key={ziel.placeId} className="min-w-0"><Inspirationskarte ziel={ziel} zuerst={index === 0} /></li>)}
          </ul>
        ) : (
          <div className="mt-4 rounded-[28px] border border-line-200 bg-surface-0 p-6 sm:p-9">
            <h3 className="text-2xl font-semibold">Noch keine passende Idee dabei</h3>
            <p className="mt-3 max-w-xl text-base leading-7 text-ink-950">In unserer kleinen Auswahl passt kein Ziel zu dieser Suche und diesem Thema. Versuche einen anderen Begriff oder zeige wieder alle vier Ziele.</p>
            <a href="/entdecken" onClick={reset} className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">Alle Ziele anzeigen</a>
          </div>
        )}
      </section>
    </div>
  )
}
