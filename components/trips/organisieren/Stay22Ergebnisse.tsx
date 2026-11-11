'use client'

import { useEffect, useRef, useState } from 'react'
import { Columns2, List, Loader2, Map, MapPinned, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react'
import { stay22Rahmen, type Stay22Phase } from '@/lib/providers/stay22/rahmen'
import { stay22Ansicht, type Stay22Ansicht, type Stay22Suche } from '@/lib/providers/stay22/suche'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'

const ansichten = [
  { wert: 'all', text: 'Karte & Liste', Icon: Columns2 },
  { wert: 'listview', text: 'Liste', Icon: List },
  { wert: 'map', text: 'Karte', Icon: Map },
] as const

export default function Stay22Ergebnisse({ suche, schliessen }: { suche: Stay22Suche; schliessen: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const ergebnisse = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const groesseButton = useRef<HTMLButtonElement>(null)
  const [gross, setGross] = useState(false)
  const [ansicht, setAnsicht] = useState<Stay22Ansicht>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches ? 'listview' : 'all')
  const [phase, setPhase] = useState<Stay22Phase>('laedt')
  const [versuch, setVersuch] = useState(0)
  const url = stay22Ansicht(suche.url, ansicht)
  useEffect(() => {
    dialog.current?.show()
    heading.current?.focus({ preventScroll: true })
    ergebnisse.current?.scrollIntoView({ block: 'start' })
  }, [])
  useEffect(() => {
    if (host.current) return stay22Rahmen(host.current, url, setPhase)
  }, [url, versuch])
  useEffect(() => {
    if (!gross) return
    const vorher = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = vorher }
  }, [gross])
  const vergroessern = (wert: boolean) => {
    const el = dialog.current
    if (!el) return
    // The same frame stays mounted, including the supplier's current selection.
    el.close()
    if (wert) el.showModal()
    else el.show()
    setGross(wert)
    groesseButton.current?.focus({ preventScroll: true })
  }
  const blockiert = phase === 'datenschutz' || phase === 'fehler'
  return <section ref={ergebnisse} className="org-results stay22-results" aria-label="Unterkunftsangebote" data-stay22-phase={phase}>
    <div className="org-sectionhead">
      <div>
        <p className="stay22-eyebrow"><MapPinned size={15} aria-hidden="true" /> Dein Aufenthalt</p>
        <h2 ref={heading} tabIndex={-1}>Unterkünfte in {suche.ort}</h2>
        <p>{etappenZeitraumAnzeigen(suche.anreise, suche.abreise)} · {suche.naechte} {suche.naechte === 1 ? 'Nacht' : 'Nächte'} · {suche.erwachsene} {suche.erwachsene === 1 ? 'Erwachsener' : 'Erwachsene'}{suche.kinder > 0 ? ` · ${suche.kinder} ${suche.kinder === 1 ? 'Kind' : 'Kinder'}` : ''} · {suche.zimmer} Zimmer</p>
      </div>
      <button className="stay22-smallbutton stay22-iconbutton" type="button" title="Ausblenden" onClick={schliessen}><X size={16} aria-hidden="true" /><span className="sr-only">Ausblenden</span></button>
    </div>
    <dialog ref={dialog} role={gross ? 'dialog' : 'region'} aria-modal={gross || undefined} aria-label="Hotelkarte und Ergebnisliste" className={'stay22-panel' + (gross ? ' stay22-expanded' : '')} onCancel={e => { e.preventDefault(); vergroessern(false) }}>
      <div className="stay22-viewbar">
        <div role="group" aria-label="Ergebnisansicht">{ansichten.map(({ wert, text, Icon }) => <button key={wert} type="button" className="stay22-smallbutton" aria-pressed={ansicht === wert} onClick={() => setAnsicht(wert)}><Icon size={16} aria-hidden="true" />{text}</button>)}</div>
        <div className="stay22-viewactions">
          <span className="stay22-badge">Startansicht: {suche.filter.preis === 'total' ? 'Gesamter Aufenthalt' : 'Pro Nacht'} · {suche.waehrung}</span>
          <button type="button" className="stay22-smallbutton stay22-iconbutton" title="Erneut laden" onClick={() => setVersuch(v => v + 1)}><RotateCcw size={16} aria-hidden="true" /><span className="sr-only">Erneut laden</span></button>
          <button ref={groesseButton} type="button" className="stay22-smallbutton stay22-iconbutton" title={gross ? 'Verkleinern' : 'Vergrössern'} onClick={() => vergroessern(!gross)}>{gross ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}<span className="sr-only">{gross ? 'Verkleinern' : 'Vergrössern'}</span></button>
        </div>
      </div>
      <div role="status" className="stay22-status">
        {phase === 'laedt' ? <p><Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Stay22 wird geöffnet …</p> : null}
        {phase === 'langsam' ? <p>Die Anzeige braucht länger. Du kannst sie erneut laden.</p> : null}
        {phase === 'fehler' ? <p>Die Hotelanzeige konnte nicht geöffnet werden. Bitte versuche es erneut.</p> : null}
        {phase === 'datenschutz' ? <p>Deine Datenschutzeinstellungen verhindern das Laden von Stay22.</p> : null}
      </div>
      <div ref={host} hidden={blockiert} className="stay22-host" />
    </dialog>
  </section>
}
