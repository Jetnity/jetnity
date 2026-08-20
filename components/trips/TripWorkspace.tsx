'use client'

// components/trips/TripWorkspace.tsx
//
// Der Reise-Arbeitsbereich. Eine Ansicht für beide Ablagen.
//
// Eine Gastreise im Browser und eine Reise im Konto sind dasselbe `Trip`
// (`types/trips.ts`). Was sie unterscheidet, ist das Speichern – und genau das
// steht nicht hier: Diese Komponente stellt dar und ruft die beiden Vorgänge
// auf, die ihr übergeben werden. Zwei Arbeitsbereiche zu bauen hiesse, jede
// künftige Änderung an der Ansicht zweimal zu machen und beim ersten Mal zu
// vergessen.
//
// Die Herkunft ist trotzdem sichtbar: Eine Gastreise liegt nur auf diesem Gerät
// und ist mit dem Browserspeicher verloren. Das darf niemand erst nach dem
// Verlust erfahren.

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Car,
  ChevronRight,
  Clock3,
  MapPin,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'

import {
  ART_BEZEICHNUNG,
  INTERESSE_BEZEICHNUNG,
  TEMPO_BEZEICHNUNG,
  betragLesbar,
} from '@/lib/trips/bezeichnungen'
import { GRENZEN, planpunktFormularSchema, type PlanpunktFormular } from '@/lib/trips/schema'
import { cn } from '@/lib/utils'
import { TRIP_ITEM_KINDS, type Trip, type TripItem, type TripItemKind, type TripSource } from '@/types/trips'

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

function betrag(wert: number | null, waehrung: string) {
  if (wert === null) return 'Noch offen'
  return betragLesbar(wert, waehrung)
}

/** „12.–16. Sep“ oder, ohne Zeitraum, ein ehrlicher Hinweis darauf. */
function zeitraum(reise: Trip) {
  if (!reise.startDate || !reise.endDate) return 'Zeitraum noch offen'
  return `${kurzesDatum.format(alsDatum(reise.startDate))} – ${kurzesDatum.format(alsDatum(reise.endDate))}`
}

const ART_SYMBOL: Record<TripItemKind, React.ComponentType<{ className?: string }>> = {
  flight: Plane,
  stay: BedDouble,
  activity: Sparkles,
  transfer: Car,
  note: StickyNote,
}

/** Antwort eines Speichervorgangs: eine Meldung, oder `null` bei Erfolg. */
export type Speicherantwort = Promise<string | null>

type TripWorkspaceProps = {
  reise: Trip
  quelle: TripSource
  /**
   * Planpunkte ohne Tag.
   *
   * Sie entstehen, wenn ein Tag entfernt wird (`on delete set null`). Ohne
   * eigenen Platz in der Ansicht wären sie unsichtbar, aber vorhanden – die
   * schlechteste der möglichen Zustände.
   */
  ohneTag?: TripItem[]
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Speicherantwort
  onPunktEntfernen: (tagId: string, punktId: string) => Speicherantwort
  /** Platz für Vorgänge, die nur eine der beiden Ablagen kennt – etwa Löschen im Konto. */
  kopfzeile?: React.ReactNode
  /** Platz für Hinweise der jeweiligen Ablage, etwa die Übernahme ins Konto. */
  hinweis?: React.ReactNode
  /** Platz für die Sprachänderung – bewusst zwischen Kopf und Tagesplan. */
  aenderung?: React.ReactNode
  /** Flugsuche im Reisekontext, nicht als isolierte Suchmaschine. */
  flugsuche?: React.ReactNode
  /** Hotel- und Quartierbereich je Etappe. */
  hotelsuche?: React.ReactNode
}

