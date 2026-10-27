'use client'

// components/trips/GetYourGuideAktivitaeten.tsx
//
// GetYourGuide im bestehenden Aktivitätsbereich.
// Die Anwendung bestätigt den Ort und lädt das manuelle Widget erst auf Wunsch.
// Jede Ladung besitzt einen eigenen, abtrennbaren Knoten.

import * as React from 'react'

import {
  gygAufloesungAbschluss,
  gygAufloesungBeginnen,
  gygAufloesungStart,
  gygAufloesungWechseln,
  type GygAufloesung,
} from '@/lib/activities/getyourguide/aufloesung'
import { gygOrtAnfrage, gygPlanen, gygReiseAusTrip, type GygPlan } from '@/lib/activities/getyourguide/kontext'
import {
  gygAbschluss,
  gygAnfordern,
  gygEntfernen,
  gygKontextWechseln,
  gygLaufStart,
  type GygLauf,
} from '@/lib/activities/getyourguide/lebenszyklus'
import { anwendungsRenderer } from '@/lib/activities/getyourguide/renderer'
import {
  GYG_ANZAHL_ERWEITERT,
  GYG_ANZAHL_STANDARD,
  GYG_DATENSCHUTZ_HREF,
  suchkonfigurationIstGueltig,
  type GygAnzahl,
} from '@/lib/activities/getyourguide/suche'
import {
  ANWENDUNGS_NAHT,
  gygLadenErlaubt,
  type GetYourGuideNaht,
  type GygKanonBestaetigen,
  type GygLadeErgebnis,
  type GygRenderer,
} from '@/lib/activities/getyourguide/widget'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { cn } from '@/lib/utils'
import type { Ort } from '@/lib/places/domain'
import type { Trip } from '@/types/trips'
import { Loader2 } from 'lucide-react'

const AKTION =
  'inline-block min-h-11 w-full min-w-0 max-w-full whitespace-normal rounded-full px-4 py-2 text-center text-sm font-semibold leading-6 [overflow-wrap:anywhere] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'
const PRIMAR = 'bg-brand-800 text-white hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60'
const SEKUNDAER = 'border border-line-200 bg-white text-brand-800 hover:border-line-500'
const TEXT = 'min-w-0 break-words text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]'

type Props = {
  reise: Trip
  angeforderteTagId: string | null
}

type Betrieb = {
  epoche: number
  generation: number
  renderer: GygRenderer
  knoten: HTMLElement
  steuerung: AbortController
}

type OrtBuch = { stand: GygAufloesung; versuch: number; quelle: GygKanonBestaetigen }

async function anwendungsOrtBestaetigen(id: string, signal: AbortSignal): Promise<Ort | null> {
  if (signal.aborted) return null
  const ergebnis = await ortBestaetigen(id, 'ziel')
  if (signal.aborted || !ergebnis.ok || ergebnis.wert.id !== id) return null
  return ergebnis.wert
}

function anwendungsNaht(): GetYourGuideNaht {
  return {
    ...ANWENDUNGS_NAHT,
    kanonBestaetigen: anwendungsOrtBestaetigen,
    renderer: anwendungsRenderer,
  }
}

function betriebBeenden(betrieb: Betrieb | null) {
  if (!betrieb) return
  betrieb.steuerung.abort()
  betrieb.knoten.remove()
  try {
    betrieb.renderer.entsorgen(betrieb.knoten)
  } catch {
    // Der Knoten ist bereits aus dem Dokument. Ein Entsorgungsfehler hängt ihn nicht wieder ein.
  }
  betrieb.knoten.remove()
}

function zielSatz(plan: Extract<GygPlan, { art: 'bereit' | 'nicht_unterstuetzt' | 'kein_tagesziel' }>): string | null {
  if (!plan.name) return null
  if (plan.art === 'kein_tagesziel') return plan.name
  if (plan.art === 'nicht_unterstuetzt' || plan.art === 'bereit') {
    if (plan.zielArt === 'stadt') return `die Stadt ${plan.name}`
    if (plan.zielArt === 'region') return `die Region ${plan.name}`
    if (plan.zielArt === 'insel') return `die Insel ${plan.name}`
    if (plan.zielArt === 'land') return plan.name
  }
  return plan.name
}

function laenderVon(plan: GygPlan) {
  if (plan.art === 'land_auswahl') return plan.laender
  if ((plan.art === 'bereit' || plan.art === 'nicht_unterstuetzt') && plan.laender && plan.laender.length > 0) {
    return plan.laender
  }
  return []
}

