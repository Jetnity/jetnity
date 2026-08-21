'use client'

import * as React from 'react'
import {
  BedDouble,
  CalendarDays,
  Car,
  ChevronRight,
  Clock3,
  Plane,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react'

import {
  ART_BEZEICHNUNG,
  INTERESSE_BEZEICHNUNG,
  TEMPO_BEZEICHNUNG,
  betragLesbar,
} from '@/lib/trips/bezeichnungen'
import { GRENZEN, planpunktFormularSchema, type PlanpunktFormular } from '@/lib/trips/schema'
import { ScrollRow } from '@/components/ui/scroll-row'
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
  note: StickyNote,
}

export default function TripWorkspacePlan({
  reise,
  ohneTag,
  aktiverTag,
  kompakt,
  onTagWechseln,
  onPunktAnlegen,
  onPunktEntfernen,
}: {
  reise: Trip
  ohneTag: TripItem[]
  aktiverTag: string
  kompakt: boolean
  onTagWechseln: (tagId: string) => void
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Promise<string | null>
  onPunktEntfernen: (tagId: string, punktId: string) => Promise<string | null>
}) {
  const [formularOffen, setFormularOffen] = React.useState(false)
  const [art, setArt] = React.useState<TripItemKind>('activity')
  const [titel, setTitel] = React.useState('')
  const [zeit, setZeit] = React.useState('')
  const [notiz, setNotiz] = React.useState('')
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)

  const tag = reise.days.find((eintrag) => eintrag.id === aktiverTag) ?? reise.days[0]
  const punkteGesamt = reise.days.reduce((summe, eintrag) => summe + eintrag.items.length, 0)

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

  const tagesInhalt = (
    <section
      aria-label="Gewählter Reisetag"
      className="min-w-0 rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
      {tag ? (
        <>
          <div className="flex flex-col justify-between gap-4 border-b border-line-200 pb-5 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
                Tag {tag.dayIndex}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
                {tag.dayDate ? langesDatum.format(alsDatum(tag.dayDate)) : (tag.title ?? 'Noch ohne Datum')}
              </h2>
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
            <div className="py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-brand-800">Dieser Tag gehört dir.</h3>
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
                  onEntfernen={() => entfernen(tag.id, punkt.id)}
                />
              ))}
            </ol>
          )}
        </>
      ) : (
        <div className="py-14 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-brand-800">Noch keine Reisetage.</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-700">
            Sobald ein Zeitraum feststeht, entstehen die Tage dieser Reise.
          </p>
        </div>
      )}
    </section>
  )

  const ungeplant = ohneTag.length > 0 && (
    <section className="rounded-[24px] border border-black/5 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">
        Noch nicht eingeplant
      </p>
      <ol className="mt-4 space-y-3">
        {ohneTag.map((punkt) => (
          <Planpunkt
            key={punkt.id}
            punkt={punkt}
            gesperrt={laeuft}
            onEntfernen={() => entfernen('', punkt.id)}
          />
        ))}
      </ol>
    </section>
  )

  if (kompakt) {
    return (
      <div aria-label="Tagesplan" className="mt-5 grid min-w-0 gap-4">
        <div className="min-w-0 rounded-[26px] border border-black/5 bg-white p-3">
          <div className="px-2 pb-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Tagesplan</p>
            <p className="mt-1 text-sm text-ink-900">
              {punkteGesamt} {punkteGesamt === 1 ? 'Punkt' : 'Punkte'} geplant
            </p>
          </div>
          {reise.days.length === 0 ? (
            <p className="px-3 py-6 text-sm leading-6 text-ink-700">
              Diese Reise hat noch keine Tage. Sie entstehen, sobald ein Zeitraum feststeht.
            </p>
          ) : (
            <ScrollRow
              label="Reisetage im Plan"
              fadeFromClassName="from-white"
              viewportClassName="gap-2 px-1 pb-1"
            >
              {reise.days.map((eintrag) => {
                const gewaehlt = tag?.id === eintrag.id
                return (
                  <button
                    key={eintrag.id}
                    type="button"
                    aria-current={gewaehlt ? 'date' : undefined}
                    onClick={() => onTagWechseln(eintrag.id)}
                    className={cn(
                      'inline-flex min-h-11 min-w-[6.5rem] shrink-0 flex-col justify-center rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
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
            </ScrollRow>
          )}
        </div>
        {tagesInhalt}
        {ungeplant}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
      <aside className="h-fit rounded-[26px] border border-black/5 bg-white p-3 lg:sticky lg:top-24">
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Tagesplan</p>
          <p className="mt-1 text-sm text-ink-900">
            {punkteGesamt} {punkteGesamt === 1 ? 'Punkt' : 'Punkte'} geplant
          </p>
        </div>
        <div className="max-h-[45dvh] space-y-1 overflow-y-auto pr-1 lg:max-h-[520px]">
          {reise.days.map((eintrag) => {
            const gewaehlt = tag?.id === eintrag.id
            return (
              <button
                key={eintrag.id}
                type="button"
                onClick={() => onTagWechseln(eintrag.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                  gewaehlt ? 'bg-surface-100 text-brand-800' : 'text-ink-800 hover:bg-surface-0',
                )}
              >
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold">
                    {eintrag.title ?? `Tag ${eintrag.dayIndex}`}
                  </strong>
                  <span className="mt-0.5 block text-xs opacity-70">
                    {eintrag.dayDate ? kurzesDatum.format(alsDatum(eintrag.dayDate)) : 'Ohne Datum'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs">
                  {eintrag.items.length > 0 && eintrag.items.length}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            )
          })}
          {reise.days.length === 0 && (
            <p className="px-3 py-6 text-sm leading-6 text-ink-700">
              Diese Reise hat noch keine Tage. Sie entstehen, sobald ein Zeitraum feststeht.
            </p>
          )}
        </div>
      </aside>

      {tagesInhalt}

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <Reiseprofil reise={reise} />
        {ungeplant}
      </aside>
    </div>
  )
}

function Reiseprofil({ reise }: { reise: Trip }) {
  return (
    <section className="rounded-[24px] border border-black/5 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Reiseprofil</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-700">Tempo</dt>
          <dd className="font-semibold text-brand-800">{TEMPO_BEZEICHNUNG[reise.pace].titel}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-ink-700">Interessen</dt>
          <dd className="min-w-0 break-words text-right font-semibold text-brand-800">
            {reise.interests.length
              ? reise.interests.map((wert) => INTERESSE_BEZEICHNUNG[wert]).join(', ')
              : 'Noch offen'}
          </dd>
        </div>
      </dl>
      {reise.travelWish && (
        <p className="mt-4 border-t border-line-100 pt-4 text-xs leading-5 text-ink-800">
          „{reise.travelWish}“
        </p>
      )}
    </section>
  )
}

function Planpunkt({
  punkt,
  gesperrt,
  onEntfernen,
}: {
  punkt: TripItem
  gesperrt: boolean
  onEntfernen: () => void
}) {
  const Symbol = punkt.startsAt ? Clock3 : ART_SYMBOL[punkt.kind]

  return (
    <li className="group flex gap-3 rounded-2xl border border-line-200 p-3 transition hover:border-line-300 sm:gap-4 sm:p-4">
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
