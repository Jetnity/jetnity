'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin } from 'lucide-react'

import OrtSuche from '@/components/places/OrtSuche'
import RouteZielListe from '@/components/places/RouteZielListe'
import { feldFehlerId } from '@/lib/formular/feldfehler'
import { feldInSichtNehmen } from '@/lib/formular/sicht'
import { type OrtAuswahl } from '@/lib/places/auswahl'
import {
  ROUTE_EINSTIEG_MELDUNG,
  routeEinstiegHref,
  routePendingText,
  routeVorkommenVerschieben,
  startzielErsetzenStarten,
  startzielHatUnbestaetigtenEntwurf,
  startzielVorkommenEntfernen,
  type RouteVorkommen,
} from '@/lib/places/route-einstieg'
import {
  ganzerOrtSucheLesen,
  leererStartzielIntentStand,
  routeIntentEntscheiden,
  startzielIntentAbsendenPruefen,
  startzielIntentAuswahlUebernehmen,
  startzielIntentPlatzhalter,
  startzielIntentSchlangeAbbrechen,
  startzielIntentSchlangeAktiv,
  startzielIntentSchlangeOeffnen,
  startzielIntentStatus,
  startzielIntentTextVerwerfen,
  type GanzerOrtSuche,
  type StartzielIntentStand,
} from '@/lib/places/route-intent'
import { GRENZEN } from '@/lib/trips/schema'
import { cn } from '@/lib/utils'

const FELD_ID = 'travel-idea'

export type StartzielFormSichtProps = {
  vorkommen: RouteVorkommen[]
  sucheText: string
  sucheAuswahl: OrtAuswahl | null
  sucheOffen: boolean
  sucheKey: number
  ersetzenKey: string | null
  meldung: string
  intentStatus?: string
  intentPlatzhalter?: string | null
  intentLaedt?: boolean
  onSuche: (wert: OrtAuswahl | null, roh: string) => void
  onAbsenden: (ereignis: React.FormEvent<HTMLFormElement>) => void
  onWeiteresZiel: () => void
  onEntfernen: (key: string) => void
  onErsetzen: (key: string) => void
  onVerschieben: (key: string, richtung: 'hoch' | 'runter') => void
  onVerwerfen: () => void
  onSchlangeAbbrechen?: () => void
  eingabeRef?: React.Ref<HTMLInputElement>
  weiteresZielRef?: React.Ref<HTMLButtonElement>
}

