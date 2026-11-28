'use client'

// components/trips/PlanenEinstiegNavigation.tsx
//
// Die zwei Wege auf /planen. Sichtbar ist immer genau einer; der andere bleibt
// eingehängt (`hidden`), damit Eingaben beim Wechsel erhalten bleiben.
// Nur Navigation: kein Absenden, keine Persistenz, kein Modell- oder
// Provideraufruf. Eine Aktivierung darf nur umschalten, fokussieren und
// scrollen. Reduced Motion kommt aus `scrollVerhalten`. Beim Wechsel von
// «In eigenen Worten» zu «Schritt für Schritt» reicht sie den Text im Speicher
// der Seite weiter (`usePlanenMitnahme`); ob er übernommen wird, entscheidet
// das Formular.

import * as React from 'react'
import type { MouseEvent, ReactNode } from 'react'

import { scrollVerhalten } from '@/lib/formular/sicht'

export const PLANEN_IDEE_ZIEL_ID = 'reise-beschreiben'
export const PLANEN_MANUELL_ZIEL_ID = 'manuell-planen'

export type PlanenWeg = 'idee' | 'manuell'

export type PlanenManuellZielElement = {
  focus: (options?: FocusOptions) => void
  scrollIntoView: (init?: ScrollIntoViewOptions) => void
}

export type PlanenManuellHistory = {
  replaceState: (data: unknown, unused: string, url?: string | URL | null) => void
  location: { hash: string }
}

/**
 * Fokussiert ein Einstiegsziel und holt es unter den klebenden Kopf.
 * Scrollt nur auf ausdrückliche Aktivierung, nicht bei Formular-Rerenders.
 * `replaceState` legt keinen zusätzlichen History-Eintrag an.
 */
function aktuelleHistory(): PlanenManuellHistory | null {
  if (typeof window === 'undefined') return null
  return {
    replaceState: (data, unused, url) => window.history.replaceState(data, unused, url),
    location: window.location,
  }
}

function zielAnsteuern(
  id: string,
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined,
): boolean {
  if (!ziel) return false
  ziel.focus({ preventScroll: true })
  ziel.scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: scrollVerhalten(),
  })
  const hash = `#${id}`
  if (historyApi && historyApi.location.hash !== hash) {
    historyApi.replaceState(null, '', hash)
  }
  return true
}

export function planenIdeeZielAnsteuern(
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined = aktuelleHistory(),
): boolean {
  return zielAnsteuern(PLANEN_IDEE_ZIEL_ID, ziel, historyApi)
}

export function planenManuellZielAnsteuern(
  ziel: PlanenManuellZielElement | null | undefined,
  historyApi: PlanenManuellHistory | null | undefined = aktuelleHistory(),
): boolean {
  return zielAnsteuern(PLANEN_MANUELL_ZIEL_ID, ziel, historyApi)
}

function wegAusHash(hash: string): PlanenWeg | null {
  if (hash === `#${PLANEN_MANUELL_ZIEL_ID}`) return 'manuell'
  if (hash === `#${PLANEN_IDEE_ZIEL_ID}`) return 'idee'
  return null
}

type Ansteuerung = 'fokus' | 'scrollen'

export type PlanenMitnahme = { text: string; nr: number }

type WegKontext = {
  weg: PlanenWeg
  waehlen: (weg: PlanenWeg, ansteuerung: Ansteuerung) => void
  ideeMelden: (text: string) => void
  mitnahme: PlanenMitnahme | null
}

const PlanenWegKontext = React.createContext<WegKontext | null>(null)

function useWeg(): WegKontext {
  const kontext = React.useContext(PlanenWegKontext)
  if (!kontext) throw new Error('PlanenWegWahl fehlt')
  return kontext
}

/** Meldet den aktuellen Text aus «In eigenen Worten». Ausserhalb von /planen wirkungslos. */
export function usePlanenIdeeMelden(text: string) {
  const melden = React.useContext(PlanenWegKontext)?.ideeMelden
  React.useEffect(() => {
    melden?.(text)
  }, [melden, text])
}

/** Der beim letzten Wechsel zu «Schritt für Schritt» mitgenommene Text; `nr` zählt die Wechsel. */
export function usePlanenMitnahme(): PlanenMitnahme | null {
  return React.useContext(PlanenWegKontext)?.mitnahme ?? null
}

/**
 * Hält den sichtbaren Weg. `start` kommt vom Server; ein Anker in der Adresse
 * (`#manuell-planen`, `#reise-beschreiben`) hat Vorrang und wird angesteuert.
 */
