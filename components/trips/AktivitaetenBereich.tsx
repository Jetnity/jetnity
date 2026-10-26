'use client'

// components/trips/AktivitaetenBereich.tsx
//
// Aktivitätsbereich im Reise-Arbeitsbereich. Eine Suche startet nur durch eine
// ausdrückliche Aktion. Die Suche hat eine Generation. Die Übernahme hat eine
// eigene Operation aus den Schreiber-Fakten und bleibt bei einer neuen Suche
// geschlossen, auch wenn sich nur die Rangdarstellung ändert. Kein Demo,
// keine Fake-Karten.

import * as React from 'react'

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { activitySucheFehlerAntwort, activitySucheVomClient } from '@/lib/activities/client-anfrage'
import { ACTIVITY_ABDECKUNGSHINWEIS } from '@/lib/activities/domain'
import { activitySucheEingabeAusReise } from '@/lib/activities/tageskontext'
import {
  activitySuchKontextSchluessel,
  leeresUebernahmeRegister,
  optionInhaltSchluessel,
  optionSchreibIdentitaet,
  suchAntwortAnwenden,
  suchDispatch,
  suchKontextWechseln,
  suchLaufStart,
  uebernahmeAbschliessen,
  uebernahmeBeanspruchen,
  uebernahmeDarfSenden,
  uebernahmeErgebnisLesen,
  uebernahmeHinweisBezeichnung,
  uebernahmeHinweisSetzen,
  uebernahmeHinweisText,
  uebernahmeHinweisTexte,
  uebernahmeOperationSchluessel,
  uebernahmeUnbestaetigtFreigeben,
  type SuchLauf,
  type UebernahmeErfassung,
  type UebernahmeRegister,
} from '@/lib/activities/suchlebenszyklus'
import AktivitaetKarte from '@/components/trips/AktivitaetKarte'
import GetYourGuideAktivitaeten from '@/components/trips/GetYourGuideAktivitaeten'
import { ScrollRow } from '@/components/ui/scroll-row'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import { cn } from '@/lib/utils'
import type { Trip, TripDay, TripStage } from '@/types/trips'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const NETZ_MELDUNG = 'Die Aktivitätsanfrage ist gerade nicht erreichbar.'

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

function tagTitel(tag: TripDay): string {
  if (tag.title) return tag.title
  if (tag.dayDate) return kurzesDatum.format(alsDatum(tag.dayDate))
  return `Tag ${tag.dayIndex}`
}

function etappeFuer(reise: Trip, tag: TripDay): TripStage | null {
  if (!tag.stageId) return null
  return reise.stages.find((etappe) => etappe.id === tag.stageId) ?? null
}

function istAbbruch(fehler: unknown): boolean {
  return (
    (fehler instanceof DOMException && fehler.name === 'AbortError') ||
    (fehler instanceof Error && fehler.name === 'AbortError')
  )
}

function BeobachteteKarte({
  option,
  laeuft,
  onUebernehmen,
  onUebernahmeBeobachten,
}: {
  option: ActivityOptionSichtbar
  laeuft: boolean
  onUebernehmen?: () => void
  onUebernahmeBeobachten?: (aufnahme: { id: string; ausloesen: () => void }) => void
}) {
  React.useEffect(() => {
    if (!onUebernehmen || !onUebernahmeBeobachten) return
    onUebernahmeBeobachten({ id: option.id, ausloesen: onUebernehmen })
  })
  return <AktivitaetKarte option={option} laeuft={laeuft} onUebernehmen={onUebernehmen} />
}

