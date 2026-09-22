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
  routeAbsendenPruefen,
  routeEinstiegHref,
  routePendingText,
  routeVorkommenEntfernen,
  routeVorkommenErsetzen,
  routeVorkommenHinzufuegen,
  routeVorkommenVerschieben,
  type RouteVorkommen,
} from '@/lib/places/route-einstieg'
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
  onSuche: (wert: OrtAuswahl | null, roh: string) => void
  onAbsenden: (ereignis: React.FormEvent<HTMLFormElement>) => void
  onWeiteresZiel: () => void
  onEntfernen: (key: string) => void
  onErsetzen: (key: string) => void
  onVerschieben: (key: string, richtung: 'hoch' | 'runter') => void
  onVerwerfen: () => void
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
  onSuche,
  onAbsenden,
  onWeiteresZiel,
  onEntfernen,
  onErsetzen,
  onVerschieben,
  onVerwerfen,
  eingabeRef,
  weiteresZielRef,
}: StartzielFormSichtProps) {
  const sucheSichtbar = sucheOffen || vorkommen.length === 0
  const weiteresMoeglich = vorkommen.length > 0 && vorkommen.length < GRENZEN.etappenJeReise
  const pending = routePendingText(sucheText) || Boolean(ersetzenKey)

  return (
    <form
      noValidate
      onSubmit={onAbsenden}
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
            {vorkommen.length === 0 ? 'Wohin möchtest du reisen?' : 'Weiteres Reiseziel wählen'}
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
                  placeholder={
                    vorkommen.length === 0
                      ? 'Wohin möchtest du reisen?'
                      : 'Weiteres Ziel aus der Liste wählen'
                  }
                  inputClassName="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none placeholder:text-ink-650"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40"
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
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40"
          >
            Reise planen
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {pending && sucheSichtbar ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-1 pt-1">
          <button
            type="button"
            onClick={onVerwerfen}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line-200 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            Unbestätigten Text verwerfen
          </button>
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

export default function StartzielForm() {
  const router = useRouter()
  const [vorkommen, setVorkommen] = React.useState<RouteVorkommen[]>([])
  const [sucheText, setSucheText] = React.useState('')
  const [sucheAuswahl, setSucheAuswahl] = React.useState<OrtAuswahl | null>(null)
  const [sucheOffen, setSucheOffen] = React.useState(true)
  const [sucheKey, setSucheKey] = React.useState(0)
  const [ersetzenKey, setErsetzenKey] = React.useState<string | null>(null)
  const [meldung, setMeldung] = React.useState('')
  const [naechsterKey, setNaechsterKey] = React.useState(1)
  const eingabe = React.useRef<HTMLInputElement>(null)
  const weiteresZiel = React.useRef<HTMLButtonElement>(null)
  const fokusZiel = React.useRef<'suche' | 'weiteres' | null>(null)

  React.useLayoutEffect(() => {
    if (fokusZiel.current === 'suche') feldInSichtNehmen(eingabe.current)
    if (fokusZiel.current === 'weiteres') feldInSichtNehmen(weiteresZiel.current)
    fokusZiel.current = null
  }, [sucheOffen, vorkommen.length, sucheKey])

  const sucheZuruecksetzen = (fokus: 'suche' | 'weiteres') => {
    setSucheText('')
    setSucheAuswahl(null)
    setErsetzenKey(null)
    setSucheKey((bisher) => bisher + 1)
    setSucheOffen(fokus === 'suche')
    fokusZiel.current = fokus
  }

  const auswahlUebernehmen = (wert: OrtAuswahl) => {
    if (ersetzenKey) {
      setVorkommen((bisher) => routeVorkommenErsetzen(bisher, ersetzenKey, wert))
    } else {
      const key = String(naechsterKey)
      setNaechsterKey((bisher) => bisher + 1)
      setVorkommen((bisher) => routeVorkommenHinzufuegen(bisher, wert, key))
    }
    setMeldung('')
    sucheZuruecksetzen('weiteres')
  }

  const onSuche = (wert: OrtAuswahl | null, roh: string) => {
    setSucheAuswahl(wert)
    setSucheText(roh)
    if (wert) {
      auswahlUebernehmen(wert)
      return
    }
    if (roh.trim()) setMeldung('')
  }

  const absenden = (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    const geprueft = routeAbsendenPruefen(vorkommen, sucheText, ersetzenKey)
    if (!geprueft.ok) {
      setMeldung(geprueft.meldung)
      if (vorkommen.length === 0 || routePendingText(sucheText) || ersetzenKey) {
        setSucheOffen(true)
        feldInSichtNehmen(eingabe.current)
      }
      return
    }
    const href = routeEinstiegHref(geprueft.ziele)
    if (!href) {
      setMeldung(ROUTE_EINSTIEG_MELDUNG.fehlt)
      feldInSichtNehmen(eingabe.current)
      return
    }
    router.push(href)
  }

  return (
    <StartzielFormSicht
      vorkommen={vorkommen}
      sucheText={sucheText}
      sucheAuswahl={sucheAuswahl}
      sucheOffen={sucheOffen || vorkommen.length === 0}
      sucheKey={sucheKey}
      ersetzenKey={ersetzenKey}
      meldung={meldung}
      onSuche={onSuche}
      onAbsenden={absenden}
      onWeiteresZiel={() => {
        setSucheOffen(true)
        setSucheKey((bisher) => bisher + 1)
        fokusZiel.current = 'suche'
      }}
      onEntfernen={(key) => {
        const naechste = routeVorkommenEntfernen(vorkommen, key)
        setVorkommen(naechste)
        if (ersetzenKey === key) {
          setErsetzenKey(null)
          setSucheText('')
          setSucheAuswahl(null)
        }
        setMeldung('')
        if (naechste.length === 0) {
          sucheZuruecksetzen('suche')
          return
        }
        fokusZiel.current = 'weiteres'
      }}
      onErsetzen={(key) => {
        const ziel = vorkommen.find((eintrag) => eintrag.key === key)
        setErsetzenKey(key)
        setSucheAuswahl(null)
        setSucheText(ziel?.ort?.name ?? '')
        setSucheOffen(true)
        setSucheKey((bisher) => bisher + 1)
        setMeldung('')
        fokusZiel.current = 'suche'
      }}
      onVerschieben={(key, richtung) => {
        setVorkommen((bisher) => routeVorkommenVerschieben(bisher, key, richtung))
      }}
      onVerwerfen={() => {
        setMeldung('')
        sucheZuruecksetzen(vorkommen.length === 0 ? 'suche' : 'weiteres')
      }}
      eingabeRef={eingabe}
      weiteresZielRef={weiteresZiel}
    />
  )
}