export function PlanenWegWahl({ start, children }: { start: PlanenWeg; children: ReactNode }) {
  const [weg, setWeg] = React.useState<PlanenWeg>(start)
  // Gilt nur für den Weg, für den es gesetzt wurde: Der erste Effektlauf sieht
  // noch den alten Weg und darf die Ansteuerung nicht verbrauchen.
  const ansteuern = React.useRef<{ weg: PlanenWeg; art: Ansteuerung } | null>(null)
  const ideeText = React.useRef('')
  const aktuellerWeg = React.useRef<PlanenWeg>(start)
  const [mitnahme, setMitnahme] = React.useState<PlanenMitnahme | null>(null)
  const ideeMelden = React.useCallback((text: string) => {
    ideeText.current = text
  }, [])

  const waehlen = React.useCallback((naechster: PlanenWeg, art: Ansteuerung) => {
    ansteuern.current = { weg: naechster, art }
    const text = ideeText.current.trim()
    if (aktuellerWeg.current === 'idee' && naechster === 'manuell' && text) {
      setMitnahme((bisher) => ({ text, nr: (bisher?.nr ?? 0) + 1 }))
    }
    aktuellerWeg.current = naechster
    setWeg(naechster)
  }, [])

  React.useEffect(() => {
    const ausAdresse = () => {
      const ziel = wegAusHash(window.location.hash)
      if (ziel) waehlen(ziel, 'scrollen')
    }
    ausAdresse()
    window.addEventListener('hashchange', ausAdresse)
    return () => window.removeEventListener('hashchange', ausAdresse)
  }, [waehlen])

  React.useEffect(() => {
    const offen = ansteuern.current
    if (!offen || offen.weg !== weg) return
    ansteuern.current = null
    const { art } = offen
    const id = weg === 'manuell' ? PLANEN_MANUELL_ZIEL_ID : PLANEN_IDEE_ZIEL_ID
    const ziel = document.getElementById(id)
    if (!ziel) return
    if (art === 'scrollen') {
      if (weg === 'manuell') planenManuellZielAnsteuern(ziel)
      else planenIdeeZielAnsteuern(ziel)
      return
    }
    // Der Umschalter steht direkt über dem Weg; Scrollen würde ihn wegschieben.
    ziel.focus({ preventScroll: true })
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`)
  }, [weg])

  const wert = React.useMemo(() => ({ weg, waehlen, ideeMelden, mitnahme }), [weg, waehlen, ideeMelden, mitnahme])
  return <PlanenWegKontext.Provider value={wert}>{children}</PlanenWegKontext.Provider>
}

const wegLinkClass =
  'jet-wahl min-h-11 min-w-0 px-4 py-2 text-center text-meta font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20'

/** Der Umschalter zwischen beiden Wegen. Links mit Anker, damit jeder Weg adressierbar bleibt. */
export function PlanenManuellZeiger() {
  const { weg, waehlen } = useWeg()
  const umschalten = (ziel: PlanenWeg) => (ereignis: MouseEvent<HTMLAnchorElement>) => {
    ereignis.preventDefault()
    waehlen(ziel, 'fokus')
  }

  return (
    <nav aria-label="Wege zur neuen Reise" className="min-w-0 max-w-full">
      <div className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-full border border-line-200 bg-white p-1 sm:inline-grid sm:w-auto">
        <a
          href={`#${PLANEN_IDEE_ZIEL_ID}`}
          aria-current={weg === 'idee' ? 'true' : undefined}
          onClick={umschalten('idee')}
          className={wegLinkClass}
        >
          In eigenen Worten
        </a>
        <a
          href={`#${PLANEN_MANUELL_ZIEL_ID}`}
          aria-current={weg === 'manuell' ? 'true' : undefined}
          onClick={umschalten('manuell')}
          className={wegLinkClass}
        >
          Schritt für Schritt
        </a>
      </div>
    </nav>
  )
}

const zielRahmenClass =
  'scroll-mt-[calc(var(--jet-header-h)+env(safe-area-inset-top)+1rem)] min-w-0 max-w-full rounded-[28px] outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

export function PlanenIdeeZiel({ children }: { children: ReactNode }) {
  const { weg } = useWeg()
  return (
    <section
      id={PLANEN_IDEE_ZIEL_ID}
      tabIndex={-1}
      aria-label="In eigenen Worten"
      hidden={weg !== 'idee'}
      className={zielRahmenClass}
    >
      {children}
    </section>
  )
}

export function PlanenManuellZiel({ children }: { children: ReactNode }) {
  const { weg } = useWeg()
  return (
    <section
      id={PLANEN_MANUELL_ZIEL_ID}
      tabIndex={-1}
      aria-label="Schritt für Schritt planen"
      hidden={weg !== 'manuell'}
      className={zielRahmenClass}
    >
      {children}
    </section>
  )
}