function SuchKontext({
  reise,
  etappe,
  tag,
}: {
  reise: Trip
  etappe: TripStage | null
  tag: TripDay | null
}) {
  const datum = tag?.dayDate ? kurzesDatum.format(alsDatum(tag.dayDate)) : 'Datum noch offen'
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm">
      <div className="col-span-2 min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Ziel</dt>
        <dd className="mt-1 break-words text-ink-800">{etappe?.name.trim() || 'Zielort fehlt'}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Reisetag</dt>
        <dd className="mt-1 break-words text-ink-800">{tag ? tagTitel(tag) : 'Tag fehlt'}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Datum</dt>
        <dd className="mt-1 break-words text-ink-800">{tag ? datum : 'Datum noch offen'}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Reisende</dt>
        <dd className="mt-1 text-ink-800">{reise.travellers}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Währung</dt>
        <dd className="mt-1 break-words text-ink-800">{reise.currency}</dd>
      </div>
    </dl>
  )
}

export default function AktivitaetenBereich({
  reise,
  tagId: gesteuerteTagId,
  onTagWechseln,
  onUebernehmen,
  onUebernahmeBeobachten,
}: {
  reise: Trip
  /** Gemeinsame Tagesauswahl mit dem Plan, wenn der Arbeitsbereich sie setzt. */
  tagId?: string
  onTagWechseln?: (id: string) => void
  onUebernehmen?: (
    etappe: TripStage,
    tag: TripDay,
    option: ActivityOptionSichtbar,
  ) => Promise<string | null>
  /** Nur der Audit merkt sich daraus eine bereits gerenderte Aktion. */
  onUebernahmeBeobachten?: (aufnahme: { id: string; ausloesen: () => void }) => void
}) {
  const ersterTag = reise.days[0] ?? null
  const [eigeneTagId, setEigeneTagId] = React.useState(ersterTag?.id ?? '')

  React.useEffect(() => {
    setEigeneTagId((bisher) =>
      reise.days.some((tag) => tag.id === bisher) ? bisher : reise.days[0]?.id ?? '',
    )
  }, [reise])

  const tagId = gesteuerteTagId ?? eigeneTagId
  const setTagId = onTagWechseln ?? setEigeneTagId
  const tag = reise.days.find((eintrag) => eintrag.id === tagId) ?? ersterTag
  const angeforderteTagId = gesteuerteTagId ?? eigeneTagId

  if (reise.days.length === 0) {
    return (
      <section
        aria-label="Aktivitäten"
        data-organisieren-flaeche="suche"
        className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'relative overflow-hidden')}
      >
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-citrus-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Aktivitäten</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Passend zum Reisetag
        </h2>
        <SuchKontext reise={reise} etappe={null} tag={null} />
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Diese Reise hat noch keine Tage. Sobald ein Zeitraum feststeht, ordnet Jetnity Aktivitäten
          dem konkreten Tag zu – nicht als beliebige Liste.
        </p>
        <GetYourGuideAktivitaeten key={reise.id} reise={reise} angeforderteTagId={null} />
      </section>
    )
  }

  return (
    <ActivityTag
      reise={reise}
      tag={tag}
      angeforderteTagId={angeforderteTagId}
      onTagWechseln={setTagId}
      onUebernehmen={onUebernehmen}
      onUebernahmeBeobachten={onUebernahmeBeobachten}
    />
  )
}

