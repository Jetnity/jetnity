'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { WeltZustandProbe } from '@/components/account/WeltZustaende'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import { WELT_ZUSTAND_TEXT, type WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import { geplanteAussage, weltLeereOrteText, type ReiseFenster } from '@/lib/account/account-home-export-1/fenster'
import { SeiteNeuLaden } from '@/components/account/account-home-export-1/ReiseFensterHinweis'
import type { WorldMapAbleitung } from '@/lib/account/world-map'
import { WORLD_MAP_GRUNDKARTE_HINWEIS } from '@/lib/account/world-map-ansicht'
import { explorerRecords, filterRecords, positionText, recordStatus, type ExplorerFilter } from '@/lib/account/world-explorer-1/presentation'
import ExplorerMap from './ExplorerMap'
import ExplorerDetails from './ExplorerDetails'

const FILTERS = [['alle', 'Alle'], ['besucht', 'Besucht'], ['geplant', 'Geplant'], ['beides', 'Beides']] as const
const PAGE_SIZE = 24

export default function WorldExplorer({ welt, besucht, laender, aktion, fenster, neuLadenHref }: {
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
  aktion?: { href: Route; text: string } | null
  fenster?: ReiseFenster | null
  neuLadenHref?: '/account' | '/account/welt'
}) {
  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const returnFocus = useRef<HTMLElement | SVGElement | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ExplorerFilter>('alle')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [selection, setSelection] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const records = useMemo(() => explorerRecords(welt, besucht, laender), [welt, besucht, laender])
  const matches = useMemo(() => filterRecords(records, query, filter), [records, query, filter])
  const selected = matches.find((record) => record.id === selection) ?? null
  // Invalidate removed/revoked or newly hidden records before rendering details.
  // Conditional render-time adjustment avoids a stale-history frame after new props.
  if (selection && !selected) {
    setSelection(null)
    setNotice(records.some((record) => record.id === selection)
      ? 'Die Auswahl ist durch Suche oder Filter ausgeblendet. Wähle einen sichtbaren Eintrag.'
      : 'Der ausgewählte Eintrag ist nicht mehr verfügbar. Die Details wurden geschlossen.')
  }
  const country = selected?.code ? records.find((r) => r.art === 'land' && r.code === selected.code) ?? null : null
  const flaechen = matches.flatMap((r) => r.flaeche ? [r.flaeche] : [])
  const partial = welt.lage === 'fehler' || besucht.lage === 'fehler'
  function choose(value: string) {
    const trigger = document.activeElement
    returnFocus.current = trigger instanceof HTMLElement || trigger instanceof SVGElement ? trigger : null
    setSelection(value)
    setNotice(null)
    requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true })
      if (window.matchMedia('(min-width: 768px)').matches) titleRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    })
  }
  function close() {
    setSelection(null)
    const target = returnFocus.current?.isConnected ? returnFocus.current : searchRef.current
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }
  return <section aria-labelledby={`${id}-titel`} data-world-map="ein" data-world-map-darstellung="atlas" data-world-map-lage={welt.lage} data-world-map-visited={besucht.lage} data-world-map-search="ja"
    className="jetnity-atlas">
    <h2 id={`${id}-titel`} className="sr-only">Persönlicher Reiseatlas</h2>
    <div className="jetnity-atlas-summary" data-explorer-totals>
      {besucht.lage !== 'fehler' ? <span><strong>{besucht.kennzahlen.laender}</strong> {besucht.kennzahlen.laender === 1 ? 'Land besucht' : 'Länder besucht'}</span> : null}
      {welt.lage !== 'fehler' ? <span>Geplant · {geplanteAussage({ fenster, lage: welt.lage, kennzahl: welt.geplantKennzahl, leertext: welt.leerText, leerStattKennzahl: false })}</span> : null}
    </div>
    {fenster?.lage === 'grenze' ? <p className="mt-1 text-sm text-ink-800">Die geplanten Ziele stammen aus deinen {fenster.anzahl} zuletzt geänderten Reisen. <Link href="/reisen" className="underline">Alle Reisen</Link></p> : null}
    {besucht.fehlerText ? <div role="alert" className="mt-3 rounded-xl bg-surface-75 p-3 text-sm text-ink-950"><p>{besucht.fehlerText}</p>{neuLadenHref ? <SeiteNeuLaden href={neuLadenHref} /> : null}</div> : null}
    {welt.lage === 'fehler' ? <p role="alert" className="mt-3 rounded-xl bg-surface-75 p-3 text-sm text-ink-950">{welt.fehlerText} Der Planungsstand ist unbekannt.</p> : null}
    <div className="jetnity-atlas-tools">
      <label htmlFor={`${id}-suche`} className="sr-only">Länder und Orte in deinem Konto suchen</label>
      <div className="jetnity-atlas-search">
        <Search className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <input ref={searchRef} id={`${id}-suche`} type="search" maxLength={120} value={query} autoComplete="off" spellCheck={false} aria-describedby={`${id}-anzahl`}
          onChange={(e) => { setQuery(e.target.value.slice(0, 120)); setLimit(PAGE_SIZE) }} className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none [&::-webkit-search-cancel-button]:hidden" placeholder="Land oder Ort suchen" />
        {query ? <button type="button" aria-label="Suche leeren" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setQuery(''); setLimit(PAGE_SIZE); searchRef.current?.focus() }}><X size={18} aria-hidden /></button> : null}
      </div>
      <div role="group" aria-label="Einträge filtern" className="jetnity-atlas-filters">
        {FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); setLimit(PAGE_SIZE) }}>{label}</button>)}
      </div>
    </div>
    <p id={`${id}-anzahl`} role="status" className={query || filter !== 'alle' ? 'mt-2 text-sm text-ink-800' : 'sr-only'}>{matches.length} Treffer{partial ? ' in den verfügbaren Daten' : ''}</p>
    {partial && filter === 'beides' ? <p role="status" className="mt-2 text-sm text-ink-800">Die Schnittmenge ist bei unvollständigen Daten unbekannt.</p> : null}
    {notice ? <p role="status" className="mt-2 text-sm text-ink-800">{notice}</p> : null}
    <div className="jetnity-atlas-board" data-selected={!!selected}>
      <div className="min-w-0">
        <ExplorerMap records={matches} flaechen={flaechen} selected={selection} onSelect={choose} />
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{(['besucht', 'geplant', 'beides'] as const).map((zustand) => <li key={zustand} className="flex items-center gap-2 text-xs text-brand-800"><WeltZustandProbe zustand={zustand} />{WELT_ZUSTAND_TEXT[zustand]}</li>)}</ul>
      </div>
      <ExplorerDetails id={`${id}-details`} record={selected} country={country} welt={welt} besucht={besucht} titleRef={titleRef} onClose={close} />
    </div>
    <div className="mt-6 border-t border-line-200 pt-5" data-explorer-results>
      <h3 className="text-base font-semibold text-brand-800">Deine Länder und Orte</h3>
      {matches.length === 0 ? <p className="mt-3 text-sm leading-6 text-ink-800">{partial && filter === 'beides' ? 'Die Schnittmenge ist bei unvollständigen Daten unbekannt.' : records.length === 0 && !query ? (partial ? 'Gerade keine lesbaren Einträge verfügbar.' : weltLeereOrteText(fenster)) : 'Keine passenden Einträge. Ändere die Suche oder den Filter.'}</p> : null}
      <ul className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {matches.slice(0, limit).map((r) => <li key={r.id} className="min-w-0"><button type="button" data-explorer-result={r.id} aria-current={selection === r.id ? 'true' : undefined} aria-controls={`${id}-details`} onClick={() => choose(r.id)} className={`flex min-h-11 w-full min-w-0 gap-2 rounded-2xl border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selection === r.id ? 'border-brand-700 bg-surface-100' : 'border-line-200 bg-surface-0 hover:bg-surface-50'}`}>
          <WeltZustandProbe zustand={r.zustand} alsPunkt={!!r.flaeche?.punkt} /><span className="min-w-0 break-words text-sm leading-5"><span className="block font-semibold text-brand-800">{r.label}{r.art === 'land' ? ` (${r.code})` : ''}</span><span className="block text-ink-800">{r.art === 'land' ? 'Land' : r.landLabel ?? 'Kein gespeicherter Ländercode'} · {recordStatus(r)}</span>{r.besuch ? <span className="block text-xs text-ink-800">{r.besuch.zeitText}{r.besuch.wiederholungText ? ` · ${r.besuch.wiederholungText}` : ''}</span> : null}{positionText(r) ? <span className="block text-xs text-ink-800">{positionText(r)}</span> : null}</span>
        </button></li>)}
      </ul>
      {matches.length > limit ? <button type="button" className="mt-3 min-h-11 rounded-full border border-line-300 px-5 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setLimit((v) => v + PAGE_SIZE)}>Weitere Einträge zeigen ({Math.min(limit, matches.length)} von {matches.length} sichtbar)</button> : null}
    </div>
    <details data-world-map-herkunft="ein" className="mt-5 space-y-2 border-t border-line-100 pt-3 text-xs leading-5 text-ink-800">
      <summary className="cursor-pointer font-semibold">Kartenquellen und Hinweise</summary>
      {laender.ohneFlaeche.length ? <p>Kleine Länder erscheinen auf der Karte als Punkte. Einträge ohne Kartenposition findest du in der Liste.</p> : null}
      {besucht.ohneLandHinweis ? <p>{besucht.ohneLandHinweis}</p> : null}
      <p>{WORLD_MAP_GRUNDKARTE_HINWEIS} Relief und Länderbeschriftung aus Natural Earth.</p>
    </details>
    {aktion ? <Link href={aktion.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline">{aktion.text}</Link> : null}
  </section>
}
