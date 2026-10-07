'use client'

import * as React from 'react'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import TripIntegratedDay from '@/components/trips/TripIntegratedDay'
import { buchungstext, vorbereitungenFuerPunkt } from '@/lib/trips/trip-plan-integrated/day'
import type { ReadinessViewItem } from '@/lib/readiness/domain'
import type { PreparationZiel } from '@/lib/readiness/preparation-premium-experience-5'
import PlanpunktEditor from '@/components/trips/PlanpunktEditor'
import type { PlanAenderung } from '@/lib/trips/trip-plan-integrated/manual'
import TripTimelineZeitpruefung from '@/components/trips/TripTimelineZeitpruefung'
import {
  BedDouble,
  Car,
  ChevronLeft,
  ChevronRight,
  Plane,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from 'lucide-react'

import { abdeckungsKante, type AbdeckungsBand } from '@/lib/trips/cross-device-interaction-1'
import {
  ART_BEZEICHNUNG,
  betragLesbar,
} from '@/lib/trips/bezeichnungen'
import { etappenZeitraumAnzeigen } from '@/lib/trips/datum-anzeige'
import {
  planTagNavigator,
  planTageFolgen,
  tagStreifenZiel,
  tagUnterKanteZiel,
} from '@/lib/trips/trip-plan-premium-experience-4'
import { type PlanpunktFormular } from '@/lib/trips/schema'
import { ersterTagDerEtappe, timelineAbleiten } from '@/lib/trips/timeline'
import { lokalePlanzeit } from '@/lib/trips/trip-timeline-core-1'
import { cn } from '@/lib/utils'
import { type Trip, type TripDay, type TripItem, type TripItemKind } from '@/types/trips'

const langesDatum = new Intl.DateTimeFormat('de-CH', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const chipDatum = new Intl.DateTimeFormat('de-CH', {
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

const fokusRing =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 motion-reduce:transition-none'

function sichtbarerTag(tagId: string): HTMLElement | null {
  const liste = document.querySelectorAll<HTMLElement>(`[data-timeline-tag="${CSS.escape(tagId)}"]`)
  for (const el of liste) {
    if (el.getClientRects().length > 0) return el
  }
  return null
}

function klebendeKante(): number {
  const baender = ['header', '[data-workspace-mode-nav]', 'nav[aria-label="Reise"]'].flatMap((selektor) => {
    const el = document.querySelector(selektor)
    if (!(el instanceof HTMLElement)) return []
    const stil = getComputedStyle(el)
    if (stil.position !== 'sticky' && stil.position !== 'fixed') return []
    if (stil.display === 'none' || stil.visibility === 'hidden') return []
    const rand = el.getBoundingClientRect()
    if (rand.height <= 0 || rand.width <= 0) return []
    const band: AbdeckungsBand = { top: rand.top, bottom: rand.bottom, height: rand.height }
    return [band]
  })
  return abdeckungsKante(baender)
}

function gewaehltenTagSichtbarHalten(tagId: string) {
  const knopf = sichtbarerTag(tagId)
  if (!knopf) return
  const streifen = knopf.closest<HTMLElement>('[data-plan-tag-streifen]')
  if (streifen) {
    const streifenRand = streifen.getBoundingClientRect()
    const knopfRand = knopf.getBoundingClientRect()
    const ziel = tagStreifenZiel({
      scrollLeft: streifen.scrollLeft,
      clientWidth: streifen.clientWidth,
      scrollWidth: streifen.scrollWidth,
      buttonOffset: knopfRand.left - streifenRand.left + streifen.scrollLeft,
      buttonWidth: knopfRand.width,
    })
    if (ziel != null) streifen.scrollLeft = ziel
  }
  const nachher = knopf.getBoundingClientRect()
  const delta = tagUnterKanteZiel({
    top: nachher.top,
    bottom: nachher.bottom,
    kante: klebendeKante(),
    viewportHeight: window.innerHeight,
  })
  if (delta == null || Math.abs(delta) <= 1) return
  window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: 'instant' })
}

export default function TripWorkspacePlan({
  reise,
  ohneTag,
  aktiverTag,
  kompakt,
  eingebettet = false,
  onTagWechseln,
  onPunktAnlegen,
  onPunktBearbeiten,
  readinessItems = [],
  onPreparation,
  onVerbindungAnlegen,
  onPunktEntfernen,
  onPunktOeffnen,
  gewaehlterPunktId,
}: {
  readinessItems?: readonly ReadinessViewItem[]
  onPreparation?: (ziel: PreparationZiel) => void
  onVerbindungAnlegen?: (values: MobilityManuellEingabe) => Promise<string | null>
  reise: Trip
  ohneTag: TripItem[]
  aktiverTag: string
  kompakt: boolean
  eingebettet?: boolean
  onTagWechseln: (tagId: string) => void
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Promise<string | null>
  onPunktBearbeiten?: (original: TripItem, change: PlanAenderung) => Promise<string | null>
  onPunktEntfernen: (tagId: string, punktId: string) => Promise<string | null>
  onPunktOeffnen?: (punktId: string) => void
  gewaehlterPunktId?: string
}) {
  const root = React.useRef<HTMLElement>(null)
  const editorTrigger = React.useRef<HTMLElement | null>(null)
  const [formularTag, setFormularTag] = React.useState(aktiverTag)
  const [formularOffen, setFormularOffen] = React.useState(false)
  const [bearbeiten, setBearbeiten] = React.useState<TripItem | undefined>()
  const [meldung, setMeldung] = React.useState('')
  const [erfolg, setErfolg] = React.useState('')
  const [laeuft, setLaeuft] = React.useState(false)
  if (formularTag !== aktiverTag) {
    setFormularTag(aktiverTag); setFormularOffen(false); setBearbeiten(undefined); setMeldung(''); setErfolg('')
  }

  const timeline = timelineAbleiten(reise, ohneTag, aktiverTag)
  const tag = timeline.gewaehlterTag
  const folge = planTageFolgen(timeline.etappen)
  const navigator = planTagNavigator(folge, timeline.gewaehlterTagId)
  const etappeDesTags = timeline.etappen.find((etappe) => etappe.tage.some((eintrag) => eintrag.id === tag?.id))

  React.useLayoutEffect(() => {
    if (!timeline.gewaehlterTagId) return
    gewaehltenTagSichtbarHalten(timeline.gewaehlterTagId)
  }, [timeline.gewaehlterTagId])

  const zurueck = () => {
    setFormularOffen(false); setBearbeiten(undefined)
    requestAnimationFrame(() => {
      const target = editorTrigger.current?.isConnected && editorTrigger.current.getClientRects().length
        ? editorTrigger.current : root.current?.querySelector<HTMLElement>('[data-plan-hinzufuegen]')
      target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'center', behavior: 'instant' })
    })
  }

  const entfernen = async (tagId: string, punktId: string) => {
    if (laeuft) return
    setMeldung('')
    setLaeuft(true)
    const context = window.location.href
    try {
      const fehler = await onPunktEntfernen(tagId, punktId)
      if (window.location.href === context && fehler) setMeldung(fehler)
    } catch {
      if (window.location.href === context) setMeldung('Der Punkt konnte nicht entfernt werden. Bitte versuche es erneut.')
    } finally { setLaeuft(false) }
  }

  const tagesKopf = tag && (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
          {etappeDesTags?.name ?? `Tag ${tag.dayIndex}`}
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800">
          {tag.dayDate ? langesDatum.format(alsDatum(tag.dayDate)) : (tag.title ?? 'Noch ohne Datum')}
        </h3>
        {tag.items.length > 0 ? (
          <p className="mt-1 text-xs text-ink-700">
            {tag.items.length === 1 ? '1 Punkt' : `${tag.items.length} Punkte`}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        data-plan-hinzufuegen
        onClick={(event) => { editorTrigger.current = event.currentTarget; setBearbeiten(undefined); setFormularOffen((offen) => !offen); setErfolg('') }}
        aria-expanded={formularOffen}
        className={cn(
          'inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 sm:w-auto',
          fokusRing,
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Punkt hinzufügen
      </button>
    </div>
  )

  const tagesFelder = tag && (
    <>
      {formularOffen && <PlanpunktEditor key={`${reise.id}:${tag.id}:${bearbeiten?.id ?? 'new'}`}
        reise={reise} tagId={tag.id} item={bearbeiten} onAnlegen={onPunktAnlegen} onBearbeiten={onPunktBearbeiten}
        onAbbrechen={zurueck} onFertig={() => { setErfolg('Planpunkt gespeichert.'); zurueck() }} />}
      {erfolg && <p role="status" className="mt-3 text-sm text-brand-800">{erfolg}</p>}

      {meldung && (
        <p role="alert" className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-danger-600">
          {meldung}
        </p>
      )}

      {tag.items.length === 0 ? (
        <p data-plan-leer className="mt-3 text-sm leading-6 text-ink-700">
          Noch nichts an diesem Tag.
        </p>
      ) : (
        <div data-plan-tages-timeline className="mt-5 min-w-0 space-y-5">
          {timeline.tagesplan.map((gruppe) => (
            <section
              key={gruppe.id}
              aria-label={gruppe.titel}
              data-plan-gruppe={gruppe.id}
              className={cn('min-w-0', gruppe.id === 'flexibel' && 'border-t border-dashed border-line-300 pt-4')}
            >
              <h4 className="text-sm font-semibold text-brand-800">{gruppe.titel}</h4>
              {gruppe.id === 'flexibel' && (
                <p className="mt-1 text-xs leading-5 text-ink-800">Für diese Punkte ist keine gültige Uhrzeit hinterlegt.</p>
              )}
              <ol data-plan-timeline className="ml-1 mt-3 min-w-0 space-y-2 border-l border-line-300 pl-3 sm:pl-4">
                {gruppe.punkte.map(({ punkt, zeit }) => (
                  <Planpunkt
                    key={punkt.id}
                    punkt={punkt}
                    hinweis={vorbereitungenFuerPunkt(punkt.id,readinessItems)[0]}
                    onPreparation={onPreparation}
                    zeit={zeit}
                    gesperrt={laeuft}
                    gewaehlt={gewaehlterPunktId === punkt.id}
                    onOeffnen={onPunktOeffnen ? () => onPunktOeffnen(punkt.id) : undefined}
                    onBearbeiten={onPunktBearbeiten ? () => { editorTrigger.current = document.activeElement as HTMLElement; setBearbeiten(punkt); setFormularOffen(true); setErfolg('') } : undefined}
                    onEntfernen={() => entfernen(tag.id, punkt.id)}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </>
  )

  return (
    <section ref={root}
      aria-label="Tagesplan"
      data-tagesplan-modul="ein"
      data-plan-premium="4"
      data-plan-kompakt={kompakt ? 'ja' : 'nein'}
      className={cn(
        'min-w-0 max-w-full rounded-[24px] border border-line-200 bg-white p-3 shadow-[0_12px_32px_rgba(15,46,42,0.06)] sm:p-4',
        eingebettet ? 'mt-1' : 'mt-5',
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Tagesplan</p>
        <p className="mt-1 text-sm text-ink-900">{timeline.planText}</p>
      </div>

      {!timeline.hatTage ? (
        <p className="mt-4 text-sm leading-6 text-ink-700">
          Diese Reise hat noch keine Tage. Sie entstehen, sobald ein Zeitraum feststeht.
        </p>
      ) : (
        <>
          {tag ? (
            <div className="mt-4 min-w-0 max-w-full rounded-[20px] border border-line-200 bg-surface-50 p-3 sm:p-4">
          {navigator ? (
            <div data-plan-navigator="schritt" className="flex min-w-0 flex-col gap-3">
              <div className="min-w-0 overflow-x-auto">
                <p data-plan-tag-zaehler className="whitespace-nowrap text-sm font-semibold text-brand-800">
                  {navigator.text}
                </p>
                <p data-plan-tag-datum className="mt-0.5 whitespace-nowrap text-xs leading-5 text-ink-700">
                  {tag.dayDate ? kurzesDatum.format(alsDatum(tag.dayDate)) : (tag.title ?? 'Noch ohne Datum')}
                  {etappeDesTags ? ` · ${etappeDesTags.name}` : ''}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 md:justify-center">
                <button
                  type="button"
                  data-plan-tag-vorher
                  aria-label="Vorheriger Tag"
                  disabled={!navigator.vorherId || laeuft}
                  onClick={() => navigator.vorherId && onTagWechseln(navigator.vorherId)}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-line-200 bg-white text-brand-800 transition hover:border-line-500 disabled:pointer-events-none disabled:opacity-40',
                    fokusRing,
                  )}
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  data-plan-tag-naechster
                  aria-label="Nächster Tag"
                  disabled={!navigator.naechsterId || laeuft}
                  onClick={() => navigator.naechsterId && onTagWechseln(navigator.naechsterId)}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-line-200 bg-white text-brand-800 transition hover:border-line-500 disabled:pointer-events-none disabled:opacity-40',
                    fokusRing,
                  )}
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
              <div className="mt-3 grid min-w-0 gap-3 md:hidden">
                {timeline.etappen.map((etappe) =>
                  etappe.tage.length === 0 ? null : (
                    <div key={`streifen-${etappe.stageId ?? 'ohne'}`} data-timeline-etappe={etappe.stageId ?? 'ohne'} className="min-w-0">
                      <p className="text-xs text-brand-800"><strong className="font-semibold">{etappe.name}</strong></p>
                      <p className="mt-0.5 text-xs text-ink-700">
                        {etappe.istNutzerziel
                          ? etappenZeitraumAnzeigen(etappe.arrivalDate, etappe.departureDate) ??
                            'Ziel dieser Reise – Aufenthalt noch nicht festgelegt'
                          : 'Tage ohne festgelegten Aufenthalt'}
                      </p>
                      <div
                        data-plan-tag-streifen
                        className="mt-2 flex max-w-full min-w-0 snap-x gap-2 overflow-x-auto overscroll-x-contain"
                      >
                        {etappe.tage.map((eintrag) => (
                          <TagWahl
                            key={`streifen-${eintrag.id}`}
                            eintrag={eintrag}
                            gewaehlt={timeline.gewaehlterTagId === eintrag.id}
                            onWaehlen={() => onTagWechseln(eintrag.id)}
                            streifen
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
              <div
                id="plan-tag-kontext"
                data-plan-tag-kontext
                className={navigator ? 'mt-4 border-t border-line-200 pt-4' : undefined}
              >
                {tagesKopf}
                {tagesFelder}
              </div>
            </div>
          ) : null}

          <ol className="mt-4 hidden min-w-0 gap-4 md:grid">
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
                      'flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-2xl px-1 text-left transition disabled:cursor-default',
                      fokusRing,
                      etappeAktiv ? 'text-brand-800' : 'text-ink-800',
                    )}
                  >
                    <span className="min-w-0">
                      <strong className="block hyphens-auto break-words text-sm font-semibold">{etappe.name}</strong>
                      <span className="mt-0.5 block text-xs text-ink-700">
                        {etappe.istNutzerziel
                          ? etappenZeitraumAnzeigen(etappe.arrivalDate, etappe.departureDate) ??
                            'Ziel dieser Reise – Aufenthalt noch nicht festgelegt'
                          : 'Tage ohne festgelegten Aufenthalt'}
                      </span>
                    </span>
                  </button>
                  {etappe.tage.length > 0 && (
                    <div
                      data-plan-raster
                      className="mt-2 hidden md:grid md:grid-cols-4 lg:grid-cols-7 min-w-0 gap-2"
                    >
                        {etappe.tage.map((eintrag) => (
                          <TagWahl
                            key={`raster-${eintrag.id}`}
                            eintrag={eintrag}
                            gewaehlt={timeline.gewaehlterTagId === eintrag.id}
                            onWaehlen={() => onTagWechseln(eintrag.id)}
                          />
                        ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
          {tag ? <TripIntegratedDay reise={{...reise,ohneTag}} dayId={tag.id} ordered={timeline.tagesplan.flatMap(group=>group.punkte.map(entry=>entry.punkt))}
            selected={gewaehlterPunktId} tasks={readinessItems} onItem={onPunktOeffnen} onPreparation={onPreparation} onVerbindungAnlegen={onVerbindungAnlegen} /> : null}
          {tag ? <TripTimelineZeitpruefung reise={reise} ohneTag={ohneTag} tagId={tag.id}
            onPunktOeffnen={onPunktOeffnen} gesperrt={laeuft} /> : null}
        </>
      )}

      {timeline.ungeplante.length > 0 && (
        <div className="mt-5 border-t border-line-200 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">
            Noch nicht eingeplant
          </p>
          <ol data-plan-timeline className="ml-1 mt-3 min-w-0 space-y-2 border-l border-line-300 pl-3 sm:pl-4">
            {timeline.ungeplante.map((punkt) => (
              <Planpunkt
                key={punkt.id}
                punkt={punkt}
                zeit={lokalePlanzeit(punkt.startsAt)}
                gesperrt={laeuft}
                gewaehlt={gewaehlterPunktId === punkt.id}
                onOeffnen={onPunktOeffnen ? () => onPunktOeffnen(punkt.id) : undefined}
                onBearbeiten={onPunktBearbeiten ? () => { editorTrigger.current = document.activeElement as HTMLElement; setBearbeiten(punkt); setFormularOffen(true); setErfolg('') } : undefined}
                onEntfernen={() => entfernen('', punkt.id)}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function TagWahl({
  eintrag,
  gewaehlt,
  onWaehlen,
  streifen = false,
}: {
  eintrag: TripDay
  gewaehlt: boolean
  onWaehlen: () => void
  streifen?: boolean
}) {
  return (
    <button
      type="button"
      aria-current={gewaehlt ? 'date' : undefined}
      data-timeline-tag={eintrag.id}
      onClick={onWaehlen}
      className={cn(
        'inline-flex min-h-11 flex-col justify-center rounded-2xl border px-3 py-2 text-left transition',
        fokusRing,
        streifen ? 'w-max shrink-0 snap-start' : 'w-full min-w-0',
        gewaehlt
          ? 'border-brand-800 bg-brand-800 text-white'
          : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
      )}
    >
      <strong className={cn('block text-sm font-semibold', streifen && 'whitespace-nowrap')}>
        {eintrag.title ?? `Tag ${eintrag.dayIndex}`}
      </strong>
      <span className={cn('mt-0.5 block text-xs', streifen && 'whitespace-nowrap', gewaehlt ? 'text-white/80' : 'text-ink-700')}>
        {eintrag.dayDate ? chipDatum.format(alsDatum(eintrag.dayDate)) : 'Ohne Datum'}
        {eintrag.items.length > 0 ? ` · ${eintrag.items.length}` : ''}
      </span>
    </button>
  )
}

function Planpunkt({
  punkt,
  zeit,
  gesperrt,
  gewaehlt,
  onOeffnen,
  onEntfernen,
  onBearbeiten,
  hinweis,
  onPreparation,
}: {
  hinweis?: ReturnType<typeof vorbereitungenFuerPunkt>[number]
  onPreparation?: (ziel: PreparationZiel) => void
  punkt: TripItem
  zeit: string | null
  gesperrt: boolean
  gewaehlt?: boolean
  onOeffnen?: () => void
  onEntfernen: () => void
  onBearbeiten?: () => void
}) {
  const Symbol = ART_SYMBOL[punkt.kind]
  const inhalt = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {zeit !== null ? (
            <time dateTime={zeit} data-plan-zeit className="text-base font-semibold tabular-nums text-brand-800">
              {zeit}
            </time>
          ) : (
            <span data-plan-flexibel className="text-sm font-medium text-ink-800">Flexibel</span>
          )}
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink-800">
            <Symbol className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
            {ART_BEZEICHNUNG[punkt.kind]}
          </span>
        </span>
        <strong className="mt-1 block hyphens-auto break-words text-base font-semibold leading-snug text-brand-800">
          {punkt.title}
        </strong>
        <span className="mt-1 block text-xs text-ink-700">{buchungstext(punkt)}</span>
        {punkt.note && (
          <span className="mt-1 block hyphens-auto break-words text-sm leading-6 text-ink-800">
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
    <li data-plan-punkt={punkt.id} data-plan-gewaehlt={gewaehlt ? 'ja' : 'nein'} className="relative min-w-0 py-1">
      <span
        aria-hidden="true"
        className={cn(
          'absolute -left-[1.05rem] top-6 h-2.5 w-2.5 rounded-full border-2 border-brand-600 ring-4 ring-surface-50 sm:-left-[1.3rem]',
          zeit === null ? 'bg-surface-50' : 'bg-brand-600',
        )}
      />
      <div
        className={cn(
          'flex min-w-0 flex-wrap items-start gap-1 rounded-2xl border bg-white px-2 py-2 sm:px-3',
          gewaehlt ? 'border-brand-600 ring-2 ring-brand-600/15' : 'border-line-200',
        )}
      >
        {onOeffnen ? (
          <button
            type="button"
            aria-expanded={gewaehlt || false}
            onClick={onOeffnen}
            className={cn(
              'flex min-h-11 min-w-0 flex-1 basis-[10rem] items-start rounded-xl py-1 text-left',
              fokusRing,
            )}
          >
            {inhalt}
          </button>
        ) : (
          <div className="flex min-h-11 min-w-0 flex-1 basis-[10rem] items-start py-1">{inhalt}</div>
        )}
        {hinweis && onPreparation && <button type="button" className={cn('min-h-11 min-w-0 max-w-full rounded-full px-3 text-left text-sm text-brand-800 [overflow-wrap:anywhere]',fokusRing)}
          onClick={()=>onPreparation(hinweis.ziel)}>{hinweis.title}</button>}
        {onBearbeiten && <button type="button" onClick={onBearbeiten} aria-label={`${punkt.title} bearbeiten`}
          className={cn('min-h-11 min-w-0 max-w-full rounded-full px-3 text-sm font-semibold text-brand-800 [overflow-wrap:anywhere]', fokusRing)}>Bearbeiten</button>}
        <button
          type="button"
          onClick={onEntfernen}
          disabled={gesperrt}
          aria-label={`${punkt.title} entfernen`}
          className={cn(
            'ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-600 transition hover:bg-white hover:text-danger-600 disabled:pointer-events-none disabled:opacity-40',
            fokusRing,
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}
