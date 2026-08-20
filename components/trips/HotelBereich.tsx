'use client'

// components/trips/HotelBereich.tsx
//
// Hotel- und Quartierbereich im Reise-Arbeitsbereich. Kein Demo, keine Fake-Hotels.

import * as React from 'react'
import { AlertCircle, BedDouble, Loader2, MapPin } from 'lucide-react'

import type { HotelOptionSichtbar, HotelSucheAntwort } from '@/lib/hotels/client-sicht'
import { HOTEL_ABDECKUNGSHINWEIS } from '@/lib/hotels/domain'
import { checkInAus, checkOutAus, hotelSucheEingabeAusReise, naechteZwischen } from '@/lib/hotels/quartier-kontext'
import HotelKarte from '@/components/trips/HotelKarte'
import type { Trip, TripStage } from '@/types/trips'

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

function zeitraumText(anreise: string | null, abreise: string | null) {
  if (!anreise || !abreise) return 'Zeitraum noch offen'
  return `${kurzesDatum.format(alsDatum(anreise))} – ${kurzesDatum.format(alsDatum(abreise))}`
}

function checkInTagId(reise: Trip, etappe: TripStage, checkIn: string | null): string | null {
  if (checkIn) {
    const passend = reise.days.find((tag) => tag.stageId === etappe.id && tag.dayDate === checkIn)
    if (passend) return passend.id
  }
  return reise.days.find((tag) => tag.stageId === etappe.id)?.id ?? null
}

export default function HotelBereich({
  reise,
  onUebernehmen,
}: {
  reise: Trip
  onUebernehmen?: (
    etappe: TripStage,
    option: HotelOptionSichtbar,
    zeitraum: { checkIn: string; checkOut: string },
    dayId: string | null,
  ) => Promise<string | null>
}) {
  if (reise.stages.length === 0) {
    return (
      <section
        aria-label="Unterkunft"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Unterkunft</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Gegend für diese Reise
        </h2>
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Diese Reise hat noch keine Etappe. Sobald ein Ziel feststeht, ordnet Jetnity zuerst die Gegend
          ein – noch bevor konkrete Hotels erscheinen.
        </p>
      </section>
    )
  }

  return (
    <div className="grid gap-6">
      {reise.stages.map((etappe) => (
        <HotelEtappe key={etappe.id} reise={reise} etappe={etappe} onUebernehmen={onUebernehmen} />
      ))}
    </div>
  )
}

