'use client'

// components/trips/AktivitaetenBereich.tsx
//
// Aktivitätsbereich im Reise-Arbeitsbereich. Kein Demo, keine Fake-Karten.

import * as React from 'react'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { activitySucheFehlerAntwort, activitySucheVomClient } from '@/lib/activities/client-anfrage'
import { ACTIVITY_ABDECKUNGSHINWEIS } from '@/lib/activities/domain'
import { activitySucheEingabeAusReise } from '@/lib/activities/tageskontext'
import AktivitaetKarte from '@/components/trips/AktivitaetKarte'
import { ScrollRow } from '@/components/ui/scroll-row'
import { cn } from '@/lib/utils'
import type { Trip, TripDay, TripStage } from '@/types/trips'

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

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

export default function AktivitaetenBereich({
  reise,
  tagId: gesteuerteTagId,
  onTagWechseln,
  onUebernehmen,
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

  if (reise.days.length === 0) {
    return (
      <section
        aria-label="Aktivitäten"
        className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Aktivitäten</p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          Passend zum Reisetag
        </h2>
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Diese Reise hat noch keine Tage. Sobald ein Zeitraum feststeht, ordnet Jetnity Aktivitäten
          dem konkreten Tag zu – nicht als beliebige Liste.
        </p>
      </section>
    )
  }

  return (
    <ActivityTag
      reise={reise}
      tag={tag}
      onTagWechseln={setTagId}
      onUebernehmen={onUebernehmen}
    />
  )
}

function ActivityTag({
  reise,
  tag,
  onTagWechseln,
  onUebernehmen,
}: {
  reise: Trip
  tag: TripDay | null | undefined
  onTagWechseln: (id: string) => void
  onUebernehmen?: (
    etappe: TripStage,
    tag: TripDay,
    option: ActivityOptionSichtbar,
  ) => Promise<string | null>
}) {
  const etappe = tag ? etappeFuer(reise, tag) : null
  const [laeuft, setLaeuft] = React.useState(Boolean(etappe))
  const [uebernimmt, setUebernimmt] = React.useState(false)
  const [antwort, setAntwort] = React.useState<ActivitySucheAntwort | null>(null)
  const [meldung, setMeldung] = React.useState('')

  const eingabe = React.useMemo(() => {
    if (!tag || !etappe) return null
    return activitySucheEingabeAusReise(reise, etappe, tag)
  }, [reise, etappe, tag])

  const eingabeSchluessel = eingabe ? JSON.stringify(eingabe) : ''

  React.useEffect(() => {
    if (!eingabe) {
      setLaeuft(false)
      setAntwort(null)
      return
    }

    const steuerung = new AbortController()
    let aktiv = true
    setLaeuft(true)
    setAntwort(null)
    setMeldung('')

    void activitySucheVomClient(eingabe, { signal: steuerung.signal })
      .then((json) => {
        if (!aktiv) return
        setAntwort(json)
      })
      .catch((fehler: unknown) => {
        if (!aktiv || (fehler instanceof DOMException && fehler.name === 'AbortError')) return
        if (fehler instanceof Error && fehler.name === 'AbortError') return
        setAntwort(activitySucheFehlerAntwort('Die Aktivitätsanfrage ist gerade nicht erreichbar.'))
      })
      .finally(() => {
        if (aktiv) setLaeuft(false)
      })

    return () => {
      aktiv = false
      steuerung.abort()
    }
    // `eingabeSchluessel` hält den Effekt an den Inhalt, nicht an die Objektreferenz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eingabeSchluessel])

  const uebernehmen = async (option: ActivityOptionSichtbar) => {
    if (!onUebernehmen || !etappe || !tag || uebernimmt) return
    if (!antwort?.options.some((sichtbar) => sichtbar.id === option.id)) {
      setMeldung('Diese Aktivitätsoption stammt nicht aus der aktuellen Suche.')
      return
    }
    setUebernimmt(true)
    setMeldung('')
    const fehler = await onUebernehmen(etappe, tag, option)
    setUebernimmt(false)
    if (fehler) setMeldung(fehler)
  }

  const zustand = antwort?.status
  const geplante = tag?.items ?? []
  const zeitpunkte = geplante.filter((punkt) => punkt.startsAt)

  return (
    <section
      aria-label="Aktivitäten"
      className="min-w-0 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,46,42,0.06)] sm:p-7"
    >
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

      <div className="mt-4 min-w-0">
        <p id="activity-tag-label" className="text-xs font-medium text-ink-800">
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
        {laeuft && (
          <p aria-busy="true" className="flex items-start gap-3 rounded-2xl bg-surface-25 px-4 py-3 text-sm text-ink-800">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600" aria-hidden="true" />
            Jetnity prüft, welche Aktivitäten zu diesem Tag passen.
          </p>
        )}

        {!laeuft && antwort && (
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

            {antwort.options.length > 0 && (
              <ol className="grid min-w-0 gap-3">
                {antwort.options.map((option) => (
                  <li key={option.id} className="min-w-0">
                    <AktivitaetKarte
                      option={option}
                      laeuft={uebernimmt}
                      onUebernehmen={
                        onUebernehmen && etappe && tag ? () => void uebernehmen(option) : undefined
                      }
                    />
                  </li>
                ))}
              </ol>
            )}

            <p className="text-xs leading-5 text-ink-700">{antwort.coverageNote || ACTIVITY_ABDECKUNGSHINWEIS}</p>
          </div>
        )}
      </div>

      {meldung && (
        <p role="alert" className="mt-4 rounded-2xl bg-surface-50 px-4 py-3 text-sm text-danger-600">
          {meldung}
        </p>
      )}
    </section>
  )
}
