'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Loader2, MapPinned, RotateCcw, X } from 'lucide-react'
import { stay22Rahmen, type Stay22Phase } from '@/lib/providers/stay22/rahmen'
import { STAY22_DATENSCHUTZ, type Stay22Suche } from '@/lib/providers/stay22/suche'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'

export default function Stay22Ergebnisse({ suche, schliessen }: { suche: Stay22Suche; schliessen: () => void }) {
  const host = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [phase, setPhase] = useState<Stay22Phase>('laedt')
  const [versuch, setVersuch] = useState(0)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    heading.current?.scrollIntoView({ block: 'start' })
    if (host.current) return stay22Rahmen(host.current, suche.url, setPhase)
  }, [suche.url, versuch])
  const blockiert = phase === 'datenschutz' || phase === 'fehler'
  return <section className="org-results stay22-results" aria-label="Unterkunftsangebote" data-stay22-phase={phase}>
    <div className="org-sectionhead">
      <div>
        <p className="stay22-eyebrow"><MapPinned size={15} aria-hidden="true" /> Dein Aufenthalt</p>
        <h2 ref={heading} tabIndex={-1}>Unterkünfte in {suche.ort}</h2>
        <p>{etappenZeitraumAnzeigen(suche.anreise, suche.abreise)} · {suche.naechte} {suche.naechte === 1 ? 'Nacht' : 'Nächte'} · {suche.erwachsene} {suche.erwachsene === 1 ? 'Erwachsener' : 'Erwachsene'}{suche.kinder > 0 ? ` · ${suche.kinder} ${suche.kinder === 1 ? 'Kind' : 'Kinder'}` : ''} · {suche.zimmer} Zimmer</p>
      </div>
      <button className="stay22-smallbutton" type="button" onClick={schliessen}><X size={16} aria-hidden="true" /> Ausblenden</button>
    </div>
    <div className="stay22-panel">
      <div className="stay22-toolbar">
        <div><strong>Unterkünfte und Preise vergleichen</strong><p>Über das Filtersymbol Budget, Sterne und Gästebewertung eingrenzen.</p></div>
        <span className="stay22-badge">Startansicht: Gesamtpreise in {suche.waehrung}</span>
      </div>
      <div role="status" className="stay22-status">
        {phase === 'laedt' ? <p><Loader2 size={17} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Stay22 wird geöffnet …</p> : null}
        {phase === 'langsam' ? <p>Die Anzeige braucht länger. Du kannst sie erneut laden oder separat öffnen.</p> : null}
        {phase === 'fehler' ? <p>Die Hotelanzeige konnte nicht geöffnet werden. Bitte versuche es erneut.</p> : null}
        {phase === 'datenschutz' ? <p>Deine Datenschutzeinstellungen verhindern das Laden von Stay22. Du kannst die Suche separat öffnen.</p> : null}
      </div>
      <div ref={host} hidden={blockiert} className="stay22-host" />
      <div className="stay22-recovery">
        <span>Anzeige leer oder unvollständig?</span>
        <button type="button" className="stay22-smallbutton" onClick={() => setVersuch(v => v + 1)}><RotateCcw size={14} aria-hidden="true" /> Erneut laden</button>
        <a className="stay22-smallbutton" href={suche.url} target="_blank" rel="sponsored noopener noreferrer" referrerPolicy="origin">Suche separat öffnen <ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only">, neuer Tab</span></a>
      </div>
    </div>
    <p className="org-note stay22-disclosure">Angebote und Bilder von Stay22 und seinen Buchungspartnern. Die Buchung öffnet beim angezeigten Anbieter. Preise können sich ändern; Zimmer, Belegung und Bedingungen dort prüfen. Die angezeigte Auswahl umfasst nicht den gesamten Markt. Bei einer Buchung kann Jetnity eine Provision erhalten. <a href={STAY22_DATENSCHUTZ} target="_blank" rel="noopener noreferrer">Datenschutz von Stay22</a></p>
  </section>
}
