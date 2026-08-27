'use client'

import * as React from 'react'
import {
  BedDouble,
  CalendarDays,
  Car,
  Clock3,
  Plane,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react'

import {
  ART_BEZEICHNUNG,
  betragLesbar,
} from '@/lib/trips/bezeichnungen'
import { GRENZEN, planpunktFormularSchema, type PlanpunktFormular } from '@/lib/trips/schema'
import { ersterTagDerEtappe, timelineAbleiten } from '@/lib/trips/timeline'
import { cn } from '@/lib/utils'
import { TRIP_ITEM_KINDS, type Trip, type TripItem, type TripItemKind } from '@/types/trips'

const langesDatum = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

const ART_SYMBOL: Record<TripItemKind, React.ComponentType<{ className?: string }>> = {
  flight: Plane,
  stay: BedDouble,
  activity: Sparkles,
  transfer: Car,
  rental_car: Car,
  note: StickyNote,
}

export default function TripWorkspacePlan({
  reise,
  ohneTag,
  aktiverTag,
  kompakt,
  eingebettet = false,
  onTagWechseln,
  onPunktAnlegen,
  onPunktEntfernen,
  onPunktOeffnen,
  gewaehlterPunktId,
}: {
  reise: Trip
  ohneTag: TripItem[]
  aktiverTag: string
  kompakt: boolean
  eingebettet?: boolean
  onTagWechseln: (tagId: string) => void
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Promise<string | null>
  onPunktEntfernen: (tagId: string, punktId: string) => Promise<string | null>
  onPunktOeffnen?: (punktId: string) => void
  gewaehlterPunktId?: string
}) {
  const [formularOffen, setFormularOffen] = React.useState(false)
  const [art, setArt] = React.useState<TripItemKind>('activity')
  const [titel, setTitel] = React.useState('')
  const [zeit, setZeit] = React.useState('')
  const [notiz, setNotiz] = React.useState('')
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)

  const timeline = timelineAbleiten(reise, ohneTag, aktiverTag)
  const tag = timeline.gewaehlterTag

  React.useEffect(() => {
    setFormularOffen(false)
    setTitel('')
    setZeit('')
    setNotiz('')
    setArt('activity')
    setMeldung('')
  }, [aktiverTag])

  const zurueck = () => {
    setTitel('')
    setZeit('')
    setNotiz('')
    setArt('activity')
    setFormularOffen(false)
  }

  const anlegen = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (!tag || laeuft) return

    const geprueft = planpunktFormularSchema.safeParse({
      kind: art,
      title: titel,
      note: notiz,
      startsAt: zeit || null,
    })

    if (!geprueft.success) {
      setMeldung(geprueft.error.issues[0]?.message ?? 'Bitte prüfe deine Angaben.')
      return
    }

    setMeldung('')
    setLaeuft(true)
    const fehler = await onPunktAnlegen(tag.id, geprueft.data)
    setLaeuft(false)

    if (fehler) {
      setMeldung(fehler)
      return
    }

    zurueck()
  }

  const entfernen = async (tagId: string, punktId: string) => {
    if (laeuft) return
    setMeldung('')
    setLaeuft(true)
    const fehler = await onPunktEntfernen(tagId, punktId)
    setLaeuft(false)
    if (fehler) setMeldung(fehler)
  }

  const tagesKopf = tag && (
    <div
      className={cn(
        'flex flex-col justify-between gap-4',
        kompakt ? '' : 'sm:flex-row sm:items-center',
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          Tag {tag.dayIndex}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800">
          {tag.dayDate ? langesDatum.format(alsDatum(tag.dayDate)) : (tag.title ?? 'Noch ohne Datum')}
        </h3>
      </div>
      <button
        type="button"
        onClick={() => setFormularOffen((offen) => !offen)}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Punkt hinzufügen
      </button>
    </div>
  )

  const tagesFelder = tag && (
    <>
      {formularOffen && (
        <form onSubmit={anlegen} className="mt-5 rounded-2xl border border-line-200 bg-surface-0 p-4">
          <fieldset className="min-w-0">
            <legend className="text-xs font-medium text-ink-900">Art</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TRIP_ITEM_KINDS.map((option) => {
                const Symbol = ART_SYMBOL[option]
                const gewaehlt = art === option
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={gewaehlt}
                    onClick={() => setArt(option)}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                      gewaehlt
                        ? 'border-brand-800 bg-brand-800 text-white'
                        : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
                    )}
                  >
                    <Symbol className="h-3.5 w-3.5" aria-hidden="true" />
                    {ART_BEZEICHNUNG[option]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)]">
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
              Uhrzeit
              <input
                type="time"
                value={zeit}
                onChange={(ereignis) => setZeit(ereignis.target.value)}
                className="h-11 w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 text-base outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
              />
            </label>
            <label className="grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
              Ort oder Aktivität
              <input
                value={titel}
                onChange={(ereignis) => setTitel(ereignis.target.value)}
                required
                maxLength={GRENZEN.titel}
                autoFocus
                placeholder="z. B. Tsukiji Outer Market"
                className="h-11 w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 text-base outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
              />
            </label>
          </div>
          <label className="mt-3 grid min-w-0 gap-1.5 text-xs font-medium text-ink-900">
            Notiz, optional
            <textarea
              value={notiz}
              onChange={(ereignis) => setNotiz(ereignis.target.value)}
              rows={3}
              maxLength={GRENZEN.notiz}
              placeholder="Reservierung, Treffpunkt oder persönliche Notiz"
              className="w-full min-w-0 rounded-xl border border-line-200 bg-white px-3 py-2.5 text-base outline-none placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 pointer-fine:text-sm"
            />
          </label>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={zurueck}
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-ink-800 hover:bg-white"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={laeuft}
              className="inline-flex min-h-11 items-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-60"
            >
              {laeuft ? 'Speichern …' : 'Speichern'}
            </button>
          </div>
        </form>
      )}

      {meldung && (
        <p role="alert" className="mt-5 rounded-2xl bg-surface-50 px-4 py-3 text-sm text-danger-600">
          {meldung}
        </p>
      )}

      {tag.items.length === 0 ? (
        <div className={kompakt ? 'py-8 text-center' : 'py-10 text-center'}>
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-semibold text-brand-800">Dieser Tag gehört dir.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-700">
            Füge einen Ort, eine Aktivität oder einfach freie Zeit hinzu. Jetnity ordnet alles chronologisch.
          </p>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {tag.items.map((punkt) => (
            <Planpunkt
              key={punkt.id}
              punkt={punkt}
              gesperrt={laeuft}
              gewaehlt={gewaehlterPunktId === punkt.id}
              onOeffnen={onPunktOeffnen ? () => onPunktOeffnen(punkt.id) : undefined}
              onEntfernen={() => entfernen(tag.id, punkt.id)}
            />
          ))}
        </ol>
      )}
    </>
  )

  return (
    <section
      aria-label="Tagesplan"
      data-tagesplan-modul="ein"
      className={cn(
        'min-w-0 rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_18px_60px_rgba(15,46,42,0.06)]',
        eingebettet ? 'mt-1' : 'mt-5',
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Tagesplan</p>
        <p className="mt-1 text-sm text-ink-900">{timeline.planText}</p>
      </div>

      {!timeline.hatTage ? (
        <p className="mt-4 text-sm leading-6 text-ink-700">
          Diese Reise hat noch keine Tage. Sie entstehen, sobald ein Zeitraum feststeht.
        </p>
      ) : (
        <ol className="mt-4 grid min-w-0 gap-4">
          {timeline.etappen.map((etappe) => {
            const ersterTag = ersterTagDerEtappe(timeline.etappen, etappe.stageId)
            const etappeAktiv = etappe.tage.some((eintrag) => eintrag.id === timeline.gewaehlterTagId)
            return (
              <li
                key={etappe.stageId ?? 'ohne-etappe'}
                data-timeline-etappe={etappe.stageId ?? 'ohne'}
                className="min-w-0"
              >
                <button
                  type="button"
                  disabled={!ersterTag}
                  onClick={() => ersterTag && onTagWechseln(ersterTag)}
                  className={cn(
                    'flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-2xl px-1 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-default',
                    etappeAktiv ? 'text-brand-800' : 'text-ink-800',
                  )}
                >
                  <span className="min-w-0">
                    <strong className="block hyphens-auto break-words text-sm font-semibold">{etappe.name}</strong>
                    <span className="mt-0.5 block text-xs text-ink-700">
                      {etappe.istNutzerziel
                        ? etappe.arrivalDate || etappe.departureDate
                          ? [etappe.arrivalDate, etappe.departureDate].filter(Boolean).join(' – ')
                          : 'Ziel dieser Reise – Aufenthalt noch nicht festgelegt'
                        : 'Tage ohne festgelegten Aufenthalt'}
                    </span>
                  </span>
                </button>
                {etappe.tage.length > 0 && (
                  <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    {etappe.tage.map((eintrag) => {
                      const gewaehlt = timeline.gewaehlterTagId === eintrag.id
                      return (
                        <button
                          key={eintrag.id}
                          type="button"
                          aria-current={gewaehlt ? 'date' : undefined}
                          data-timeline-tag={eintrag.id}
                          onClick={() => onTagWechseln(eintrag.id)}
                          className={cn(
                            'inline-flex min-h-11 min-w-[6.5rem] flex-col justify-center rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                            gewaehlt
                              ? 'border-brand-800 bg-brand-800 text-white'
                              : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
                          )}
                        >
                          <strong className="block text-sm font-semibold">
                            {eintrag.title ?? `Tag ${eintrag.dayIndex}`}
                          </strong>
                          <span className="mt-0.5 block text-xs opacity-70">
                            {eintrag.dayDate ? kurzesDatum.format(alsDatum(eintrag.dayDate)) : 'Ohne Datum'}
                            {eintrag.items.length > 0 ? ` · ${eintrag.items.length}` : ''}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {tag && (
        <div className="mt-4 min-w-0 border-t border-line-200 pt-4">
          {tagesKopf}
          {tagesFelder}
        </div>
      )}

      {timeline.ungeplante.length > 0 && (
        <div className="mt-5 border-t border-line-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">
            Noch nicht eingeplant
          </p>
          <ol className="mt-4 space-y-3">
            {timeline.ungeplante.map((punkt) => (
              <Planpunkt
                key={punkt.id}
                punkt={punkt}
                gesperrt={laeuft}
                gewaehlt={gewaehlterPunktId === punkt.id}
                onOeffnen={onPunktOeffnen ? () => onPunktOeffnen(punkt.id) : undefined}
                onEntfernen={() => entfernen('', punkt.id)}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function Planpunkt({
  punkt,
  gesperrt,
  gewaehlt,
  onOeffnen,
  onEntfernen,
}: {
  punkt: TripItem
  gesperrt: boolean
  gewaehlt?: boolean
  onOeffnen?: () => void
  onEntfernen: () => void
}) {
  const Symbol = punkt.startsAt ? Clock3 : ART_SYMBOL[punkt.kind]
  const inhalt = (
    <>
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-50 text-brand-600 sm:h-9 sm:w-9"
        title={ART_BEZEICHNUNG[punkt.kind]}
      >
        <Symbol className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {punkt.startsAt && <span className="text-xs font-semibold text-brand-600">{punkt.startsAt}</span>}
          <span className="text-xs text-ink-700">{ART_BEZEICHNUNG[punkt.kind]}</span>
        </span>
        <strong className="block hyphens-auto break-words text-sm font-semibold text-brand-800">
          {punkt.title}
        </strong>
        {punkt.note && (
          <span className="mt-1 block hyphens-auto break-words text-xs leading-5 text-ink-700">
            {punkt.note}
          </span>
        )}
        {punkt.priceAmount !== null && punkt.priceCurrency && (
          <span className="mt-1 block text-xs font-semibold text-brand-700">
            {betragLesbar(punkt.priceAmount, punkt.priceCurrency)}
            {punkt.kind === 'flight' ? ' · zum Auswahlzeitpunkt' : ''}
          </span>
        )}
      </span>
    </>
  )

  return (
    <li className="group flex gap-3 rounded-2xl border border-line-200 p-3 transition hover:border-line-300 sm:gap-4 sm:p-4">
      {onOeffnen ? (
        <button
          type="button"
          aria-expanded={gewaehlt || false}
          onClick={onOeffnen}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {inhalt}
        </button>
      ) : (
        inhalt
      )}
      <button
        type="button"
        onClick={onEntfernen}
        disabled={gesperrt}
        aria-label={`${punkt.title} entfernen`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-600 opacity-70 transition hover:bg-surface-50 hover:text-danger-600 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-40 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
