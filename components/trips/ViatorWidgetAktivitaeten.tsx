'use client'

// components/trips/ViatorWidgetAktivitaeten.tsx
//
// Offizielles dynamisches Viator-Widget für das sichtbare Reiseziel.
// Kein natives API-Angebot und keine Übernahme aus dem Widget.

import * as React from 'react'

import { VIATOR_DATENSCHUTZ_HREF } from '@/lib/activities/viator-widget/dokument'
import { viatorAnwendungsRenderer } from '@/lib/activities/viator-widget/renderer'
import { viatorSuchname } from '@/lib/activities/viator-widget/suche'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const AKTION =
  'inline-block min-h-11 w-full min-w-0 max-w-full whitespace-normal rounded-full px-4 py-2 text-center text-sm font-semibold leading-6 [overflow-wrap:anywhere] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'
const PRIMAR = 'bg-brand-800 text-white hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60'
const SEKUNDAER = 'border border-line-200 bg-white text-brand-800 hover:border-line-500'
const TEXT = 'min-w-0 break-words text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]'

type Phase = 'ruhend' | 'laeuft' | 'anzeige' | 'fehler'

export default function ViatorWidgetAktivitaeten({
  name,
  gesperrt,
  sichtbar,
  land,
}: {
  name: string | null
  gesperrt: readonly string[]
  sichtbar: boolean
  land: boolean
}) {
  const suchname = name ? viatorSuchname(name, gesperrt) : null
  const [ausgeblendet, setAusgeblendet] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>('ruhend')
  const hostRef = React.useRef<HTMLDivElement>(null)
  const laufRef = React.useRef(0)

  React.useEffect(() => {
    const lauf = ++laufRef.current
    const host = hostRef.current
    if (!sichtbar || ausgeblendet || !suchname || !host) {
      host?.replaceChildren()
      if (host) viatorAnwendungsRenderer.entsorgen(host)
      if (lauf === laufRef.current) setPhase('ruhend')
      return
    }
    const knoten = document.createElement('div')
    host.replaceChildren(knoten)
    const steuerung = new AbortController()
    setPhase('laeuft')
    void viatorAnwendungsRenderer.laden(suchname, knoten, steuerung.signal).then((ergebnis) => {
      if (lauf !== laufRef.current) return
      setPhase(ergebnis.art === 'ressource' ? 'anzeige' : 'fehler')
    })
    return () => {
      steuerung.abort()
      knoten.remove()
      viatorAnwendungsRenderer.entsorgen(knoten)
    }
  }, [ausgeblendet, sichtbar, suchname])

  const zeigen = phase === 'laeuft' || phase === 'anzeige'

  return (
    <section
      aria-label="Viator"
      data-viator-zustand={suchname ? phase : name ? 'ungueltig' : 'kein-ziel'}
      data-viator-name={suchname ?? ''}
      data-viator-ausgeblendet={ausgeblendet ? 'ja' : 'nein'}
      className="mt-6 min-w-0 border-t border-line-200 pt-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Anbieter</p>
      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-brand-800">Viator</h3>
      <div className="mt-3 min-w-0" aria-live="polite">
        {!suchname ? (
          <p className={TEXT}>
            {name
              ? 'Für diesen Namen liegt keine geprüfte öffentliche Viator-Abfrage vor. Jetnity lädt das Widget dafür nicht.'
              : 'Ohne bestätigtes Ziel lädt Viator nichts.'}
          </p>
        ) : null}
        {suchname && ausgeblendet ? (
          <p className={TEXT}>Viator ist ausgeblendet. Die Einbindung startet erst wieder, wenn du sie anzeigst.</p>
        ) : null}
        {suchname && !ausgeblendet && phase === 'ruhend' ? (
          <p className={TEXT}>
            {land
              ? `Ideen für ${suchname}. Das ist das Land, kein bestimmter Ort und kein Reisetag. Das offizielle Viator-Widget wird geladen.`
              : `Für ${suchname} zeigt Viator eigene Inhalte. Dabei wird eine Verbindung zu Viator hergestellt.`}
          </p>
        ) : null}
        {phase === 'laeuft' && sichtbar && !ausgeblendet ? (
          <p aria-busy="true" className={cn(TEXT, 'flex items-start gap-3')}>
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            Viator wird geladen.
          </p>
        ) : null}
        {phase === 'fehler' ? <p className={TEXT}>Viator konnte gerade nicht geladen werden.</p> : null}
        {phase === 'anzeige' ? (
          <p className={TEXT}>
            Der Viator-Rahmen hat geantwortet. Das sagt noch nicht, welche Angebote darin stehen, und es ist keine Buchung.
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        {ausgeblendet && suchname ? (
          <button type="button" onClick={() => setAusgeblendet(false)} className={cn(AKTION, PRIMAR)}>
            Erneut anzeigen
          </button>
        ) : null}
        {zeigen ? (
          <button type="button" onClick={() => setAusgeblendet(true)} className={cn(AKTION, SEKUNDAER)}>
            Ausblenden
          </button>
        ) : null}
      </div>
      {suchname ? (
        <p className={cn(TEXT, 'mt-3')}>
          Beim Anzeigen werden Inhalte von Viator geladen. Dabei wird eine Verbindung zu Viator hergestellt.{' '}
          <a
            href={VIATOR_DATENSCHUTZ_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4"
          >
            Datenschutz von Viator
          </a>
          {'. '}
          Ausblenden beendet die weitere Einbindung, bis sie erneut angezeigt wird. Ein Angebotsklick kann Viator öffnen. Das bestätigt keine Provision und keine Buchung.
        </p>
      ) : null}
      <div ref={hostRef} data-viator-montage={zeigen ? 'sichtbar' : 'leer'} hidden={!zeigen} className="mt-4 min-w-0" />
    </section>
  )
}
