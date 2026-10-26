'use client'

// components/trips/GetYourGuideAktivitaeten.tsx
//
// GetYourGuide im bestehenden Aktivitätsbereich.
// Die Anwendung bleibt geschlossen. Eine Prüfung hängt nur über die Naht.

import * as React from 'react'

import { gygReiseAusTrip, gygPlanen, type GygPlan } from '@/lib/activities/getyourguide/kontext'
import {
  gygAbschluss,
  gygAnfordern,
  gygKontextWechseln,
  gygLaufStart,
  type GygLauf,
} from '@/lib/activities/getyourguide/lebenszyklus'
import {
  ANWENDUNGS_NAHT,
  bezugIstOeffentlich,
  gygLadenErlaubt,
  type GetYourGuideNaht,
} from '@/lib/activities/getyourguide/widget'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types/trips'
import { Loader2 } from 'lucide-react'

const AKTION =
  'inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'
const PRIMAR = 'bg-brand-800 text-white hover:bg-brand-900 disabled:pointer-events-none disabled:opacity-60'
const SEKUNDAER = 'border border-line-200 bg-white text-brand-800 hover:border-line-500'
const TEXT = 'min-w-0 break-words text-sm leading-6 text-ink-800 [overflow-wrap:anywhere]'

type Props = {
  reise: Trip
  angeforderteTagId: string | null
}

function zielSatz(plan: Extract<GygPlan, { art: 'bereit' | 'nicht_unterstuetzt' | 'kein_tagesziel' }>): string | null {
  if (!plan.name) return null
  if (plan.art === 'kein_tagesziel') return plan.name
  if (plan.art === 'nicht_unterstuetzt') {
    if (plan.zielArt === 'stadt') return `die Stadt ${plan.name}`
    if (plan.zielArt === 'region') return `die Region ${plan.name}`
    if (plan.zielArt === 'insel') return `die Insel ${plan.name}`
    if (plan.zielArt === 'land') return plan.name
    return plan.name
  }
  if (plan.zielArt === 'stadt') return `die Stadt ${plan.name}`
  if (plan.zielArt === 'region') return `die Region ${plan.name}`
  if (plan.zielArt === 'insel') return `die Insel ${plan.name}`
  return plan.name
}

