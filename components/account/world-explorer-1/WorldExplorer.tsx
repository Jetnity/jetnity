'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { WeltZustandProbe } from '@/components/account/WeltZustaende'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import { WELT_ZUSTAND_TEXT, type WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import { geplanteAussage, weltLeereOrteText, type ReiseFenster } from '@/lib/account/account-home-export-1/fenster'
import { ReiseFensterHinweis, SeiteNeuLaden } from '@/components/account/account-home-export-1/ReiseFensterHinweis'
import type { WorldMapAbleitung } from '@/lib/account/world-map'
import { WORLD_MAP_GRUNDKARTE_HINWEIS } from '@/lib/account/world-map-ansicht'
import { explorerRecords, filterRecords, positionText, recordStatus, type ExplorerFilter } from '@/lib/account/world-explorer-1/presentation'
import ExplorerMap from './ExplorerMap'
import ExplorerDetails from './ExplorerDetails'

const FILTERS = [['alle', 'Alle'], ['besucht', 'Besucht'], ['geplant', 'Geplant'], ['beides', 'Beides']] as const
const PAGE_SIZE = 24

export default function WorldExplorer({ welt, besucht, laender, aktion, reichweiteText, fenster, neuLadenHref }: {
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
  aktion?: { href: Route; text: string } | null
  reichweiteText?: string
  fenster?: ReiseFenster | null
  neuLadenHref?: '/account' | '/account/welt'
}) {
  const id = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
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
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelection(value)
    setNotice(null)
    requestAnimationFrame(() => {
      titleRef.current?.focus({ preventScroll: true })
      titleRef.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
    })
  }
  function close() {
    setSelection(null)
    const target = returnFocus.current?.isConnected ? returnFocus.current : searchRef.current
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }
  return <section aria-labelledby={`${id}-titel`} data-world-map="ein" data-world-map-darstellung="atlas" data-world-map-lage={welt.lage} data-world-map-visited={besucht.lage} data-world-map-search="ja"
    className="relative mt-8 rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_22px_60px_rgba(15,46,42,0.08)] sm:p-8 lg:left-1/2 lg:w-[min(90rem,calc(100cqw-4rem))] lg:-translate-x-1/2">
    <style>{'@media (min-width: 1024px) { html:has([data-world-map-darstellung="atlas"]) { container-type: inline-size; } }'}</style>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Reisen im Überblick</p>
    <h2 id={`${id}-titel`} className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-3xl">{welt.titel}</h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-800">{welt.unterscheidung}</p>
    <div className="mt-4 rounded-2xl bg-surface-50 p-4" data-explorer-totals>
      {fenster ? <ReiseFensterHinweis fenster={fenster} neuLadenHref={neuLadenHref} /> : null}
      <p className="text-xs font-semibold text-brand-800">{reichweiteText ?? 'Gesamt in deinem Konto · unabhängig von Suche und Filter'}</p>
      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-800">
        <li className="flex items-center gap-2"><WeltZustandProbe zustand="besucht" /><span><strong>Besucht:</strong> {besucht.kurz}</span></li>
        <li className="flex items-center gap-2"><WeltZustandProbe zustand="geplant" /><span><strong>Geplant:</strong> {welt.lage === 'fehler' ? 'Gerade nicht lesbar' : geplanteAussage({ fenster, lage: welt.lage, kennzahl: welt.geplantKennzahl, leertext: welt.leerText, leerStattKennzahl: false })}</span></li>
      </ul>
    </div>
    {besucht.fehlerText ? <div role="alert" className="mt-3 rounded-xl bg-surface-75 p-3 text-sm text-ink-950"><p>{besucht.fehlerText}</p>{neuLadenHref ? <SeiteNeuLaden href={neuLadenHref} /> : null}</div> : null}
    {welt.lage === 'fehler' ? <p role="alert" className="mt-3 rounded-xl bg-surface-75 p-3 text-sm text-ink-950">{welt.fehlerText} Der Planungsstand ist unbekannt.</p> : null}
    <div className="mt-6">
      <label htmlFor={`${id}-suche`} className="text-sm font-semibold text-brand-800">Länder und Orte in deinem Konto suchen</label>
      <div className="mt-2 flex max-w-2xl items-center gap-2 rounded-2xl border border-line-300 px-3 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
        <input ref={searchRef} id={`${id}-suche`} type="search" maxLength={120} value={query} autoComplete="off" spellCheck={false} aria-describedby={`${id}-suchhilfe ${id}-anzahl`}
          onChange={(e) => { setQuery(e.target.value.slice(0, 120)); setLimit(PAGE_SIZE) }} className="min-h-12 min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none [&::-webkit-search-cancel-button]:hidden" placeholder="Zum Beispiel Portugal oder Lissabon" />
        {query ? <button type="button" aria-label="Suche leeren" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => { setQuery(''); setLimit(PAGE_SIZE); searchRef.current?.focus() }}><X size={18} aria-hidden /></button> : null}
      </div>
      <p id={`${id}-suchhilfe`} className="mt-2 max-w-3xl text-xs leading-5 text-ink-800">Nur vorhandene Kontoeinträge. Länder zeigen ihre passenden Orte; Ortstreffer zeigen auch ihr gespeichertes Land. „Beides“ zeigt Länder mit Besuchen und Reiseplänen – keinen Nachweis für einen Besuch jedes geplanten Ortes.</p>
      <div role="group" aria-label="Einträge filtern" className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); setLimit(PAGE_SIZE) }} className={`min-h-11 rounded-full border px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${filter === key ? 'border-brand-800 bg-brand-800 text-white' : 'border-line-200 bg-surface-0 text-brand-800 hover:bg-surface-100'}`}>{label}</button>)}
      </div>
      <p id={`${id}-anzahl`} role="status" className="mt-3 text-sm text-ink-800">{matches.length} Treffer{partial ? ' in den verfügbaren Daten' : ''} · {matches.filter((r) => r.art === 'land').length} Länder · {matches.filter((r) => r.art !== 'land').length} Einträge</p>
      {partial ? <p className="mt-2 text-sm text-ink-800">Eine Quelle ist nicht lesbar. „Beides“ ist deshalb nicht bestimmbar; verfügbare Besuche oder Pläne bleiben unter dem jeweiligen Filter sichtbar.</p> : null}
      {notice ? <p role="status" className="mt-2 text-sm text-ink-800">{notice}</p> : null}
    </div>
    <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
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
    <div data-world-map-herkunft="ein" className="mt-5 space-y-2 border-t border-line-100 pt-3 text-xs leading-5 text-ink-800">
      {laender.ohneFlaeche.length ? <p>Kleine Länder erscheinen als Ring, sofern eine Kartenposition vorhanden ist. Einträge ohne Kartenposition bleiben in der Liste erreichbar.</p> : null}
      {besucht.ohneLandHinweis ? <p>{besucht.ohneLandHinweis}</p> : null}
      <p>{WORLD_MAP_GRUNDKARTE_HINWEIS}</p><p>{besucht.text}</p>
    </div>
    {aktion ? <Link href={aktion.href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline">{aktion.text}</Link> : null}
  </section>
}
