'use client'

import * as React from 'react'
import { BedDouble } from 'lucide-react'

import BuchungsSiegel from '@/components/trips/BuchungsSiegel'
import { kannBuchungMarkieren } from '@/lib/trips/buchung'
import { zeitraumKurz } from '@/lib/trips/datum-anzeige'
import { unterkunftAbdeckung } from '@/lib/trips/naechte-abdeckung'
import type { Trip, TripItem } from '@/types/trips'

export default function UnterkunftBestand({
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
  const abdeckung = unterkunftAbdeckung(reise, ohneTag)

  const setzen = async (itemId: string, gebucht: boolean) => {
    if (!onBuchungsstatus || laeuft) return
    setMeldung('')
    setLaeuft(itemId)
    const fehler = await onBuchungsstatus(itemId, gebucht)
    setLaeuft(null)
    if (fehler) setMeldung(fehler)
  }

  const kopf =
    abdeckung.bekannt && abdeckung.naechteGesamt !== null && abdeckung.naechteAbgedeckt !== null
      ? `${abdeckung.naechteAbgedeckt} von ${abdeckung.naechteGesamt} Nächten abgedeckt`
      : abdeckung.zusammenfassung

  return (
    <section
      aria-label="Deine Unterkunft"
      className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Unterkunft</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Nächte-Abdeckung
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-800">{kopf}</p>
        </div>
        <BedDouble className="h-5 w-5 text-brand-600" aria-hidden="true" />
      </div>

      {abdeckung.aufenthalte.length === 0 && abdeckung.luecken.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          {abdeckung.bekannt
            ? 'Noch keine Unterkunft ausgewählt.'
            : 'Die Nächte-Abdeckung ist aus den vorliegenden Reisedaten noch nicht vollständig bestimmbar.'}
        </p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {abdeckung.aufenthalte.map((aufenthalt) => (
            <li
              key={aufenthalt.item.id}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800 break-words">{aufenthalt.item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  {zeitraumKurz(aufenthalt.start, aufenthalt.end)}
                  {aufenthalt.naechte ? ` · ${aufenthalt.naechte} ${aufenthalt.naechte === 1 ? 'Nacht' : 'Nächte'}` : ''}
                  {aufenthalt.ausserhalb ? ' · ausserhalb des Reisezeitraums' : ''}
                </p>
              </div>
              <div className="flex min-h-11 flex-wrap items-center gap-2">
                <BuchungsSiegel status={aufenthalt.status} />
                {kannBuchungMarkieren(aufenthalt.item) && onBuchungsstatus ? (
                  <button
                    type="button"
                    disabled={laeuft === aufenthalt.item.id}
                    onClick={() => void setzen(aufenthalt.item.id, aufenthalt.status !== 'booked')}
                    className="inline-flex min-h-11 items-center rounded-full border border-line-300 bg-white px-3 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50"
                  >
                    {aufenthalt.status === 'booked' ? 'Buchung korrigieren' : 'Als gebucht markieren'}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {abdeckung.luecken.map((luecke) => (
            <li
              key={`${luecke.start}:${luecke.end}:${luecke.stageId ?? 'reise'}`}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-dashed border-line-300 bg-surface-25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800">
                  {zeitraumKurz(luecke.start, luecke.end)}
                  {luecke.stageName ? ` · ${luecke.stageName}` : ''}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-800">
                  {luecke.naechte} {luecke.naechte === 1 ? 'Nacht fehlt' : 'Nächte fehlen'}
                </p>
              </div>
              <BuchungsSiegel status="open" />
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
