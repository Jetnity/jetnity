'use client'

import * as React from 'react'

import './multi-stop-create-day-allocation-1/allocation.css'

export type TageszuordnungZiel = {
  key: string
  position: number
  label: string
}

export type TageszuordnungAnspruch = {
  occurrenceKey: string
  startDate: string
  endDate: string
}

type TripStageDayAllocationProps = {
  ziele: readonly TageszuordnungZiel[]
  startDate: string
  endDate: string
  aktiv: boolean
  ansprueche: readonly TageszuordnungAnspruch[]
  zugeordnet: number
  ohneZiel: number
  reisetage: number
  /** Ein zu langer Zeitraum wird nicht als gekürzte Reise ausgesprochen. */
  zeitraumZuLang?: boolean
  fehler?: string
  hinweis?: string
  disabled?: boolean
  onAktiv: (aktiv: boolean) => void
  onAnspruch: (key: string, teil: { startDate?: string; endDate?: string }) => void
  onZuruecksetzen: () => void
}

function anspruchVon(
  ansprueche: readonly TageszuordnungAnspruch[],
  key: string,
): TageszuordnungAnspruch {
  return (
    ansprueche.find((eintrag) => eintrag.occurrenceKey === key) ?? {
      occurrenceKey: key,
      startDate: '',
      endDate: '',
    }
  )
}

export default function TripStageDayAllocation({
  ziele,
  startDate,
  endDate,
  aktiv,
  ansprueche,
  zugeordnet,
  ohneZiel,
  reisetage,
  zeitraumZuLang,
  fehler,
  hinweis,
  disabled,
  onAktiv,
  onAnspruch,
  onZuruecksetzen,
}: TripStageDayAllocationProps) {
  const schalter = React.useRef<HTMLInputElement>(null)
  const zeitraumBereit = Boolean(startDate && endDate && startDate <= endDate)

  return (
    <section aria-labelledby="planen-gruppe-tage" className="tageszuordnung" data-zuordnung-root="">
      <h3
        id="planen-gruppe-tage"
        className="min-w-0 max-w-full break-words border-b border-line-200 pb-2 text-base font-semibold tracking-[-0.02em] text-brand-900"
      >
        Tage den Zielen zuordnen
      </h3>
      <p className="max-w-full break-words text-sm leading-6 text-ink-800">
        Optional. Ohne diese Wahl bleiben die Tage ohne Ziel. Kalendertage sind keine Hotel-Nächte
        und keine Flug- oder Transferzeiten.
      </p>
      {!zeitraumBereit ? (
        <p className="max-w-full break-words text-sm leading-6 text-ink-700">
          Sobald Abreise und Rückreise festliegen, kannst du die vorhandenen Tage auf die bestätigten
          Ziele verteilen.
        </p>
      ) : (
        <>
          <label className="flex min-h-11 min-w-0 max-w-full items-start gap-3 break-words text-sm font-medium text-brand-800">
            <input
              ref={schalter}
              id="zuordnung-aktiv"
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-brand-800"
              checked={aktiv}
              disabled={disabled}
              aria-describedby="zuordnung-stand"
              onChange={(ereignis) => onAktiv(ereignis.target.checked)}
            />
            <span className="min-w-0 flex-1">Vorhandene Tage ausdrücklich auf die Ziele verteilen</span>
          </label>
          <p id="zuordnung-stand" className="max-w-full break-words text-sm leading-6 text-ink-800" aria-live="polite">
            {zeitraumZuLang
              ? 'Dieser Zeitraum ist länger als erlaubt. Die Tage werden nicht gekürzt und nicht gespeichert.'
              : aktiv
                ? `${zugeordnet} Tage zugeordnet, ${ohneZiel} ohne Ziel. Die Reise bleibt ${reisetage} Tage.`
                : `Noch keine Tageszuordnung. Die Reise hat ${reisetage} Tage.`}
          </p>
          {aktiv ? (
            <div className="tageszuordnung-liste">
              {ziele.map((ziel) => {
                const anspruch = anspruchVon(ansprueche, ziel.key)
                const vonId = `zuordnung-${ziel.key}-von`
                const bisId = `zuordnung-${ziel.key}-bis`
                return (
                  <fieldset key={ziel.key} className="min-w-0 max-w-full" data-zuordnung-ziel={ziel.key}>
                    <legend className="sr-only">
                      {ziel.position}. {ziel.label}
                    </legend>
                    <div className="tageszuordnung-zeile">
                    <p className="tageszuordnung-ziel text-sm font-semibold text-brand-900">
                      {ziel.position}. {ziel.label}
                    </p>
                    <label className="tageszuordnung-feld text-sm font-medium text-brand-800" htmlFor={vonId}>
                      <span>Von</span>
                      <input
                        id={vonId}
                        type="date"
                        value={anspruch.startDate}
                        min={startDate}
                        max={endDate}
                        disabled={disabled}
                        aria-invalid={Boolean(fehler) || undefined}
                        aria-describedby={fehler ? 'zuordnung-fehler' : undefined}
                        onChange={(ereignis) => onAnspruch(ziel.key, { startDate: ereignis.target.value })}
                        className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-line-200 bg-surface-0 px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
                      />
                    </label>
                    <label className="tageszuordnung-feld text-sm font-medium text-brand-800" htmlFor={bisId}>
                      <span>Bis</span>
                      <input
                        id={bisId}
                        type="date"
                        value={anspruch.endDate}
                        min={startDate}
                        max={endDate}
                        disabled={disabled}
                        aria-invalid={Boolean(fehler) || undefined}
                        aria-describedby={fehler ? 'zuordnung-fehler' : undefined}
                        onChange={(ereignis) => onAnspruch(ziel.key, { endDate: ereignis.target.value })}
                        className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-line-200 bg-surface-0 px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
                      />
                    </label>
                    </div>
                  </fieldset>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  onZuruecksetzen()
                  schalter.current?.focus()
                }}
                disabled={disabled}
                className="inline-flex min-h-11 w-fit max-w-full items-center justify-center break-words rounded-full border border-line-200 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-50"
              >
                Zuordnung zurücksetzen
              </button>
            </div>
          ) : null}
        </>
      )}
      {hinweis ? (
        <p className="max-w-full break-words text-sm leading-6 text-ink-800" role="status">
          {hinweis}
        </p>
      ) : null}
      {fehler ? (
        <p id="zuordnung-fehler" className="max-w-full break-words text-sm font-medium leading-6 text-red-700" role="alert">
          {fehler}
        </p>
      ) : null}
    </section>
  )
}