function ActivityTag({
  reise,
  tag,
  angeforderteTagId,
  onTagWechseln,
  onUebernehmen,
  onUebernahmeBeobachten,
}: {
  reise: Trip
  tag: TripDay | null | undefined
  angeforderteTagId: string
  onTagWechseln: (id: string) => void
  onUebernehmen?: (
    etappe: TripStage,
    tag: TripDay,
    option: ActivityOptionSichtbar,
  ) => Promise<string | null>
  onUebernahmeBeobachten?: (aufnahme: { id: string; ausloesen: () => void }) => void
}) {
  const etappe = tag ? etappeFuer(reise, tag) : null
  const eingabe = React.useMemo(() => {
    if (!tag || !etappe || !etappe.name.trim()) return null
    return activitySucheEingabeAusReise(reise, etappe, tag)
  }, [reise, etappe, tag])
  const anfrageSchluessel = eingabe ? JSON.stringify(eingabe) : ''
  const kontext = activitySuchKontextSchluessel({
    tripId: reise.id,
    stageId: etappe?.id ?? null,
    dayId: tag?.id ?? null,
    anfrageSchluessel,
  })

  const [lauf, setLauf] = React.useState<SuchLauf>(() => suchLaufStart(kontext))
  const angezeigt = lauf.kontext === kontext ? lauf : suchKontextWechseln(lauf, kontext)
  if (lauf.kontext !== kontext) setLauf(angezeigt)

  const laufRef = React.useRef(angezeigt)
  const abortRef = React.useRef<AbortController | null>(null)
  React.useLayoutEffect(() => {
    laufRef.current = angezeigt
  }, [angezeigt])
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [angezeigt.epoche])

  const [register, setRegister] = React.useState<UebernahmeRegister>(leeresUebernahmeRegister)
  const registerRef = React.useRef(register)
  const seqRef = React.useRef(0)
  const [hinweise, setHinweise] = React.useState<
    Record<string, { text: string; bezeichnung: string; seq: number; tripId: string; stageId: string; dayId: string }>
  >({})

  const antwortSetzen = (erwartet: { epoche: number; generation: number }, antwort: ActivitySucheAntwort) => {
    setLauf((stand) => {
      const next = suchAntwortAnwenden(stand, erwartet, antwort)
      laufRef.current = next
      return next
    })
  }

  const suchen = () => {
    if (!eingabe || !tag || !etappe) return
    const entscheid = suchDispatch(laufRef.current)
    if (!entscheid.angenommen) return
    laufRef.current = entscheid.lauf
    setLauf(entscheid.lauf)
    abortRef.current?.abort()
    const steuerung = new AbortController()
    abortRef.current = steuerung
    const erwartet = { epoche: entscheid.epoche, generation: entscheid.generation }
    void activitySucheVomClient(eingabe, { signal: steuerung.signal })
      .then((json) => antwortSetzen(erwartet, json))
      .catch((fehler: unknown) => {
        if (istAbbruch(fehler)) return
        antwortSetzen(erwartet, activitySucheFehlerAntwort(NETZ_MELDUNG))
      })
  }

  const uebernehmen = (option: ActivityOptionSichtbar, erfasst: UebernahmeErfassung) => {
    if (!onUebernehmen || !etappe || !tag) return
    const stand = laufRef.current
    const inhalte =
      stand.phase === 'fertig' && stand.antwort
        ? stand.antwort.options.map((eintrag) => optionInhaltSchluessel(eintrag))
        : []
    if (
      !uebernahmeDarfSenden(erfasst, {
        epoche: stand.epoche,
        generation: stand.generation,
        inhalte,
      })
    ) {
      return
    }
    const schluessel = uebernahmeOperationSchluessel(erfasst)
    const anspruch = uebernahmeBeanspruchen(registerRef.current, schluessel)
    if (!anspruch.ok) return
    registerRef.current = anspruch.register
    setRegister(anspruch.register)
    const seq = ++seqRef.current
    const etappeFest = etappe
    const tagFest = tag
    void (async () => {
      let wert: unknown = undefined
      try {
        wert = await onUebernehmen(etappeFest, tagFest, option)
      } catch {
        wert = undefined
      } finally {
        const ausgang = uebernahmeErgebnisLesen(wert)
        const frei = uebernahmeAbschliessen(
          registerRef.current,
          schluessel,
          ausgang.art === 'gemeldet' ? 'angenommen' : 'unbestaetigt',
        )
        registerRef.current = frei
        setRegister(frei)
      }
      const text = uebernahmeHinweisText(uebernahmeErgebnisLesen(wert))
      setHinweise((bisher) =>
        uebernahmeHinweisSetzen(bisher, schluessel, {
          text,
          bezeichnung: uebernahmeHinweisBezeichnung(option),
          seq,
          tripId: erfasst.tripId,
          stageId: erfasst.stageId,
          dayId: erfasst.dayId,
        }),
      )
    })()
  }

  const uebernahmeFreigeben = (schluessel: string) => {
    const frei = uebernahmeUnbestaetigtFreigeben(registerRef.current, schluessel)
    if (frei === registerRef.current) return
    registerRef.current = frei
    setRegister(frei)
  }

  const antwort = angezeigt.phase === 'fertig' ? angezeigt.antwort : null
  const suchLaeuft = angezeigt.phase === 'loading'
  const zustand = antwort?.status
  const kartenSichtbar = zustand === 'ok' || zustand === 'partial'
  const suchLabel = antwort ? 'Erneut suchen' : 'Für diesen Tag suchen'
  const geplante = tag?.items ?? []
  const zeitpunkte = geplante.filter((punkt) => punkt.startsAt)
  const kannSuchen = Boolean(eingabe && etappe && tag)
  const kartenSchluessel =
    suchLaeuft || antwort
      ? kartenSichtbar
        ? (antwort?.options ?? []).map((option) =>
            uebernahmeOperationSchluessel({
              tripId: reise.id,
              stageId: etappe?.id ?? '',
              dayId: tag?.id ?? '',
              schreibIdentitaet: optionSchreibIdentitaet(option, tag?.dayDate ?? null),
            }),
          )
        : []
      : null
  const hinweisSicht =
    etappe && tag
      ? uebernahmeHinweisTexte(hinweise, {
          tripId: reise.id,
          stageId: etappe.id,
          dayId: tag.id,
          karten: kartenSchluessel,
        })
      : { allgemein: [], jeKarte: {} }

  return (
    <section
      aria-label="Aktivitäten"
      data-organisieren-flaeche="suche"
      className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'relative overflow-hidden')}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-citrus-400" />
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Aktivitäten</p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
            Passend zum Reisetag
          </h2>
          <p className="mt-1 break-words text-sm text-ink-800">
            {etappe ? etappe.name : 'Noch keiner Etappe zugeordnet'}
            {tag?.dayDate ? ` · ${kurzesDatum.format(alsDatum(tag.dayDate))}` : ' · Datum noch offen'}
          </p>
        </div>
        <Sparkles className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
      </div>

      {tag ? <SuchKontext reise={reise} etappe={etappe} tag={tag} /> : null}

      <div className="mt-4 min-w-0 rounded-2xl border border-line-200 bg-surface-25 px-3 py-3">
        <p id="activity-tag-label" className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
          Reisetag
        </p>
        <ScrollRow
          label="Reisetage"
          className="mt-2"
          fadeFromClassName="from-white"
          viewportClassName="gap-2 pb-1"
          aria-labelledby="activity-tag-label"
        >
          {reise.days.map((eintrag) => {
            const gewaehlt = tag?.id === eintrag.id
            return (
              <button
                key={eintrag.id}
                type="button"
                role="radio"
                aria-checked={gewaehlt}
                onClick={() => onTagWechseln(eintrag.id)}
                className={cn(
                  'inline-flex min-h-11 max-w-[14rem] shrink-0 items-center rounded-full border px-3.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
                  gewaehlt
                    ? 'border-brand-800 bg-brand-800 text-white'
                    : 'border-line-200 bg-white text-ink-900 hover:border-line-500',
                )}
              >
                <span className="min-w-0 break-words">{tagTitel(eintrag)}</span>
              </button>
            )
          })}
        </ScrollRow>
      </div>

      {kannSuchen ? (
        <button
          type="button"
          onClick={suchen}
          disabled={suchLaeuft}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
        >
          {suchLabel}
        </button>
      ) : null}

      <div className="mt-5 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
        <p>
          {geplante.length === 0
            ? 'An diesem Tag ist noch nichts eingeplant. Jetnity erfindet deshalb keine Lücken und keine Wegezeiten.'
            : `${geplante.length} ${geplante.length === 1 ? 'Punkt' : 'Punkte'} sind bereits geplant${
                zeitpunkte.length > 0
                  ? `: ${zeitpunkte
                      .map((punkt) => punkt.startsAt)
                      .filter(Boolean)
                      .join(', ')}`
                  : ', aber ohne belastbare Uhrzeiten'
              }.`}
        </p>
      </div>

      {!etappe && (
        <p className="mt-4 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
          Dieser Tag hängt an keiner Etappe. Ohne Zielort sucht Jetnity keine Aktivitäten.
        </p>
      )}

      <div className="mt-5 min-h-[7rem]" aria-live="polite">
        {!suchLaeuft && !antwort && kannSuchen && (
          <p role="status" className="rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
            Für diese Angaben liegt noch keine Suche vor.
          </p>
        )}

        {suchLaeuft && (
          <p aria-busy="true" className="flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm text-ink-800">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            Jetnity prüft, welche Aktivitäten zu diesem Tag passen.
          </p>
        )}

        {!suchLaeuft && antwort && (
          <div className="grid gap-4">
            {zustand === 'unavailable' && (
              <p role="status" className="rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}

            {zustand === 'empty' && (
              <p role="status" className="rounded-2xl bg-surface-25 px-4 py-6 text-center text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}

            {zustand === 'partial' && (
              <p role="status" className="rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}

            {(zustand === 'timeout' ||
              zustand === 'error' ||
              zustand === 'invalid' ||
              zustand === 'rate_limited') && (
              <p
                role="status"
                className="flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {antwort.message}
              </p>
            )}

            {kartenSichtbar && antwort.options.length > 0 && (
              <ol className="grid min-w-0 gap-3">
                {antwort.options.map((option) => {
                  const inhalt = optionInhaltSchluessel(option)
                  const erfasst: UebernahmeErfassung = {
                    tripId: reise.id,
                    stageId: etappe?.id ?? '',
                    dayId: tag?.id ?? '',
                    epoche: angezeigt.epoche,
                    generation: angezeigt.generation ?? 0,
                    optionInhalt: inhalt,
                    schreibIdentitaet: optionSchreibIdentitaet(option, tag?.dayDate ?? null),
                  }
                  const schluessel = uebernahmeOperationSchluessel(erfasst)
                  const gesperrt =
                    register.laufend.includes(schluessel) ||
                    register.angenommen.includes(schluessel) ||
                    register.unbestaetigt.includes(schluessel)
                  const ausloesen =
                    onUebernehmen && etappe && tag ? () => uebernehmen(option, erfasst) : undefined
                  return (
                    <li key={`${angezeigt.generation ?? 0}:${inhalt}`} className="min-w-0">
                      <BeobachteteKarte
                        option={option}
                        laeuft={gesperrt}
                        onUebernehmen={ausloesen}
                        onUebernahmeBeobachten={onUebernahmeBeobachten}
                      />
                      {hinweisSicht.jeKarte[schluessel] ? (
                        <p role="status" className="mt-3 rounded-2xl bg-surface-50 px-4 py-3 text-sm leading-6 text-ink-800">
                          {hinweisSicht.jeKarte[schluessel]}
                        </p>
                      ) : null}
                      {register.unbestaetigt.includes(schluessel) ? (
                        <button
                          type="button"
                          onClick={() => uebernahmeFreigeben(schluessel)}
                          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:border-line-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto"
                        >
                          Erneut anbieten
                        </button>
                      ) : null}
                    </li>
                  )
                })}
              </ol>
            )}

            <p className="text-xs leading-5 text-ink-700">{antwort.coverageNote || ACTIVITY_ABDECKUNGSHINWEIS}</p>
          </div>
        )}
      </div>

      {hinweisSicht.allgemein.map((text) => (
        <p key={text} role="status" className="mt-4 rounded-2xl bg-surface-50 px-4 py-3 text-sm leading-6 text-ink-800">
          {text}
        </p>
      ))}

      <GetYourGuideAktivitaeten key={reise.id} reise={reise} angeforderteTagId={angeforderteTagId} />
    </section>
  )
}