export function StartzielFormSicht({
  vorkommen,
  sucheText,
  sucheAuswahl,
  sucheOffen,
  sucheKey,
  ersetzenKey,
  meldung,
  intentStatus = '',
  intentPlatzhalter = null,
  intentLaedt = false,
  onSuche,
  onAbsenden,
  onWeiteresZiel,
  onEntfernen,
  onErsetzen,
  onVerschieben,
  onVerwerfen,
  onSchlangeAbbrechen,
  eingabeRef,
  weiteresZielRef,
}: StartzielFormSichtProps) {
  const sucheSichtbar = sucheOffen || vorkommen.length === 0
  const weiteresMoeglich = vorkommen.length > 0 && vorkommen.length < GRENZEN.etappenJeReise
  const pending = routePendingText(sucheText) || Boolean(ersetzenKey) || Boolean(intentStatus)

  return (
    <form
      noValidate
      onSubmit={onAbsenden}
      aria-busy={intentLaedt || undefined}
      className="mt-8 max-w-2xl rounded-[24px] border border-white/15 bg-white p-2 shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
    >
      {vorkommen.length > 0 ? (
        <div className="px-2 pt-2">
          <RouteZielListe
            vorkommen={vorkommen}
            ersetzenKey={ersetzenKey}
            onEntfernen={onEntfernen}
            onErsetzen={onErsetzen}
            onVerschieben={onVerschieben}
          />
        </div>
      ) : null}

      {sucheSichtbar ? (
        <>
          <label htmlFor={FELD_ID} className="sr-only">
            {intentPlatzhalter
              ? intentPlatzhalter
              : vorkommen.length === 0
                ? 'Wohin möchtest du reisen?'
                : 'Weiteres Reiseziel wählen'}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className={cn(
                'relative flex min-w-0 flex-1 items-center gap-3 rounded-[18px] px-3 py-2',
                meldung && 'bg-surface-50 ring-2 ring-danger-600/20',
              )}
            >
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <OrtSuche
                  key={sucheKey}
                  rolle="ziel"
                  variante="hero"
                  value={sucheAuswahl}
                  initialText={sucheText}
                  onChange={onSuche}
                  inputId={FELD_ID}
                  inputRef={eingabeRef}
                  ungueltig={Boolean(meldung)}
                  describedBy={meldung ? feldFehlerId(FELD_ID) : undefined}
                  disabled={intentLaedt}
                  placeholder={
                    intentPlatzhalter
                      ? intentPlatzhalter
                      : vorkommen.length === 0
                        ? 'Wohin möchtest du reisen?'
                        : 'Weiteres Ziel aus der Liste wählen'
                  }
                  inputClassName="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none placeholder:text-ink-650"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={intentLaedt}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40 disabled:translate-y-0 disabled:opacity-70"
            >
              Reise planen
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 px-2 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {weiteresMoeglich ? (
              <button
                ref={weiteresZielRef}
                type="button"
                onClick={onWeiteresZiel}
                className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                Weiteres Ziel
              </button>
            ) : null}
          </div>
          <button
            type="submit"
            disabled={intentLaedt}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40 disabled:translate-y-0 disabled:opacity-70"
          >
            Reise planen
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {intentStatus ? (
        <p role="status" aria-live="polite" aria-atomic="true" className="px-4 pb-1 pt-2 text-sm text-ink-650">
          {intentStatus}
        </p>
      ) : null}

      {intentLaedt ? (
        <p role="status" aria-live="polite" className="px-4 pb-1 pt-1 text-sm text-ink-650">
          Die Angabe wird geprüft.
        </p>
      ) : null}

      {pending && sucheSichtbar ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-1 pt-1">
          {routePendingText(sucheText) || ersetzenKey ? (
            <button
              type="button"
              onClick={onVerwerfen}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Unbestätigten Text verwerfen
            </button>
          ) : null}
          {intentStatus && onSchlangeAbbrechen ? (
            <button
              type="button"
              onClick={onSchlangeAbbrechen}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Erkannte Route verwerfen
            </button>
          ) : null}
        </div>
      ) : null}

      {meldung ? (
        <p
          id={feldFehlerId(FELD_ID)}
          role="alert"
          className="flex items-start gap-1.5 px-4 pb-2 pt-1 text-sm text-danger-600"
        >
          {meldung}
        </p>
      ) : null}
    </form>
  )
}

function intentFelderBewahren(
  bisher: StartzielIntentStand,
  naechste: Omit<StartzielIntentStand, 'intentPhrasen' | 'intentIndex'> &
    Partial<Pick<StartzielIntentStand, 'intentPhrasen' | 'intentIndex'>>,
): StartzielIntentStand {
  return {
    ...naechste,
    intentPhrasen: naechste.intentPhrasen ?? bisher.intentPhrasen,
    intentIndex: naechste.intentIndex ?? bisher.intentIndex,
  }
}

async function ganzerOrtHolen(frage: string, signal: AbortSignal): Promise<GanzerOrtSuche> {
  try {
    const res = await fetch(`/api/search/places?q=${encodeURIComponent(frage)}&rolle=ziel`, { signal })
    let json: unknown = null
    try {
      json = await res.json()
    } catch {
      return { art: 'ausfall' }
    }
    return ganzerOrtSucheLesen(res.status, json)
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') return { art: 'ausfall' }
    return { art: 'ausfall' }
  }
}

export default function StartzielForm() {
  const router = useRouter()
  const [stand, setStand] = React.useState<StartzielIntentStand>(leererStartzielIntentStand)
  const [sucheKey, setSucheKey] = React.useState(0)
  const [laedt, setLaedt] = React.useState(false)
  const eingabe = React.useRef<HTMLInputElement>(null)
  const weiteresZiel = React.useRef<HTMLButtonElement>(null)
  const fokusZiel = React.useRef<'suche' | 'weiteres' | null>(null)
  const standRef = React.useRef(stand)
  const anfrage = React.useRef(0)
  const sucheSteuer = React.useRef<AbortController | null>(null)

  standRef.current = stand

  React.useLayoutEffect(() => {
    if (fokusZiel.current === 'suche') feldInSichtNehmen(eingabe.current)
    if (fokusZiel.current === 'weiteres') feldInSichtNehmen(weiteresZiel.current)
    fokusZiel.current = null
  }, [stand.sucheOffen, stand.vorkommen.length, sucheKey, stand.sucheText])

  React.useEffect(() => {
    return () => {
      sucheSteuer.current?.abort()
    }
  }, [])

  const sucheNeuAufsetzen = (ziel: 'suche' | 'weiteres') => {
    setSucheKey((bisher) => bisher + 1)
    fokusZiel.current = ziel
  }

  const onSuche = (wert: OrtAuswahl | null, roh: string) => {
    if (wert) {
      const naechste = startzielIntentAuswahlUebernehmen(
        { ...standRef.current, sucheText: roh, sucheAuswahl: wert },
        wert,
      )
      setStand(naechste)
      sucheNeuAufsetzen(startzielIntentSchlangeAktiv(naechste) ? 'suche' : 'weiteres')
      return
    }
    setStand((bisher) => ({
      ...bisher,
      sucheAuswahl: null,
      sucheText: roh,
      meldung: roh.trim() ? '' : bisher.meldung,
    }))
  }

  const absenden = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (laedt) return

    const aktuell = standRef.current
    const schlangeAktiv = startzielIntentSchlangeAktiv(aktuell)
    const unbestaetigt = routePendingText(aktuell.sucheText) && !aktuell.sucheAuswahl

    if (!schlangeAktiv && !aktuell.ersetzenKey && unbestaetigt) {
      const frage = aktuell.sucheText
      const id = ++anfrage.current
      sucheSteuer.current?.abort()
      const steuer = new AbortController()
      sucheSteuer.current = steuer
      setLaedt(true)
      const suche = await ganzerOrtHolen(frage, steuer.signal)
      if (id !== anfrage.current) return
      setLaedt(false)

      const entscheidung = routeIntentEntscheiden(frage, suche, aktuell.vorkommen.length)
      if (entscheidung.art === 'zuViele' || entscheidung.art === 'ungueltig') {
        setStand((bisher) => ({
          ...bisher,
          meldung: entscheidung.meldung,
          sucheOffen: true,
        }))
        feldInSichtNehmen(eingabe.current)
        return
      }
      if (entscheidung.art === 'route') {
        setStand((bisher) => startzielIntentSchlangeOeffnen(bisher, entscheidung.phrasen))
        sucheNeuAufsetzen('suche')
        return
      }
      setStand((bisher) => ({
        ...bisher,
        sucheText: entscheidung.phrase,
        sucheAuswahl: null,
        sucheOffen: true,
        meldung: ROUTE_EINSTIEG_MELDUNG.pending,
      }))
      sucheNeuAufsetzen('suche')
      return
    }

    const geprueft = startzielIntentAbsendenPruefen(aktuell)
    if (!geprueft.ok) {
      setStand((bisher) => ({
        ...bisher,
        meldung: geprueft.meldung,
        sucheOffen: true,
      }))
      feldInSichtNehmen(eingabe.current)
      return
    }
    const href = routeEinstiegHref(geprueft.ziele)
    if (!href) {
      setStand((bisher) => ({ ...bisher, meldung: ROUTE_EINSTIEG_MELDUNG.fehlt, sucheOffen: true }))
      feldInSichtNehmen(eingabe.current)
      return
    }
    router.push(href)
  }

  return (
    <StartzielFormSicht
      vorkommen={stand.vorkommen}
      sucheText={stand.sucheText}
      sucheAuswahl={stand.sucheAuswahl}
      sucheOffen={stand.sucheOffen || stand.vorkommen.length === 0}
      sucheKey={sucheKey}
      ersetzenKey={stand.ersetzenKey}
      meldung={stand.meldung}
      intentStatus={startzielIntentStatus(stand)}
      intentPlatzhalter={startzielIntentPlatzhalter(stand)}
      intentLaedt={laedt}
      onSuche={onSuche}
      onAbsenden={absenden}
      onWeiteresZiel={() => {
        setStand((bisher) => ({ ...bisher, sucheOffen: true }))
        fokusZiel.current = 'suche'
      }}
      onEntfernen={(key) => {
        setStand((bisher) => intentFelderBewahren(bisher, startzielVorkommenEntfernen(bisher, key)))
        fokusZiel.current = 'suche'
      }}
      onErsetzen={(key) => {
        setStand((bisher) => {
          const naechste = intentFelderBewahren(bisher, startzielErsetzenStarten(bisher, key))
          if (
            startzielHatUnbestaetigtenEntwurf(bisher) &&
            naechste.meldung === ROUTE_EINSTIEG_MELDUNG.pending
          ) {
            fokusZiel.current = 'suche'
            return naechste
          }
          fokusZiel.current = 'suche'
          return naechste
        })
      }}
      onVerschieben={(key, richtung) => {
        setStand((bisher) => ({
          ...bisher,
          vorkommen: routeVorkommenVerschieben(bisher.vorkommen, key, richtung),
        }))
      }}
      onVerwerfen={() => {
        setStand((bisher) => startzielIntentTextVerwerfen(bisher))
        sucheNeuAufsetzen(stand.vorkommen.length === 0 || startzielIntentSchlangeAktiv(stand) ? 'suche' : 'weiteres')
      }}
      onSchlangeAbbrechen={() => {
        const naechste = startzielIntentSchlangeAbbrechen(standRef.current)
        setStand(naechste)
        sucheNeuAufsetzen(naechste.vorkommen.length === 0 ? 'suche' : 'weiteres')
      }}
      eingabeRef={eingabe}
      weiteresZielRef={weiteresZiel}
    />
  )
}
