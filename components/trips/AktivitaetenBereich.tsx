'use client'

// components/trips/AktivitaetenBereich.tsx
//
// Aktivitäten nach bestätigtem Reiseziel. Die Fläche lädt das sichtbare Ziel
// von selbst. Ein Reisetag ist eine spätere Einordnung, keine Voraussetzung.
// Die Übernahme schreibt nur auf einen Tag dieser Etappe.

import * as React from 'react'

import type { ActivityOptionSichtbar, ActivitySucheAntwort } from '@/lib/activities/client-sicht'
import { activitySucheFehlerAntwort, activitySucheVomClient } from '@/lib/activities/client-anfrage'
import { ACTIVITY_ABDECKUNGSHINWEIS } from '@/lib/activities/domain'
import { activitySucheEingabeAusReise } from '@/lib/activities/tageskontext'
import {
  activitySuchKontextSchluessel,
  leeresUebernahmeRegister,
  activityOptionFuerUebernahme,
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
import { aktivitaetsZieleWaehlen, type AktivitaetsTagEntscheidung } from '@/lib/activities/zielauswahl'
import AktivitaetKarte from '@/components/trips/AktivitaetKarte'
import ViatorPruefung from '@/components/trips/ViatorPruefung'
import GetYourGuideAktivitaeten from '@/components/trips/GetYourGuideAktivitaeten'
import ViatorWidgetAktivitaeten from '@/components/trips/ViatorWidgetAktivitaeten'
import { istOrtId, type Ort } from '@/lib/places/domain'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import { cn } from '@/lib/utils'
import type { Trip, TripDay, TripStage } from '@/types/trips'
import { AlertCircle, Loader2 } from 'lucide-react'

const kurzesDatum = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

const NETZ_MELDUNG = 'Die Aktivitätsanfrage ist gerade nicht erreichbar.'

const FELD =
  'min-h-11 w-full min-w-0 max-w-full rounded-xl border border-line-200 bg-white px-[12px] text-sm text-ink-900'

export function nativeAktivitaetsAnzeige(status: string | null): { label: string; abdeckung: boolean } {
  if (status === null) return { label: 'Für diesen Tag suchen', abdeckung: false }
  if (status === 'unavailable') return { label: 'Suche erneut prüfen', abdeckung: false }
  return { label: 'Erneut suchen', abdeckung: true }
}

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

function tagTitel(tag: TripDay): string {
  if (tag.title) return tag.title
  if (tag.dayDate) return kurzesDatum.format(alsDatum(tag.dayDate))
  return `Tag ${tag.dayIndex}`
}

function besuchsLabel(name: string, tage: readonly { dayDate: string | null }[]): string {
  const daten = tage.flatMap((tag) => (tag.dayDate ? [kurzesDatum.format(alsDatum(tag.dayDate))] : []))
  if (daten.length === 0) return name
  if (daten.length === 1) return `${name} · ${daten[0]}`
  return `${name} · ${daten[0]}–${daten[daten.length - 1]}`
}

function istAbbruch(fehler: unknown): boolean {
  return (
    (fehler instanceof DOMException && fehler.name === 'AbortError') ||
    (fehler instanceof Error && fehler.name === 'AbortError')
  )
}

function ortIdsAus(reise: Trip): string[] {
  const ids: string[] = []
  const gesehen = new Set<string>()
  const folge = [...reise.stages].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
  for (const etappe of folge) {
    if (!etappe.placeId || !istOrtId(etappe.placeId) || gesehen.has(etappe.placeId)) continue
    gesehen.add(etappe.placeId)
    ids.push(etappe.placeId)
  }
  return ids
}

function BeobachteteKarte({
  option,
  verweis,
  laeuft,
  onUebernehmen,
  onPruefen,
  onUebernahmeBeobachten,
}: {
  option: ActivityOptionSichtbar
  verweis?: { productUrl: string } | null
  laeuft: boolean
  onUebernehmen?: () => void
  onPruefen?: () => void
  onUebernahmeBeobachten?: (aufnahme: { id: string; ausloesen: () => void }) => void
}) {
  React.useEffect(() => {
    if (!onUebernehmen || !onUebernahmeBeobachten) return
    onUebernahmeBeobachten({ id: option.id, ausloesen: onUebernehmen })
  })
  return <AktivitaetKarte option={option} verweis={verweis} laeuft={laeuft} onUebernehmen={onUebernehmen} onPruefen={onPruefen} />
}

type Lokal = {
  etappeId: string | null
  tag: AktivitaetsTagEntscheidung
}

export default function AktivitaetenBereich({
  reise,
  tagId: gesteuerteTagId,
  onTagWechseln,
  onUebernehmen,
  onUebernahmeBeobachten,
  sichtbar = true,
  bestaetigteOrte,
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
  /** Die Fläche ist eingeblendet. Eine verdeckte Fläche lädt nichts. */
  sichtbar?: boolean
  /**
   * Abgeschlossene kanonische Orte. Fehlt das Prop, liest die Fläche sie selbst.
   * null heisst: die Lesung läuft noch.
   */
  bestaetigteOrte?: ReadonlyMap<string, Ort | null> | null
}) {
  const ortSchluessel = ortIdsAus(reise).join('|')
  const [geladeneOrte, setGeladeneOrte] = React.useState<ReadonlyMap<string, Ort | null> | null>(null)
  const orte = bestaetigteOrte !== undefined ? bestaetigteOrte : geladeneOrte

  React.useEffect(() => {
    if (bestaetigteOrte !== undefined) return
    const ids = ortSchluessel ? ortSchluessel.split('|') : []
    if (ids.length === 0) {
      setGeladeneOrte(new Map())
      return
    }
    let lebend = true
    setGeladeneOrte(null)
    void (async () => {
      const map = new Map<string, Ort | null>()
      for (const id of ids) {
        if (!lebend) return
        try {
          const ergebnis = await ortBestaetigen(id, 'ziel')
          map.set(id, ergebnis.ok && ergebnis.wert.id === id ? ergebnis.wert : null)
        } catch {
          map.set(id, null)
        }
        if (!lebend) return
      }
      if (lebend) setGeladeneOrte(map)
    })()
    return () => {
      lebend = false
    }
  }, [bestaetigteOrte, ortSchluessel])

  const [eigeneTagId, setEigeneTagId] = React.useState(reise.days[0]?.id ?? '')
  const [lokal, setLokal] = React.useState<Lokal | null>(null)
  const [reiseStand, setReiseStand] = React.useState(reise.id)
  if (reiseStand !== reise.id) {
    setReiseStand(reise.id)
    setLokal(null)
    setEigeneTagId(reise.days[0]?.id ?? '')
  }

  React.useEffect(() => {
    setLokal((bisher) => {
      if (!bisher || bisher.tag.art !== 'tag') return bisher
      if (gesteuerteTagId && bisher.tag.tagId !== gesteuerteTagId) return null
      return bisher
    })
  }, [gesteuerteTagId])

  const wirksamerTagId = gesteuerteTagId ?? eigeneTagId
  const wahl = aktivitaetsZieleWaehlen({
    etappen: reise.stages,
    tage: reise.days,
    tagId: wirksamerTagId || null,
    gewaehlteEtappeId: lokal?.etappeId ?? null,
    tagEntscheidung: lokal?.tag ?? { art: 'automatisch' },
    orte,
  })
  const gewaehlt = wahl.gewaehlt
  const etappe = gewaehlt ? reise.stages.find((eintrag) => eintrag.id === gewaehlt.stageId) ?? null : null
  const adoptTag = wahl.tagFilter
    ? reise.days.find((eintrag) => eintrag.id === wahl.tagFilter?.id && eintrag.stageId === gewaehlt?.stageId) ?? null
    : null

  const eingabe = (() => {
    if (!etappe || !gewaehlt || gewaehlt.status !== 'bereit' || !gewaehlt.kanonischerName) return null
    const basis = activitySucheEingabeAusReise(
      reise,
      {
        ...etappe,
        name: gewaehlt.kanonischerName,
        placeId: gewaehlt.placeId,
        countryCode: gewaehlt.countryCode,
      },
      adoptTag,
    )
    if (!adoptTag) return { ...basis, day: null, items: [] }
    return basis
  })()
  const anfrageSchluessel = eingabe ? JSON.stringify(eingabe) : ''
  const kontext = activitySuchKontextSchluessel({
    tripId: reise.id,
    stageId: etappe?.id ?? null,
    dayId: adoptTag?.id ?? null,
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

  const [viatorWahl, setViatorWahl] = React.useState<{ kontext: string; code: string } | null>(null)
  const viatorCode = viatorWahl?.kontext === kontext ? viatorWahl.code : null
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

  const starten = React.useCallback(() => {
    if (!eingabe || !etappe) return
    const entscheid = suchDispatch(laufRef.current)
    if (!entscheid.angenommen) return
    setViatorWahl(null)
    laufRef.current = entscheid.lauf
    setLauf(entscheid.lauf)
    abortRef.current?.abort()
    const steuerung = new AbortController()
    abortRef.current = steuerung
    const erwartet = { epoche: entscheid.epoche, generation: entscheid.generation }
    void activitySucheVomClient(eingabe, { signal: steuerung.signal })
      .then((json) => {
        if (abortRef.current !== steuerung) return
        antwortSetzen(erwartet, json)
      })
      .catch((fehler: unknown) => {
        if (istAbbruch(fehler) || abortRef.current !== steuerung) return
        antwortSetzen(erwartet, activitySucheFehlerAntwort(NETZ_MELDUNG))
      })
  }, [eingabe, etappe])

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort()
      abortRef.current = null
    }
  }, [])

  const uebernehmen = (option: ActivityOptionSichtbar, erfasst: UebernahmeErfassung) => {
    if (!onUebernehmen || !etappe || !adoptTag) return
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
    const tagFest = adoptTag
    void (async () => {
      let wert: unknown = undefined
      try {
        wert = await onUebernehmen(etappeFest, tagFest, activityOptionFuerUebernahme(option))
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

  const zielSetzen = (stageId: string) => {
    setLokal({ etappeId: stageId, tag: { art: 'kein-datum' } })
    setViatorWahl(null)
  }

  const tagSetzen = (tagId: string) => {
    if (!tagId) {
      setLokal({ etappeId: gewaehlt?.stageId ?? null, tag: { art: 'kein-datum' } })
      return
    }
    const tag = reise.days.find((eintrag) => eintrag.id === tagId) ?? null
    const etappeId =
      tag?.stageId && reise.stages.some((eintrag) => eintrag.id === tag.stageId)
        ? tag.stageId
        : gewaehlt?.stageId ?? null
    setLokal({ etappeId, tag: { art: 'tag', tagId } })
    if (tag?.stageId && etappeId === tag.stageId) {
      if (onTagWechseln) onTagWechseln(tagId)
      else setEigeneTagId(tagId)
    }
    setViatorWahl(null)
  }

  const antwort = angezeigt.phase === 'fertig' ? angezeigt.antwort : null
  const suchLaeuft = angezeigt.phase === 'loading'
  const zustand = antwort?.status
  const kartenSichtbar = zustand === 'ok' || zustand === 'partial'
  const anzeige = nativeAktivitaetsAnzeige(antwort ? (zustand ?? null) : null)
  const kannSuchen = Boolean(eingabe && etappe && gewaehlt?.status === 'bereit')
  const selectTag =
    lokal?.tag.art === 'kein-datum' ? '' : lokal?.tag.art === 'tag' ? lokal.tag.tagId : wahl.tagFilter?.id ?? ''
  const kartenSchluessel =
    suchLaeuft || antwort
      ? kartenSichtbar
        ? (antwort?.options ?? []).map((option) =>
            uebernahmeOperationSchluessel({
              tripId: reise.id,
              stageId: etappe?.id ?? '',
              dayId: adoptTag?.id ?? '',
              schreibIdentitaet: optionSchreibIdentitaet(option, adoptTag?.dayDate ?? null),
            }),
          )
        : []
      : null
  const hinweisSicht =
    etappe && adoptTag
      ? uebernahmeHinweisTexte(hinweise, {
          tripId: reise.id,
          stageId: etappe.id,
          dayId: adoptTag.id,
          karten: kartenSchluessel,
        })
      : { allgemein: [], jeKarte: {} }
  const tageDerEtappe = gewaehlt?.tage.length ?? 0

  return (
    <section
      aria-label="Aktivitäten"
      data-organisieren-flaeche="suche"
      data-aktivitaet-ziel={gewaehlt?.stageId ?? ''}
      data-aktivitaet-ziel-status={gewaehlt?.status ?? 'keine'}
      data-aktivitaet-ziel-name={gewaehlt?.name ?? ''}
      data-aktivitaet-tag={wahl.tagFilter?.id ?? ''}
      data-aktivitaet-suche={sichtbar ? angezeigt.phase : 'verdeckt'}
      className={cn(ORGANISIEREN_FLAECHE_KLASSE, 'relative w-full min-w-0 max-w-none !p-[12px] sm:!p-5')}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-citrus-400" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Aktivitäten</p>
        <h2 className="mt-1 break-words text-xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-2xl">
          {gewaehlt?.name ?? 'Reiseziel'}
        </h2>
        <p className="mt-1 text-sm text-ink-800">Anbieter: GetYourGuide und Viator</p>
        {wahl.datumOffen && gewaehlt ? (
          <p className="mt-1 break-words text-sm text-ink-800">Ideen für {gewaehlt.name} · Datum später wählen</p>
        ) : null}
        {gewaehlt?.status === 'land' ? (
          <p className="mt-1 break-words text-sm leading-6 text-ink-800">
            {gewaehlt.name} ist ein Land. Die Ideen gelten für das ganze Land, nicht für einen einzelnen Ort oder Tag.
          </p>
        ) : null}
        {adoptTag?.dayDate ? (
          <p className="mt-1 text-sm text-ink-800">{kurzesDatum.format(alsDatum(adoptTag.dayDate))}</p>
        ) : null}
      </div>

      {wahl.ziele.length > 0 ? (
        <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 gap-1 text-sm text-ink-800" htmlFor="activity-destination-select">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Ziel</span>
            <select
              id="activity-destination-select"
              value={gewaehlt?.stageId ?? ''}
              onChange={(event) => zielSetzen(event.target.value)}
              className={FELD}
            >
              {wahl.ziele.map((ziel) => (
                <option key={ziel.stageId} value={ziel.stageId}>
                  {besuchsLabel(ziel.name, ziel.tage)}
                </option>
              ))}
            </select>
          </label>
          {reise.days.length > 0 ? (
            <div className="min-w-0">
              <label className="grid min-w-0 gap-1 text-sm text-ink-800" htmlFor="activity-day-select">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">Reisetag</span>
                <select
                  id="activity-day-select"
                  value={selectTag}
                  onChange={(event) => tagSetzen(event.target.value)}
                  className={FELD}
                >
                  <option value="">Datum später wählen</option>
                  {reise.days.map((eintrag) => (
                    <option key={eintrag.id} value={eintrag.id}>
                      {tagTitel(eintrag)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink-800">Diese Reise hat noch kein Ziel. Jetnity legt dafür keine Etappe an.</p>
      )}

      {gewaehlt?.status === 'ausstehend' ? (
        <p aria-busy="true" className="mt-4 text-sm leading-6 text-ink-800">
          Das Ziel wird bestätigt. Angebote laden dabei noch nicht.
        </p>
      ) : null}
      {gewaehlt?.status === 'unbestaetigt' ? (
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Dieses Ziel ist nicht bestätigt. Wähle ein bestätigtes Ziel der Reise. Die gespeicherte Etappe bleibt unverändert.
        </p>
      ) : null}
      {gewaehlt?.status === 'widerspruch' ? (
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Die bestätigten Ortsangaben passen nicht zusammen. Für dieses Ziel lädt Jetnity nichts.
        </p>
      ) : null}
      {gewaehlt?.status === 'nicht_unterstuetzt' ? (
        <p className="mt-4 text-sm leading-6 text-ink-800">
          Für {gewaehlt.name} liegt keine geprüfte Zuordnung vor. Das sagt nichts darüber aus, ob es Angebote gibt.
        </p>
      ) : null}

      {kannSuchen ? (
        <button
          type="button"
          onClick={starten}
          disabled={suchLaeuft}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
        >
          {anzeige.label}
        </button>
      ) : null}

      <div className="mt-5 min-h-[4rem] min-w-0" aria-live="polite">
        {suchLaeuft && (
          <p aria-busy="true" className="flex items-start gap-3 text-sm text-ink-800">
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand-600 motion-reduce:animate-none" aria-hidden="true" />
            Angebote für {gewaehlt?.name ?? 'dieses Ziel'} werden geladen.
          </p>
        )}

        {!suchLaeuft && antwort && (
          <div className="grid min-w-0 gap-4">
            {zustand === 'unavailable' && (
              <p role="status" className="text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}
            {zustand === 'empty' && (
              <p role="status" className="text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}
            {zustand === 'partial' && (
              <p role="status" className="text-sm leading-6 text-ink-800">
                {antwort.message}
              </p>
            )}
            {(zustand === 'timeout' || zustand === 'error' || zustand === 'invalid' || zustand === 'rate_limited') && (
              <p role="status" className="flex items-start gap-3 text-sm leading-6 text-ink-800">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                {antwort.message}
              </p>
            )}

            {kartenSichtbar && antwort.options.length > 0 && !adoptTag ? (
              <p className="text-sm leading-6 text-ink-800">
                {tageDerEtappe > 0
                  ? 'Wähle einen Reisetag dieser Etappe, dann kann ein Vorschlag in den Reiseplan. Ein Tag ohne dieses Ziel wird nicht beschrieben.'
                  : 'Für diese Etappe gibt es noch keinen Reisetag. Jetnity legt keinen Tag an.'}
              </p>
            ) : null}

            {kartenSichtbar && antwort.options.length > 0 && (
              <ol className="grid min-w-0 gap-3">
                {antwort.options.map((option) => {
                  const inhalt = optionInhaltSchluessel(option)
                  const erfasst: UebernahmeErfassung = {
                    tripId: reise.id,
                    stageId: etappe?.id ?? '',
                    dayId: adoptTag?.id ?? '',
                    epoche: angezeigt.epoche,
                    generation: angezeigt.generation ?? 0,
                    optionInhalt: inhalt,
                    schreibIdentitaet: optionSchreibIdentitaet(option, adoptTag?.dayDate ?? null),
                  }
                  const schluessel = uebernahmeOperationSchluessel(erfasst)
                  const gesperrt =
                    register.laufend.includes(schluessel) ||
                    register.angenommen.includes(schluessel) ||
                    register.unbestaetigt.includes(schluessel)
                  const ausloesen =
                    onUebernehmen && etappe && adoptTag ? () => uebernehmen(option, erfasst) : undefined
                  return (
                    <li key={`${angezeigt.generation ?? 0}:${inhalt}:${etappe?.id ?? ''}`} className="min-w-0">
                      <BeobachteteKarte
                        option={option}
                        verweis={antwort.viatorVerweise?.find((eintrag) => eintrag.externalRef === option.externalRef) ?? null}
                        laeuft={gesperrt}
                        onUebernehmen={ausloesen}
                        onPruefen={
                          option.provider === 'viator'
                            ? () => setViatorWahl({ kontext, code: option.externalRef })
                            : undefined
                        }
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

            {viatorCode ? (
              <ViatorPruefung
                key={`${kontext}:${viatorCode}`}
                productCode={viatorCode}
                dayDate={adoptTag?.dayDate ?? null}
                gewuenschteWaehrung={reise.currency}
              />
            ) : null}

            {anzeige.abdeckung ? (
              <p className="text-xs leading-5 text-ink-700">{antwort.coverageNote || ACTIVITY_ABDECKUNGSHINWEIS}</p>
            ) : null}
          </div>
        )}
      </div>

      {hinweisSicht.allgemein.map((text) => (
        <p key={text} role="status" className="mt-4 rounded-2xl bg-surface-50 px-4 py-3 text-sm leading-6 text-ink-800">
          {text}
        </p>
      ))}

      <ViatorWidgetAktivitaeten
        name={
          gewaehlt && (gewaehlt.status === 'bereit' || gewaehlt.status === 'land') ? gewaehlt.kanonischerName : null
        }
        gesperrt={[reise.id, ...reise.stages.map((etappe) => etappe.id), ...reise.days.map((tag) => tag.id)]}
        sichtbar={sichtbar}
        land={gewaehlt?.status === 'land'}
      />

      <GetYourGuideAktivitaeten
        key={reise.id}
        reise={reise}
        angeforderteTagId={null}
        etappeId={gewaehlt?.stageId ?? null}
        orte={orte}
        sichtbar={sichtbar && gewaehlt?.status !== 'ausstehend'}
      />
    </section>
  )
}
