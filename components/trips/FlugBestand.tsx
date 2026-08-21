'use client'

import * as React from 'react'
import { Plane } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { datumKurz } from '@/lib/trips/datum-anzeige'
import { flugAbdeckung, type FlugAbschnitt } from '@/lib/trips/flug-abdeckung'
import type { Trip, TripItem } from '@/types/trips'

function abschnittTitel(abschnitt: FlugAbschnitt): string {
  const route = `${abschnitt.originName} → ${abschnitt.destinationName}`
  return abschnitt.date ? `${route} · ${datumKurz(abschnitt.date)}` : route
}

export default function FlugBestand({
  reise,
  ohneTag = [],
  onBuchungsstatus,
}: {
  reise: Trip
  ohneTag?: readonly TripItem[]
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
}) {
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState<string | null>(null)
  const abdeckung = flugAbdeckung(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  return (
    <section
      aria-label="Deine Flüge"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Flüge</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Bestand und Status
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-800">{abdeckung.zusammenfassung}</p>
        </div>
        <Plane className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {abdeckung.abschnitte.length === 0 && abdeckung.unzugeordnet.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          {abdeckung.bestimmbar
            ? 'Für diese Reise ist kein Flugabschnitt erforderlich, oder es liegt noch keiner vor.'
            : 'Die benötigten Flugabschnitte sind aus den vorliegenden Reisedaten noch nicht vollständig bestimmbar.'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {abdeckung.abschnitte.map((abschnitt) => (
            <li
              key={abschnitt.id}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800 break-words">{abschnittTitel(abschnitt)}</p>
                {abschnitt.item ? (
                  <p className="mt-0.5 text-xs leading-5 text-ink-800 break-words">{abschnitt.item.title}</p>
                ) : null}
              </div>
              <div className="flex min-h-11 flex-wrap items-center gap-2">
                <BuchungsSiegel status={abschnitt.status} />
                {abschnitt.item && kannBuchungMarkieren(abschnitt.item) && onBuchungsstatus ? (
                  <button
                    type="button"
                    disabled={laeuft === abschnitt.item.id}
                    onClick={() => void setzen(abschnitt.item!.id, abschnitt.status !== 'booked')}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                  >
                    {abschnitt.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {abdeckung.unzugeordnet.map((item) => (
            <li
              key={item.id}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800 break-words">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  Noch keinem Reiseabschnitt sicher zuordenbar
                </p>
              </div>
              <div className="flex min-h-11 flex-wrap items-center gap-2">
                <BuchungsSiegel status={item.bookingStatus === 'booked' ? 'booked' : 'selected'} />
                {kannBuchungMarkieren(item) && onBuchungsstatus ? (
                  <button
                    type="button"
                    disabled={laeuft === item.id}
                    onClick={() => void setzen(item.id, item.bookingStatus !== 'booked')}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                  >
                    {item.bookingStatus === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {meldung ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {meldung}
        </p>
      ) : null}
    </section>
  )
}