function Flaeche({ reise, angeforderteTagId, naht }: Props & { naht: GetYourGuideNaht }) {
  const ohneTage = reise.days.length === 0
  const [umfangState, setUmfangState] = React.useState<'tag' | 'land'>(ohneTage ? 'land' : 'tag')
  const [landWahl, setLandWahl] = React.useState<string | null>(null)
  const [hinweisOffen, setHinweisOffen] = React.useState(false)
  const umfang = ohneTage ? 'land' : umfangState
  const plan = React.useMemo(
    () =>
      gygPlanen({
        reise: gygReiseAusTrip(reise),
        angeforderteTagId: ohneTage ? null : angeforderteTagId,
        umfang,
        landWahl,
        freigabe: naht.freigabe,
        orteLesen: naht.herkunft === 'pruefung' ? naht.orteLesen : null,
        abbildung: naht.herkunft === 'pruefung' ? naht.abbildung : ANWENDUNGS_NAHT.abbildung,
      }),
    [reise, angeforderteTagId, umfang, landWahl, naht, ohneTage],
  )
  const [lauf, setLauf] = React.useState<GygLauf>(() => gygLaufStart(plan.schluessel))
  const angepasst = lauf.kontext === plan.schluessel ? lauf : gygKontextWechseln(lauf, plan.schluessel)
  if (angepasst !== lauf) setLauf(angepasst)

  const erlaubterRenderer = naht.herkunft === 'pruefung' ? naht.renderer : null
  const laufRef = React.useRef(angepasst)
  const planRef = React.useRef(plan)
  const abortRef = React.useRef<AbortController | null>(null)
  const mountRef = React.useRef<HTMLDivElement>(null)
  const rendererRef = React.useRef(erlaubterRenderer)
  React.useLayoutEffect(() => {
    laufRef.current = angepasst
    planRef.current = plan
    rendererRef.current = erlaubterRenderer
  }, [angepasst, plan, erlaubterRenderer])
  React.useEffect(() => {
    const knoten = mountRef.current
    const renderer = rendererRef.current
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
      if (!knoten) return
      renderer?.entsorgen(knoten)
      knoten.replaceChildren()
    }
  }, [angepasst.kontext])

  const anzeigen = () => {
    const aktuell = planRef.current
    if (!gygLadenErlaubt(aktuell.art, 'aktion') || aktuell.art !== 'bereit') return
    if (!bezugIstOeffentlich(aktuell.bezug)) return
    const entscheid = gygAnfordern(laufRef.current, aktuell.bezug)
    if (!entscheid.angenommen) return
    const renderer = rendererRef.current
    const ziel = mountRef.current
    if (!renderer || !ziel) {
      const next = gygAbschluss(entscheid.lauf, entscheid, { art: 'abgelehnt', meldung: '' })
      laufRef.current = next
      setLauf(next)
      return
    }
    laufRef.current = entscheid.lauf
    setLauf(entscheid.lauf)
    abortRef.current?.abort()
    const steuerung = new AbortController()
    abortRef.current = steuerung
    void renderer.laden(entscheid.bezug, ziel, steuerung.signal).then(
      (ergebnis) => {
        if (steuerung.signal.aborted) return
        setLauf((stand) => {
          const next = gygAbschluss(stand, entscheid, ergebnis)
          laufRef.current = next
          return next
        })
      },
      () => {
        if (steuerung.signal.aborted) return
        setLauf((stand) => {
          const next = gygAbschluss(stand, entscheid, { art: 'abgelehnt', meldung: '' })
          laufRef.current = next
          return next
        })
      },
    )
  }

  const montageSichtbar = angepasst.phase === 'laeuft' || angepasst.phase === 'anzeige'
  const satz = plan.art === 'bereit' || plan.art === 'nicht_unterstuetzt' || plan.art === 'kein_tagesziel' ? zielSatz(plan) : null

  return (
    <section
      aria-label="GetYourGuide"
      data-gyg-zustand={plan.art}
      data-gyg-phase={angepasst.phase}
      className="mt-6 min-w-0 border-t border-line-200 pt-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Anbieter</p>
      <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-brand-800">GetYourGuide</h3>

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
            GetYourGuide zeigt hier eigene Inhalte. Jetnity zählt sie nicht und bestätigt weder Verfügbarkeit noch eine Buchung.
          </p>
        ) : null}
      </div>

      {plan.art === 'land_auswahl' ? (
        <fieldset className="mt-4 min-w-0">
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Bestätigtes Land</legend>
          <div className="mt-2 grid gap-2">
            {plan.laender.map((land) => (
              <label
                key={land.countryCode}
                className="flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border border-line-200 bg-white px-3 text-sm text-ink-900"
              >
                <input
                  type="radio"
                  name={`gyg-land-${reise.id}`}
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
        {plan.art === 'bereit' && angepasst.phase !== 'laeuft' ? (
          <button type="button" onClick={anzeigen} className={cn(AKTION, PRIMAR)}>
            {angepasst.phase === 'fehler' ? 'Erneut versuchen' : angepasst.phase === 'anzeige' ? 'Erneut laden' : 'Bei GetYourGuide anzeigen'}
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

      <div
        ref={mountRef}
        data-gyg-montage={montageSichtbar ? 'sichtbar' : 'leer'}
        hidden={!montageSichtbar}
        className="mt-4 min-w-0"
      />
    </section>
  )
}

export default function GetYourGuideAktivitaeten({ reise, angeforderteTagId }: Props) {
  return <Flaeche reise={reise} angeforderteTagId={angeforderteTagId} naht={ANWENDUNGS_NAHT} />
}

export function GetYourGuidePruefFlaeche({ reise, angeforderteTagId, naht }: Props & { naht: GetYourGuideNaht }) {
  const wirksam = naht.herkunft === 'pruefung' ? naht : ANWENDUNGS_NAHT
  return <Flaeche reise={reise} angeforderteTagId={angeforderteTagId} naht={wirksam} />
}