export default function TripWorkspace({
  reise,
  quelle,
  ohneTag = [],
  onPunktAnlegen,
  onPunktEntfernen,
  kopfzeile,
  hinweis,
  aenderung,
  flugsuche,
  hotelsuche,
}: TripWorkspaceProps) {
  const [aktiverTag, setAktiverTag] = React.useState(reise.days[0]?.id ?? '')
  const [formularOffen, setFormularOffen] = React.useState(false)
  const [art, setArt] = React.useState<TripItemKind>('activity')
  const [titel, setTitel] = React.useState('')
  const [zeit, setZeit] = React.useState('')
  const [notiz, setNotiz] = React.useState('')
  const [meldung, setMeldung] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)

  // Nach dem Anlegen oder Löschen kommt die Reise neu herein. Zeigt der bisher
  // gewählte Tag ins Leere – etwa weil die Reise gewechselt hat –, fällt die
  // Auswahl auf den ersten Tag zurück.
  React.useEffect(() => {
    setAktiverTag((bisher) =>
      reise.days.some((tag) => tag.id === bisher) ? bisher : reise.days[0]?.id ?? '',
    )
  }, [reise])

  const tag = reise.days.find((eintrag) => eintrag.id === aktiverTag) ?? reise.days[0]
  const punkteGesamt = reise.days.reduce((summe, eintrag) => summe + eintrag.items.length, 0)

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

  const gast = quelle === 'guest'

  return (
    <main className="min-h-screen bg-surface-75 pb-20">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10">
        <Link
          href="/reisen"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-ink-800 transition hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Meine Reisen
        </Link>

        {hinweis}

        <section className="mt-5 rounded-[30px] bg-brand-800 text-white shadow-[0_24px_70px_rgba(15,46,42,0.16)]">
          <div className="grid grid-cols-1 gap-7 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-ink-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {gast ? 'Nur auf diesem Gerät' : 'In deinem Konto gespeichert'}
              </span>
              <h1 className="mt-5 hyphens-auto break-words text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {reise.title}
              </h1>
              <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-white/65">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 hyphens-auto break-words">
                  {reise.stages.length > 0
                    ? reise.stages.map((etappe) => etappe.name).join(' · ')
                    : 'Ziel noch offen'}
                  {reise.origin && ` · ab ${reise.origin}`}
                </span>
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <CalendarDays className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">
                  {reise.days.length} {reise.days.length === 1 ? 'Tag' : 'Tage'}
                </strong>
                <span className="text-xs text-white/55">{zeitraum(reise)}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3">
                <Users className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">{reise.travellers}</strong>
                <span className="text-xs text-white/55">
                  {reise.travellers === 1 ? 'Reisende Person' : 'Reisende'}
                </span>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 sm:col-span-1">
                <WalletCards className="h-4 w-4 text-ink-400" />
                <strong className="mt-2 block text-sm">
                  {betrag(reise.budgetAmount, reise.currency)}
                </strong>
                <span className="text-xs text-white/55">Budget</span>
              </div>
            </div>
          </div>
          {kopfzeile && (
            <div className="border-t border-white/10 px-6 py-4 sm:px-8">{kopfzeile}</div>
          )}
        </section>

        {aenderung}

        {flugsuche && <div className="mt-6">{flugsuche}</div>}
        {hotelsuche && <div className="mt-6">{hotelsuche}</div>}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="h-fit rounded-[26px] border border-black/5 bg-white p-3 lg:sticky lg:top-24">
            <div className="px-3 pb-3 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Tagesplan</p>
              <p className="mt-1 text-sm text-ink-900">
                {punkteGesamt} {punkteGesamt === 1 ? 'Punkt' : 'Punkte'} geplant
              </p>
            </div>
            {/* Auf Telefonen steht die Tagesliste ueber dem Tagesinhalt. Bei
                langen Reisen wuerde eine 520 px hohe Liste den halben Bildschirm
                fuellen und das Scrollen der Seite abfangen. Deshalb dort an die
                Bildschirmhoehe gebunden, ab lg klebt die Spalte ohnehin. */}
            <div className="max-h-[45dvh] space-y-1 overflow-y-auto pr-1 lg:max-h-[520px]">
              {reise.days.map((eintrag) => {
                const gewaehlt = tag?.id === eintrag.id
                return (
                  <button
                    key={eintrag.id}
                    type="button"
                    onClick={() => {
                      setAktiverTag(eintrag.id)
                      zurueck()
                    }}
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
                      <ChevronRight className="h-4 w-4" />
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

          <section className="min-w-0 rounded-[26px] border border-black/5 bg-white p-4 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7">
            {tag ? (
              <>
                <div className="flex flex-col justify-between gap-4 border-b border-line-200 pb-5 sm:flex-row sm:items-center">
                  {/* Datum kann auf schmalen Breiten mehrzeilig werden */}
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
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900"
                  >
                    <Plus className="h-4 w-4" />
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
                              <Symbol className="h-3.5 w-3.5" />
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
                        // Drei Zeilen, weil der Platzhalter auf 320 px genau so
                        // viele braucht. Mit zwei Zeilen wird er angeschnitten.
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
                  <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {meldung}
                  </p>
                )}

                {tag.items.length === 0 ? (
                  <div className="py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                      <CalendarDays className="h-5 w-5" />
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
                  <CalendarDays className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-brand-800">Noch keine Reisetage.</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-700">
                  Sobald ein Zeitraum feststeht, entstehen die Tage dieser Reise.
                </p>
              </div>
            )}
          </section>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
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

            {ohneTag.length > 0 && (
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
            )}
          </aside>
        </div>
      </div>
    </main>
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
        <Symbol className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          {punkt.startsAt && (
            <span className="text-xs font-semibold text-brand-600">{punkt.startsAt}</span>
          )}
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-600 opacity-70 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 disabled:pointer-events-none disabled:opacity-40 group-hover:opacity-100 pointer-fine:h-9 pointer-fine:w-9"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  )
}