function Flaeche({ reise, angeforderteTagId, naht }: Props & { naht: GetYourGuideNaht }) {
  const instanz = React.useId()
  const ohneTage = reise.days.length === 0
  const [umfangState, setUmfangState] = React.useState<'tag' | 'land'>(ohneTage ? 'land' : 'tag')
  const [landWahl, setLandWahl] = React.useState<string | null>(null)
  const [hinweisOffen, setHinweisOffen] = React.useState(false)
  const [ortVersuch, setOrtVersuch] = React.useState(0)
  const umfang = ohneTage ? 'land' : umfangState
  const bestaetigen: GygKanonBestaetigen | null =
    naht.herkunft === 'pruefung' ? naht.kanonBestaetigen : anwendungsOrtBestaetigen
  const syncLesen = naht.herkunft === 'pruefung' && !bestaetigen ? naht.orteLesen : null
  const reiseKern = React.useMemo(() => gygReiseAusTrip(reise), [reise])
  const anfrage = bestaetigen && naht.freigabe.status === 'bereit'
    ? gygOrtAnfrage(reiseKern, umfang, ohneTage ? null : angeforderteTagId)
    : null
  const anfrageText = anfrage?.anfrage ?? ''
  const [buch, setBuch] = React.useState<OrtBuch | null>(null)
  const buchSichtbar = React.useMemo<OrtBuch | null>(() => {
    if (!anfrage || !bestaetigen) return null
    const anfrageStand = gygAufloesungWechseln(buch?.stand ?? gygAufloesungStart(anfrage.anfrage), anfrage.anfrage)
    if (buch && buch.stand === anfrageStand) return buch
    return { stand: anfrageStand, versuch: buch?.versuch ?? ortVersuch, quelle: buch?.quelle ?? bestaetigen }
  }, [anfrage, bestaetigen, buch, ortVersuch])
  if ((buch?.stand.anfrage ?? null) !== (buchSichtbar?.stand.anfrage ?? null)) setBuch(buchSichtbar)

  const buchRef = React.useRef<OrtBuch | null>(buchSichtbar)
  const anfrageRef = React.useRef(anfrage)
  const bestaetigenRef = React.useRef(bestaetigen)
  React.useLayoutEffect(() => {
    buchRef.current = buchSichtbar
    anfrageRef.current = anfrage
    bestaetigenRef.current = bestaetigen
  }, [anfrage, bestaetigen, buchSichtbar])

  React.useEffect(() => {
    const leser = bestaetigenRef.current
    const angefragt = anfrageRef.current
    if (!leser || !angefragt || naht.freigabe.status !== 'bereit' || angefragt.ids.length === 0) return
    const bisher = buchRef.current
    if (
      bisher &&
      bisher.quelle === leser &&
      bisher.stand.anfrage === angefragt.anfrage &&
      bisher.versuch === ortVersuch &&
      (bisher.stand.phase === 'fertig' || bisher.stand.phase === 'fehler')
    ) {
      return
    }
    const basis = gygAufloesungWechseln(bisher?.stand ?? gygAufloesungStart(angefragt.anfrage), angefragt.anfrage)
    const ausgang = basis.phase === 'ruhend' ? basis : { ...basis, phase: 'ruhend' as const, orte: {}, fehler: null }
    const next = gygAufloesungBeginnen(ausgang)
    const erwartet = { epoche: next.epoche, generation: next.generation, anfrage: next.anfrage }
    const laufend: OrtBuch = { stand: next, versuch: ortVersuch, quelle: leser }
    buchRef.current = laufend
    setBuch(laufend)
    const steuerung = new AbortController()
    let lebend = true
    void (async () => {
      const orte: Record<string, Ort | null> = {}
      try {
        for (const id of angefragt.ids) {
          if (!lebend) return
          const ort = await leser(id, steuerung.signal)
          if (!lebend) return
          orte[id] = ort && ort.id === id ? ort : null
        }
        if (!lebend) return
        setBuch((aktuell) => {
          const fertig = gygAufloesungAbschluss(aktuell?.stand ?? next, erwartet, { art: 'orte', orte })
          const folge: OrtBuch = { stand: fertig, versuch: ortVersuch, quelle: leser }
          buchRef.current = folge
          return folge
        })
      } catch {
        if (!lebend) return
        setBuch((aktuell) => {
          const fehler = gygAufloesungAbschluss(aktuell?.stand ?? next, erwartet, { art: 'abgelehnt' })
          const folge: OrtBuch = { stand: fehler, versuch: ortVersuch, quelle: leser }
          buchRef.current = folge
          return folge
        })
      }
    })()
    return () => {
      lebend = false
      steuerung.abort()
    }
  }, [bestaetigen, anfrageText, naht.freigabe.status, ortVersuch])

  const plan = React.useMemo(() => {
    if (bestaetigen && naht.freigabe.status === 'bereit' && anfrage && anfrage.ids.length > 0) {
      const stand = buchSichtbar?.stand
      const bestaetigt =
        Boolean(stand) && buchSichtbar?.quelle === bestaetigen && stand?.anfrage === anfrage.anfrage
      if (!bestaetigt || !stand || stand.phase === 'ruhend' || stand.phase === 'laeuft') {
        return { art: 'ort_ausstehend' as const, schluessel: anfrage.anfrage }
      }
      if (stand.phase === 'fehler') {
        return { art: 'ort_ausstehend' as const, schluessel: `${anfrage.anfrage}:fehler` }
      }
      return gygPlanen({
        reise: reiseKern,
        angeforderteTagId: ohneTage ? null : angeforderteTagId,
        umfang,
        landWahl,
        freigabe: naht.freigabe,
        orteLesen: (id) => {
          const ort = stand.orte[id]
          return ort && ort.id === id ? ort : null
        },
      })
    }
    return gygPlanen({
      reise: reiseKern,
      angeforderteTagId: ohneTage ? null : angeforderteTagId,
      umfang,
      landWahl,
      freigabe: naht.freigabe,
      orteLesen: syncLesen,
    })
  }, [anfrage, angeforderteTagId, bestaetigen, buchSichtbar, landWahl, naht.freigabe, ohneTage, reiseKern, syncLesen, umfang])

  const [anzahlBuch, setAnzahlBuch] = React.useState<{ kontext: string; anzahl: GygAnzahl }>(() => ({
    kontext: plan.schluessel,
    anzahl: GYG_ANZAHL_STANDARD,
  }))
  const anzahlRef = React.useRef<GygAnzahl>(GYG_ANZAHL_STANDARD)
  const [lauf, setLauf] = React.useState<GygLauf>(() => gygLaufStart(plan.schluessel))
  const angepasst = lauf.kontext === plan.schluessel ? lauf : gygKontextWechseln(lauf, plan.schluessel)
  if (angepasst !== lauf) setLauf(angepasst)
  const anzahl = anzahlBuch.kontext === angepasst.kontext ? anzahlBuch.anzahl : GYG_ANZAHL_STANDARD
  if (anzahlBuch.kontext !== angepasst.kontext) {
    setAnzahlBuch({ kontext: angepasst.kontext, anzahl: GYG_ANZAHL_STANDARD })
  }

  const erlaubterRenderer = naht.herkunft === 'pruefung' ? naht.renderer : anwendungsRenderer
  const laufRef = React.useRef(angepasst)
  const planRef = React.useRef(plan)
  const betriebRef = React.useRef<Betrieb | null>(null)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const rendererRef = React.useRef(erlaubterRenderer)
  React.useLayoutEffect(() => {
    laufRef.current = angepasst
    planRef.current = plan
    rendererRef.current = erlaubterRenderer
    anzahlRef.current = anzahl
  }, [angepasst, plan, erlaubterRenderer, anzahl])
  React.useEffect(() => {
    const host = hostRef.current
    return () => {
      betriebBeenden(betriebRef.current)
      betriebRef.current = null
      host?.replaceChildren()
    }
  }, [angepasst.kontext])

  const anzeigen = (gewuenscht: GygAnzahl = anzahlRef.current) => {
    if (gewuenscht !== GYG_ANZAHL_STANDARD && gewuenscht !== GYG_ANZAHL_ERWEITERT) return
    const aktuell = planRef.current
    if (!gygLadenErlaubt(aktuell.art, 'aktion') || aktuell.art !== 'bereit') return
    if (!suchkonfigurationIstGueltig(aktuell.suche)) return
    const entscheid = gygAnfordern(laufRef.current, aktuell.suche)
    if (!entscheid.angenommen) return
    const renderer = rendererRef.current
    const host = hostRef.current
    betriebBeenden(betriebRef.current)
    betriebRef.current = null
    if (!renderer || !host) {
      const next = gygAbschluss(entscheid.lauf, entscheid, { art: 'abgelehnt', meldung: '' })
      laufRef.current = next
      setLauf(next)
      return
    }
    anzahlRef.current = gewuenscht
    setAnzahlBuch({ kontext: entscheid.lauf.kontext, anzahl: gewuenscht })
    const knoten = document.createElement('div')
    knoten.dataset.gygBetrieb = String(entscheid.generation)
    host.replaceChildren(knoten)
    const steuerung = new AbortController()
    const betrieb: Betrieb = {
      epoche: entscheid.epoche,
      generation: entscheid.generation,
      renderer,
      knoten,
      steuerung,
    }
    betriebRef.current = betrieb
    laufRef.current = entscheid.lauf
    setLauf(entscheid.lauf)
    let ausstehend: Promise<GygLadeErgebnis>
    try {
      ausstehend = Promise.resolve(renderer.laden(entscheid.suche, knoten, steuerung.signal, gewuenscht))
    } catch {
      betriebBeenden(betrieb)
      if (betriebRef.current === betrieb) betriebRef.current = null
      const next = gygAbschluss(entscheid.lauf, entscheid, { art: 'abgelehnt', meldung: '' })
      laufRef.current = next
      setLauf(next)
      return
    }
    void ausstehend.then(
      (ergebnis) => {
        if (betriebRef.current !== betrieb) return
        if (ergebnis.art === 'abgelehnt') {
          betriebBeenden(betrieb)
          if (betriebRef.current === betrieb) betriebRef.current = null
          setLauf((stand) => {
            const next = gygAbschluss(stand, entscheid, { art: 'abgelehnt', meldung: '' })
            laufRef.current = next
            return next
          })
          return
        }
        setLauf((stand) => {
          const next = gygAbschluss(stand, entscheid, ergebnis)
          laufRef.current = next
          return next
        })
      },
      () => {
        if (betriebRef.current !== betrieb) return
        betriebBeenden(betrieb)
        betriebRef.current = null
        setLauf((stand) => {
          const next = gygAbschluss(stand, entscheid, { art: 'abgelehnt', meldung: '' })
          laufRef.current = next
          return next
        })
      },
    )
  }

  const entfernen = () => {
    betriebBeenden(betriebRef.current)
    betriebRef.current = null
    hostRef.current?.replaceChildren()
    anzahlRef.current = GYG_ANZAHL_STANDARD
    setAnzahlBuch((buch) => ({ kontext: buch.kontext, anzahl: GYG_ANZAHL_STANDARD }))
    const next = gygEntfernen(laufRef.current)
    laufRef.current = next
    setLauf(next)
  }

  const montageSichtbar = angepasst.phase === 'laeuft' || angepasst.phase === 'anzeige'
  const ladenSichtbar = plan.art === 'bereit' && angepasst.phase !== 'laeuft'
  const entfernenSichtbar = angepasst.phase === 'laeuft' || angepasst.phase === 'anzeige'
  const satz = plan.art === 'bereit' || plan.art === 'nicht_unterstuetzt' || plan.art === 'kein_tagesziel' ? zielSatz(plan) : null
  const laender = laenderVon(plan)
  const bestaetigungFehler = Boolean(
    buchSichtbar && buchSichtbar.stand.phase === 'fehler' && plan.art === 'ort_ausstehend' && plan.schluessel.endsWith(':fehler'),
  )

  return (
    <section
      aria-label="GetYourGuide"
      data-gyg-zustand={plan.art}
      data-gyg-phase={angepasst.phase}
      data-gyg-anzahl={String(anzahl)}
      data-gyg-instanz={instanz}
      className="mt-6 min-w-0 border-t border-line-200 pt-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Anbieter</p>
      <h3 className="mt-1 min-w-0 max-w-full text-lg font-semibold leading-tight tracking-[-0.03em] text-brand-800 [overflow-wrap:anywhere]">
        GetYourGuide
      </h3>

      <div className="mt-3 min-w-0" aria-live="polite">
        {plan.art === 'geschlossen' ? (
          <p className={TEXT}>
            Bildangebote von GetYourGuide sind in Jetnity noch nicht eingerichtet. Jetnity lädt dafür keine Inhalte.
          </p>
        ) : null}
        {plan.art === 'tag_ungueltig' ? (
          <p className={TEXT}>Dieser Tag gehört nicht zu dieser Reise. GetYourGuide verwendet nicht ersatzweise einen anderen Tag.</p>
        ) : null}
        {plan.art === 'etappe_fehlt' ? (
          <p className={TEXT}>Dieser Tag ist keinem Ziel zugeordnet. Ohne bestätigtes Ziel lädt GetYourGuide nichts.</p>
        ) : null}
        {plan.art === 'ort_unbestaetigt' ? (
          <p className={TEXT}>Das Ziel ist nicht bestätigt. Ein Name, ein Land aus der Liste oder der erste Eintrag ersetzt diese Bestätigung nicht.</p>
        ) : null}
        {plan.art === 'ort_widerspruch' ? (
          <p className={TEXT}>Die bestätigten Ortsangaben passen nicht zusammen. GetYourGuide erhält deshalb kein Ziel.</p>
        ) : null}
        {plan.art === 'kein_tagesziel' ? (
          <p className={TEXT}>
            {satz ? `${satz} ist ein Land, kein Ort an einem Reisetag.` : 'Dieses Ziel ist ein Land, kein Ort an einem Reisetag.'}{' '}
            Ideen dafür sind keine Zusage, dass ein bestimmter Tag passt.
          </p>
        ) : null}
        {plan.art === 'land_auswahl' ? (
          <p className={TEXT}>Wähle ein bestätigtes Land. Jetnity nimmt nicht das erste und macht aus einem Land keine Stadt.</p>
        ) : null}
        {plan.art === 'nicht_unterstuetzt' ? (
          <p className={TEXT}>
            {satz
              ? `Für ${satz} liegt noch keine geprüfte Zuordnung vor.`
              : 'Für dieses Ziel liegt noch keine geprüfte Zuordnung vor.'}{' '}
            Das sagt nichts darüber aus, ob es Angebote gibt.
          </p>
        ) : null}
        {plan.art === 'ort_ausstehend' && !bestaetigungFehler ? (
          <p aria-busy="true" className={TEXT}>Das Ziel wird bestätigt. GetYourGuide lädt dabei noch nichts.</p>
        ) : null}
        {bestaetigungFehler ? <p className={TEXT}>{buchSichtbar?.stand.fehler}</p> : null}
        {plan.art === 'bereit' && angepasst.phase === 'ruhend' ? (
          <p className={TEXT}>
            {plan.zielArt === 'land'
              ? `Ideen für ${plan.name ?? 'dieses Land'}. Das ist das Land, kein bestimmter Ort und kein Reisetag.`
              : `Für ${satz ?? 'dieses Ziel'} kann GetYourGuide eigene Inhalte zeigen. Jetnity lädt sie erst auf Wunsch.`}
          </p>
        ) : null}
        {angepasst.phase === 'laeuft' ? (
          <p aria-busy="true" className={cn(TEXT, 'flex items-start gap-3')}>
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            GetYourGuide wird geladen.
          </p>
        ) : null}
        {angepasst.phase === 'fehler' ? <p className={TEXT}>{angepasst.fehler}</p> : null}
        {angepasst.phase === 'anzeige' ? (
          <p className={TEXT}>
            Der GetYourGuide-Rahmen ist geladen. Welche Angebote erscheinen, entscheidet GetYourGuide. Jetnity zählt sie nicht und bestätigt weder Verfügbarkeit noch eine Buchung.
          </p>
        ) : null}
      </div>

      {laender.length > 0 ? (
        <fieldset className="mt-4 min-w-0">
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Bestätigtes Land</legend>
          <div className="mt-2 grid gap-2">
            {laender.map((land) => (
              <label
                key={land.countryCode}
                className="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
              >
                <input
                  type="radio"
                  name={`gyg-land-${instanz}`}
                  value={land.countryCode}
                  checked={landWahl === land.countryCode}
                  onChange={() => setLandWahl(land.countryCode)}
                  className="h-4 w-4 shrink-0 accent-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{land.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        {plan.art === 'geschlossen' ? (
          <button
            type="button"
            aria-expanded={hinweisOffen}
            onClick={() => setHinweisOffen((offen) => !offen)}
            className={cn(AKTION, SEKUNDAER)}
          >
            Was fehlt hier?
          </button>
        ) : null}
        {plan.art === 'kein_tagesziel' ? (
          <button type="button" onClick={() => setUmfangState('land')} className={cn(AKTION, SEKUNDAER)}>
            Ideen für dieses Land
          </button>
        ) : null}
        {bestaetigungFehler ? (
          <button type="button" onClick={() => setOrtVersuch((wert) => wert + 1)} className={cn(AKTION, PRIMAR)}>
            Ziel erneut bestätigen
          </button>
        ) : null}
        {ladenSichtbar ? (
          <button
            type="button"
            onClick={() => anzeigen()}
            aria-describedby={`${instanz}-hinweis`}
            className={cn(AKTION, PRIMAR)}
          >
            {angepasst.phase === 'fehler' ? 'Erneut versuchen' : angepasst.phase === 'anzeige' ? 'Erneut laden' : 'Bei GetYourGuide anzeigen'}
          </button>
        ) : null}
        {angepasst.phase === 'anzeige' && anzahl === GYG_ANZAHL_STANDARD ? (
          <button type="button" onClick={() => anzeigen(GYG_ANZAHL_ERWEITERT)} className={cn(AKTION, SEKUNDAER)}>
            Mehr Aktivitäten anzeigen
          </button>
        ) : null}
        {angepasst.phase === 'anzeige' && anzahl === GYG_ANZAHL_ERWEITERT ? (
          <button type="button" onClick={() => anzeigen(GYG_ANZAHL_STANDARD)} className={cn(AKTION, SEKUNDAER)}>
            Weniger anzeigen
          </button>
        ) : null}
        {entfernenSichtbar ? (
          <button type="button" onClick={entfernen} className={cn(AKTION, SEKUNDAER)}>
            Entfernen
          </button>
        ) : null}
        {!ohneTage && umfang === 'tag' && plan.art !== 'kein_tagesziel' ? (
          <button type="button" onClick={() => setUmfangState('land')} className={cn(AKTION, SEKUNDAER)}>
            Ideen für ein bestätigtes Land
          </button>
        ) : null}
        {!ohneTage && umfang === 'land' ? (
          <button
            type="button"
            onClick={() => {
              setUmfangState('tag')
              setLandWahl(null)
            }}
            className={cn(AKTION, SEKUNDAER)}
          >
            Zurück zum Reisetag
          </button>
        ) : null}
      </div>

      {plan.art === 'geschlossen' && hinweisOffen ? (
        <p className={cn(TEXT, 'mt-3 rounded-2xl bg-surface-25 px-4 py-3')}>
          Eine geprüfte Einbindung, die Erlaubnis zum Laden und die Einrichtung bei GetYourGuide fehlen. Jetnity startet deshalb keine Anfrage.
        </p>
      ) : null}
      {ladenSichtbar || entfernenSichtbar ? (
        <p id={`${instanz}-hinweis`} className={cn(TEXT, 'mt-3')}>
          {ladenSichtbar
            ? 'Beim Anzeigen werden Inhalte von GetYourGuide und der Integration Analyzer geladen. Der Analyzer dient GetYourGuide zur Auswertung der Einbindung und ihrer Nutzung. Dabei wird eine Verbindung zu GetYourGuide hergestellt. '
            : null}
          <a
            href={GYG_DATENSCHUTZ_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4"
          >
            Datenschutz von GetYourGuide
          </a>
          {'. '}
          Ein Angebotsklick kann zunächst eine Ergebnisliste bei GetYourGuide öffnen. Dort wählst du dein Angebot aus.
          {entfernenSichtbar
            ? ' Entfernen beendet die weitere Einbindung. Bereits gesendete Anfragen werden dadurch nicht gelöscht.'
            : ' Entfernen beendet die weitere Einbindung und löscht keine bereits gesendeten Anfragen.'}
        </p>
      ) : null}

      <div
        ref={hostRef}
        data-gyg-montage={montageSichtbar ? 'sichtbar' : 'leer'}
        hidden={!montageSichtbar}
        className="mt-4 min-w-0"
      />
    </section>
  )
}

export default function GetYourGuideAktivitaeten({ reise, angeforderteTagId }: Props) {
  return <Flaeche reise={reise} angeforderteTagId={angeforderteTagId} naht={anwendungsNaht()} />
}

export function GetYourGuidePruefFlaeche({ reise, angeforderteTagId, naht }: Props & { naht: GetYourGuideNaht }) {
  const wirksam = naht.herkunft === 'pruefung' ? naht : anwendungsNaht()
  return <Flaeche reise={reise} angeforderteTagId={angeforderteTagId} naht={wirksam} />
}