function HotelEtappe({
  reise,
  etappe,
  onUebernehmen,
}: {
  reise: Trip
  etappe: TripStage
  onUebernehmen?: (
    etappe: TripStage,
    option: HotelOptionSichtbar,
    zeitraum: { checkIn: string; checkOut: string },
    dayId: string | null,
  ) => Promise<string | null>
}) {
  const [laeuft, setLaeuft] = React.useState(true)
  const [uebernimmt, setUebernimmt] = React.useState(false)
  const [antwort, setAntwort] = React.useState<HotelSucheAntwort | null>(null)
  const [meldung, setMeldung] = React.useState('')

  const eingabe = React.useMemo(() => hotelSucheEingabeAusReise(reise, etappe), [reise, etappe])
  const checkIn = checkInAus(eingabe)
  const checkOut = checkOutAus(eingabe)
  const naechte = naechteZwischen(checkIn, checkOut)

  React.useEffect(() => {
    let aktiv = true
    setLaeuft(true)
    setAntwort(null)
    setMeldung('')

    void fetch('/api/hotels/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(eingabe),
    })
      .then(async (res) => {
        const json = (await res.json()) as HotelSucheAntwort
        if (!aktiv) return
        setAntwort(json)
        if (!res.ok && !json.message) setMeldung('Die Hotelanfrage ist fehlgeschlagen.')
      })
      .catch(() => {
        if (!aktiv) return
        setAntwort({
          status: 'error',
          message: 'Die Hotelanfrage ist gerade nicht erreichbar.',
          coverageNote: HOTEL_ABDECKUNGSHINWEIS,
          quartier: null,
          evidenz: {
            hatOrt: false,
            hatKoordinaten: false,
            hatZeitraum: false,
            hatReiseanker: false,
            hatWegezeiten: false,
            hatTransferzeiten: false,
            hatPraeferenzprofil: false,
          },
          options: [],
        })
      })
      .finally(() => {
        if (aktiv) setLaeuft(false)
      })

    return () => {
      aktiv = false
    }
  }, [eingabe])

  const uebernehmen = async (option: HotelOptionSichtbar) => {
    if (!onUebernehmen || !checkIn || !checkOut || uebernimmt) return
    if (!antwort?.options.some((sichtbar) => sichtbar.id === option.id)) {
      setMeldung('Diese Hoteloption stammt nicht aus der aktuellen Suche.')
      return
    }
    setUebernimmt(true)
    setMeldung('')
    const fehler = await onUebernehmen(
      etappe,
      option,
      { checkIn, checkOut },
      checkInTagId(reise, etappe, checkIn),
    )
    setUebernimmt(false)
    if (fehler) setMeldung(fehler)
  }

  const hotelZustand = antwort?.status
  const quartierSichtbar = Boolean(antwort?.quartier && antwort.evidenz.hatOrt && antwort.evidenz.hatKoordinaten)

  return (
    <section
      aria-label={`Unterkunft ${etappe.name}`}
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Unterkunft</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            {etappe.name}
          </h2>
          <p className="mt-1 text-sm text-ink-800">
            {zeitraumText(checkIn, checkOut)}
            {naechte ? ` · ${naechte} ${naechte === 1 ? 'Nacht' : 'Nächte'}` : ''}
          </p>
        </div>
        <BedDouble className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {laeuft && (
        <p aria-busy="true" className="mt-5 flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm text-ink-800">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600" />
          Jetnity ordnet die Gegend für diese Etappe ein.
        </p>
      )}

      {!laeuft && antwort && (
        <div className="mt-5 grid gap-4">
          {quartierSichtbar && antwort.quartier && (
            <div className="rounded-2xl bg-surface-25 px-4 py-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Gegend
              </p>
              <p className="mt-2 text-base font-semibold text-brand-800">
                {antwort.quartier.herkunft === 'quartiervorschlag'
                  ? `Jetnity empfiehlt: in oder nahe ${antwort.quartier.name}`
                  : `Jetnity sucht in ${antwort.quartier.name}. Ein genaueres Viertel folgt, sobald mehr Ortsdaten vorliegen.`}
              </p>
              {antwort.quartier.reasons.length > 0 && (
                <ul className="mt-2 grid gap-1.5">
                  {antwort.quartier.reasons.map((grund) => (
                    <li key={grund} className="text-sm leading-6 text-ink-800">
                      {grund}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!quartierSichtbar && (
            <p className="rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
              Für {etappe.name} fehlen noch belastbare Orts- oder Koordinatendaten. Jetnity rät deshalb
              keine feinere Gegend.
            </p>
          )}

          {hotelZustand === 'unavailable' && (
            <p role="status" className="rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
              {antwort.message}
            </p>
          )}

          {hotelZustand === 'empty' && (
            <p className="rounded-2xl bg-surface-25 px-4 py-6 text-center text-sm leading-6 text-ink-800">
              {antwort.message}
            </p>
          )}

          {(hotelZustand === 'timeout' ||
            hotelZustand === 'error' ||
            hotelZustand === 'invalid' ||
            hotelZustand === 'rate_limited') && (
            <p role="status" className="flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              {antwort.message}
            </p>
          )}

          {antwort.options.length > 0 && (
            <ol className="grid gap-3">
              {antwort.options.map((option) => (
                <li key={option.id}>
                  <HotelKarte
                    option={option}
                    laeuft={uebernimmt}
                    onUebernehmen={
                      onUebernehmen && checkIn && checkOut ? () => void uebernehmen(option) : undefined
                    }
                  />
                </li>
              ))}
            </ol>
          )}

          <p className="text-xs leading-5 text-ink-700">{antwort.coverageNote || HOTEL_ABDECKUNGSHINWEIS}</p>
        </div>
      )}

      {meldung && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      )}
    </section>
  )
}
