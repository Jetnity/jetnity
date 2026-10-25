'use client'

import * as React from 'react'

import { travellerSlots } from '@/lib/readiness/party'
import {
  abschlussAktuell,
  belegungAufnehmen,
  belegungLoesen,
  dokumentEntfernen,
  dokumentHinzufuegen,
  dokumentSetzen,
  eingabenBehalten,
  fingerprintFelder,
  lieferungAnwenden,
  neuErfassen,
  neuLaden,
  readbackUrteil,
  serialisieren,
  speichernGesperrt,
  staatsbuergerschaftEntfernen,
  staatsbuergerschaftHinzufuegen,
  staatsbuergerschaftSetzen,
  wohnsitzSetzen,
  type Belegung,
  type DocumentDraft,
  type TravellerDraft,
  type TravellerPayload,
} from '@/lib/readiness/trip-traveller-snapshot-workflow-1'
import type { Trip } from '@/types/trips'

type Lesung =
  | { art: 'success'; reise: Trip }
  | { art: 'props' }
  | { art: string; reise?: Trip }

export type IntakeWriter = (paar: { tripId: string; registryTravellerId: string }) => Promise<string | null>

type SlotPhase = 'idle' | 'pending' | 'not_sent' | 'unproven' | 'accepted' | 'consistent' | 'confirm_remove'

type SlotIntent = {
  phase: SlotPhase
  satz: string
  draftGeneration: number
  readbackAfterDelivery: number | null
  submittedFingerprint: string | null
  refresh: 'none' | 'requested' | 'unclear'
  guestBlocked: boolean
}

type IntakePhase = 'idle' | 'confirm' | 'pending' | 'accepted' | 'unproven'

type IntakeIntent = {
  phase: IntakePhase
  satz: string
  warnung: boolean
  generation: number
}

type Ledger = {
  tripId: string
  delivery: number
  operation: number
  drafts: Record<string, TravellerDraft>
  intents: Record<string, SlotIntent>
  belegt: Belegung[]
  guestUnresolved: boolean
  intakes: Record<string, IntakeIntent>
  intakeBelegt: string | null
  interaction: number
  focusTarget: string | null
}

export type TripTravellerIntakeSteuerung = {
  writerRegistrieren: (writer: IntakeWriter) => void
  anfordern: (registryTravellerId: string) => void
  bestaetigen: (registryTravellerId: string) => void
  abbrechen: (registryTravellerId: string) => void
  zustand: (registryTravellerId: string) => { phase: IntakePhase; satz: string; warnung: boolean }
  pending: boolean
}

export type TripTravellerSteuerung = {
  entwurf: (clientRef: string) => TravellerDraft | null
  intent: (clientRef: string) => SlotIntent
  bearbeitbar: boolean
  seam: 'account' | 'guest'
  speichernGesperrt: (clientRef: string) => boolean
  wohnsitzSetzen: (clientRef: string, countryCode: string) => void
  staatsbuergerschaftSetzen: (clientRef: string, citizenshipRef: string, countryCode: string) => void
  staatsbuergerschaftHinzufuegen: (clientRef: string) => void
  staatsbuergerschaftEntfernen: (clientRef: string, citizenshipRef: string) => void
  dokumentSetzen: (
    clientRef: string,
    documentRef: string,
    teil: Partial<Pick<DocumentDraft, 'documentType' | 'issuingCountryCode' | 'expiresOn' | 'citizenshipClientRef'>>,
  ) => void
  dokumentHinzufuegen: (clientRef: string) => void
  dokumentEntfernen: (clientRef: string, documentRef: string) => void
  speichern: (clientRef: string) => void
  entfernenAnfragen: (clientRef: string) => void
  entfernenBestaetigen: (clientRef: string) => void
  entfernenAbbrechen: (clientRef: string) => void
  neuLaden: (clientRef: string) => void
  eingabenBehalten: (clientRef: string) => void
  neuErfassen: (clientRef: string) => void
  gespeicherteReiseLaden: () => void
  interaktion: () => void
  focusTarget: string | null
  intake: TripTravellerIntakeSteuerung
}

const LEERES_INTENT: SlotIntent = {
  phase: 'idle',
  satz: '',
  draftGeneration: 0,
  readbackAfterDelivery: null,
  submittedFingerprint: null,
  refresh: 'none',
  guestBlocked: false,
}

function leerLedger(tripId: string): Ledger {
  return {
    tripId,
    delivery: 0,
    operation: 0,
    drafts: {},
    intents: {},
    belegt: [],
    guestUnresolved: false,
    intakes: {},
    intakeBelegt: null,
    interaction: 0,
    focusTarget: null,
  }
}

function beobachte(ledger: Ledger, reise: Trip): Ledger {
  const plaetze = travellerSlots(reise)
  const drafts = { ...ledger.drafts }
  for (const platz of plaetze) {
    const bisher = drafts[platz.clientRef] ?? null
    const intent = ledger.intents[platz.clientRef]
    const anerkannt =
      intent &&
      bisher &&
      bisher.generation === intent.draftGeneration &&
      (intent.phase === 'accepted' || intent.phase === 'consistent')
        ? intent.submittedFingerprint
        : null
    drafts[platz.clientRef] = lieferungAnwenden(
      bisher,
      platz.traveller,
      { clientRef: platz.clientRef, label: platz.label },
      undefined,
      anerkannt,
    )
  }
  const delivery = ledger.delivery + 1
  const intents = { ...ledger.intents }
  for (const platz of plaetze) {
    const intent = intents[platz.clientRef]
    const entwurf = drafts[platz.clientRef]
    if (!intent || !entwurf || intent.phase !== 'accepted' || intent.readbackAfterDelivery == null) continue
    const urteil = readbackUrteil({
      readbackAfterDelivery: intent.readbackAfterDelivery,
      submittedFingerprint: intent.submittedFingerprint ?? '',
      intentGeneration: intent.draftGeneration,
      draftGeneration: entwurf.generation,
      draftDirty: entwurf.dirty,
      delivery,
      membership: entwurf.membership,
      fingerprint: platz.traveller ? fingerprintAusTraveller(platz.traveller) : null,
    })
    if (urteil === 'consistent') intents[platz.clientRef] = { ...intent, phase: 'consistent' }
  }
  return { ...ledger, delivery, drafts, intents }
}

function fingerprintAusTraveller(traveller: NonNullable<ReturnType<typeof travellerSlots>[number]['traveller']>): string {
  return fingerprintFelder({
    clientRef: traveller.clientRef,
    label: traveller.label,
    residenceCountryCode: traveller.residenceCountryCode,
    citizenships: traveller.citizenships,
    documents: traveller.documents,
  })
}

function klasseVon(wert: unknown): 'null' | 'string' | 'malformed' {
  if (wert === null) return 'null'
  if (typeof wert === 'string') return 'string'
  return 'malformed'
}

export function useTripTravellerSnapshotLifecycle({
  tripId,
  reise,
  kanonisch,
  seam,
  onSetzen,
  onEntfernen,
  onAktualisieren,
  onGuestGraphUebernehmen,
}: {
  tripId: string
  reise: Trip
  kanonisch?: Trip
  seam: 'account' | 'guest'
  onSetzen?: (eingabe: TravellerPayload) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  onAktualisieren?: () => Promise<Lesung>
  onGuestGraphUebernehmen?: (reise: Trip) => void
}): TripTravellerSteuerung {
  const quelle = seam === 'account' && kanonisch ? kanonisch : reise
  const [ledger, setLedger] = React.useState<Ledger>(() => leerLedger(tripId))
  const [gesehen, setGesehen] = React.useState<Trip | undefined>(undefined)
  const bestand = React.useRef(ledger)
  const setzenRef = React.useRef(onSetzen)
  const entfernenRef = React.useRef(onEntfernen)
  const lesenRef = React.useRef(onAktualisieren)
  const gastRef = React.useRef(onGuestGraphUebernehmen)
  const writerRef = React.useRef<IntakeWriter | null>(null)
  const seamRef = React.useRef(seam)
  const tripRef = React.useRef(tripId)

  let anzeige = ledger.tripId === tripId ? ledger : leerLedger(tripId)
  let gesehenJetzt = ledger.tripId === tripId ? gesehen : undefined
  if (quelle !== gesehenJetzt) {
    anzeige = beobachte(anzeige, quelle)
    gesehenJetzt = quelle
  }
  if (anzeige !== ledger) setLedger(anzeige)
  if (gesehenJetzt !== gesehen) setGesehen(gesehenJetzt)

  React.useLayoutEffect(() => {
    bestand.current = ledger
  }, [ledger])

  const commit = React.useCallback((next: Ledger) => {
    bestand.current = next
    setLedger(next)
  }, [])

  React.useEffect(() => {
    setzenRef.current = onSetzen
    entfernenRef.current = onEntfernen
    lesenRef.current = onAktualisieren
    gastRef.current = onGuestGraphUebernehmen
    seamRef.current = seam
    tripRef.current = tripId
    if (bestand.current.tripId !== tripId) bestand.current = leerLedger(tripId)
  })

  const entwurfAendern = React.useCallback(
    (clientRef: string, aendern: (entwurf: TravellerDraft) => TravellerDraft) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf || aktuell.tripId !== tripRef.current) return
      const naechster = aendern(entwurf)
      const intent = aktuell.intents[clientRef]
      const gelesen = intent && (intent.phase === 'accepted' || intent.phase === 'consistent') && naechster.generation !== entwurf.generation
      commit({
        ...aktuell,
        interaction: aktuell.interaction + 1,
        focusTarget: null,
        drafts: { ...aktuell.drafts, [clientRef]: naechster },
        intents: gelesen
          ? {
              ...aktuell.intents,
              [clientRef]: { ...intent, phase: 'idle', satz: '', readbackAfterDelivery: null, submittedFingerprint: null },
            }
          : aktuell.intents,
      })
    },
    [commit],
  )

  const abschliessen = React.useCallback(
    async (
      target: string,
      schluessel: Belegung,
      draftGeneration: number,
      interaction: number,
      starten: (markierung: { entered: boolean }) => Promise<string | null>,
    ) => {
      const markierung = { entered: false }
      let wert: unknown = null
      try {
        wert = await starten(markierung)
      } catch {
        wert = markierung.entered ? Symbol('throw') : null
      }
      const writerEntered = markierung.entered
      const nachher = bestand.current
      if (nachher.tripId !== schluessel.tripId || !abschlussAktuell(nachher.belegt, schluessel)) return
      const entwurf = nachher.drafts[target]
      const belegt = belegungLoesen(nachher.belegt, schluessel)
      const fokus = nachher.interaction === interaction ? target : null
      const art = wert === null ? 'null' : typeof wert === 'string' ? klasseVon(wert) : 'malformed'
      const intent = nachher.intents[target]
      const dieseOperation = intent?.phase === 'pending' && intent.draftGeneration === draftGeneration
      if (!dieseOperation) {
        const guestBlocked = seamRef.current === 'guest' && writerEntered && art !== 'null'
        commit({
          ...nachher,
          belegt,
          focusTarget: null,
          guestUnresolved: guestBlocked ? true : nachher.guestUnresolved,
          intents:
            guestBlocked && intent
              ? { ...nachher.intents, [target]: { ...intent, guestBlocked: true } }
              : nachher.intents,
        })
        return
      }
      if (!entwurf || entwurf.generation !== draftGeneration) {
        if (art === 'null' && writerEntered) {
          commit({
            ...nachher,
            belegt,
            intents: {
              ...nachher.intents,
              [target]: {
                phase: 'idle',
                satz: 'Die vorherige Speicherung wurde angenommen. Die späteren Änderungen auf dieser Karte sind davon nicht erfasst und werden nicht von selbst wiederholt.',
                draftGeneration: entwurf?.generation ?? draftGeneration,
                readbackAfterDelivery: null,
                submittedFingerprint: null,
                refresh: 'none',
                guestBlocked: false,
              },
            },
            focusTarget: null,
          })
          return
        }
        if (!writerEntered) {
          commit({
            ...nachher,
            belegt,
            intents: {
              ...nachher.intents,
              [target]: {
                ...(intent ?? LEERES_INTENT),
                phase: 'not_sent',
                satz: 'Diese Angaben können so nicht gespeichert werden.',
                draftGeneration: entwurf?.generation ?? draftGeneration,
                guestBlocked: false,
              },
            },
            focusTarget: null,
          })
          return
        }
        const guestBlocked = seamRef.current === 'guest'
        commit({
          ...nachher,
          belegt,
          guestUnresolved: guestBlocked ? true : nachher.guestUnresolved,
          intents: {
            ...nachher.intents,
            [target]: {
              ...(intent ?? LEERES_INTENT),
              phase: 'unproven',
              satz: guestBlocked
                ? 'Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt. Eine weitere Speicherung oder Entfernung bleibt blockiert, bis die gespeicherte Reise geladen wurde.'
                : 'Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt.',
              draftGeneration: entwurf?.generation ?? draftGeneration,
              guestBlocked,
            },
          },
          focusTarget: null,
        })
        return
      }
      if (!writerEntered || art === 'null') {
        if (art === 'null' && writerEntered) {
          const delivery = nachher.delivery
          commit({
            ...nachher,
            belegt,
            guestUnresolved: false,
            intents: {
              ...nachher.intents,
              [target]: {
                phase: 'accepted',
                satz: 'Die Angaben wurden zum Speichern angenommen.',
                draftGeneration,
                readbackAfterDelivery: delivery,
                submittedFingerprint: nachher.intents[target]?.submittedFingerprint ?? null,
                refresh: 'requested',
                guestBlocked: false,
              },
            },
            focusTarget: fokus,
          })
          try {
            await lesenRef.current?.()
          } catch {
            const spaeter = bestand.current
            const intent = spaeter.intents[target]
            if (!intent || intent.draftGeneration !== draftGeneration || intent.phase !== 'accepted') return
            commit({
              ...spaeter,
              intents: { ...spaeter.intents, [target]: { ...intent, refresh: 'unclear' } },
            })
          }
          return
        }
        commit({
          ...nachher,
          belegt,
          intents: {
            ...nachher.intents,
            [target]: {
              ...(nachher.intents[target] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz: 'Diese Angaben können so nicht gespeichert werden.',
              draftGeneration,
              guestBlocked: false,
            },
          },
        })
        return
      }
      const guestBlocked = seamRef.current === 'guest'
      commit({
        ...nachher,
        belegt,
        guestUnresolved: guestBlocked ? true : nachher.guestUnresolved,
        intents: {
          ...nachher.intents,
          [target]: {
            ...(nachher.intents[target] ?? LEERES_INTENT),
            phase: 'unproven',
            satz: guestBlocked
              ? 'Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt. Eine weitere Speicherung oder Entfernung bleibt blockiert, bis die gespeicherte Reise geladen wurde.'
              : 'Das Ergebnis ist nicht bekannt. Die Angaben bleiben auf dieser Karte und werden nicht von selbst wiederholt.',
            draftGeneration,
            guestBlocked,
          },
        },
        focusTarget: fokus,
      })
    },
    [commit],
  )

  const speichern = React.useCallback(
    (clientRef: string) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      const pending = aktuell.intents[clientRef]?.phase === 'pending'
      if (!entwurf || speichernGesperrt(entwurf, pending)) {
        commit({
          ...aktuell,
          intents: {
            ...aktuell.intents,
            [clientRef]: {
              ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz: 'Diese Angaben können so nicht gespeichert werden.',
              guestBlocked: aktuell.guestUnresolved,
            },
          },
        })
        return
      }
      const generation = aktuell.operation + 1
      const aufnahme = belegungAufnehmen(aktuell.belegt, seamRef.current, tripRef.current, clientRef, generation, aktuell.guestUnresolved)
      if (aufnahme.art === 'not_sent') {
        commit({
          ...aktuell,
          intents: {
            ...aktuell.intents,
            [clientRef]: {
              ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz:
                aufnahme.grund === 'unaufgeloest'
                  ? 'Eine weitere Speicherung oder Entfernung bleibt blockiert, bis die gespeicherte Reise geladen wurde.'
                  : 'Für diese Reise ist bereits eine Speicherung oder Entfernung offen. Dieser Versuch wird nicht nachgereicht.',
              draftGeneration: entwurf.generation,
              guestBlocked: aufnahme.grund === 'unaufgeloest',
            },
          },
        })
        return
      }
      let serialisiert: ReturnType<typeof serialisieren>
      try {
        serialisiert = serialisieren(entwurf)
      } catch {
        commit({
          ...aktuell,
          intents: {
            ...aktuell.intents,
            [clientRef]: {
              ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz: 'Diese Angaben können so nicht gespeichert werden.',
            },
          },
        })
        return
      }
      if (serialisiert.art === 'not_sent') {
        commit({
          ...aktuell,
          intents: {
            ...aktuell.intents,
            [clientRef]: {
              ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz: serialisiert.satz,
              draftGeneration: entwurf.generation,
            },
          },
        })
        return
      }
      const fingerprint = fingerprintFelder(serialisiert.payload)
      const schluessel = { tripId: tripRef.current, target: clientRef, generation }
      commit({
        ...aktuell,
        operation: generation,
        belegt: aufnahme.belegt,
        intents: {
          ...aktuell.intents,
          [clientRef]: {
            phase: 'pending',
            satz: 'Die Angaben werden gespeichert …',
            draftGeneration: entwurf.generation,
            readbackAfterDelivery: null,
            submittedFingerprint: fingerprint,
            refresh: 'none',
            guestBlocked: false,
          },
        },
      })
      const payload = serialisiert.payload
      const draftGeneration = entwurf.generation
      const interaction = aktuell.interaction
      void abschliessen(clientRef, schluessel, draftGeneration, interaction, async (markierung) => {
        const writer = setzenRef.current
        if (!writer) throw new Error('writer-fehlt')
        markierung.entered = true
        return writer(payload)
      }).catch(() => undefined)
    },
    [abschliessen, commit],
  )

  const entfernenBestaetigen = React.useCallback(
    (clientRef: string) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf) return
      const generation = aktuell.operation + 1
      const aufnahme = belegungAufnehmen(aktuell.belegt, seamRef.current, tripRef.current, clientRef, generation, aktuell.guestUnresolved)
      if (aufnahme.art === 'not_sent') {
        commit({
          ...aktuell,
          intents: {
            ...aktuell.intents,
            [clientRef]: {
              ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
              phase: 'not_sent',
              satz: 'Für diese Reise ist bereits eine Speicherung oder Entfernung offen. Dieser Versuch wird nicht nachgereicht.',
              draftGeneration: entwurf.generation,
            },
          },
        })
        return
      }
      const schluessel = { tripId: tripRef.current, target: clientRef, generation }
      commit({
        ...aktuell,
        operation: generation,
        belegt: aufnahme.belegt,
        intents: {
          ...aktuell.intents,
          [clientRef]: {
            ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
            phase: 'pending',
            satz: 'Die Angaben werden entfernt …',
            draftGeneration: entwurf.generation,
          },
        },
      })
      const interaction = aktuell.interaction
      void abschliessen(clientRef, schluessel, entwurf.generation, interaction, async (markierung) => {
        const writer = entfernenRef.current
        if (!writer) throw new Error('writer-fehlt')
        markierung.entered = true
        return writer(clientRef)
      }).catch(() => undefined)
    },
    [abschliessen, commit],
  )

  const writerRegistrieren = React.useCallback((writer: IntakeWriter) => {
    writerRef.current = writer
  }, [])

  const intake: TripTravellerIntakeSteuerung = {
    writerRegistrieren,
    anfordern: (registryTravellerId) => {
      const aktuell = bestand.current
      if (aktuell.intakeBelegt) return
      const bisher = aktuell.intakes[registryTravellerId]
      commit({
        ...aktuell,
        interaction: aktuell.interaction + 1,
        intakes: {
          ...aktuell.intakes,
          [registryTravellerId]: {
            phase: 'confirm',
            satz: bisher?.phase === 'unproven' ? 'Eine erneute Übernahme kann einen weiteren Snapshot erzeugen, falls die vorherige angekommen ist.' : '',
            warnung: bisher?.phase === 'unproven',
            generation: (bisher?.generation ?? 0) + 1,
          },
        },
      })
    },
    abbrechen: (registryTravellerId) => {
      const aktuell = bestand.current
      const bisher = aktuell.intakes[registryTravellerId]
      if (!bisher || bisher.phase === 'pending') return
      commit({
        ...aktuell,
        intakes: { ...aktuell.intakes, [registryTravellerId]: { ...bisher, phase: 'idle', satz: '' } },
      })
    },
    bestaetigen: (registryTravellerId) => {
      const aktuell = bestand.current
      if (aktuell.intakeBelegt) return
      const generation = (aktuell.intakes[registryTravellerId]?.generation ?? 0) + 1
      const paar = { tripId: tripRef.current, registryTravellerId }
      const writer = writerRef.current
      commit({
        ...aktuell,
        intakeBelegt: registryTravellerId,
        intakes: {
          ...aktuell.intakes,
          [registryTravellerId]: { phase: 'pending', satz: '', warnung: false, generation },
        },
      })
      void (async () => {
        let entered = false
        let wert: unknown
        try {
          if (!writer) {
            wert = null
          } else {
            entered = true
            wert = await writer(paar)
          }
        } catch {
          wert = Symbol('throw')
        }
        const nachher = bestand.current
        if (nachher.tripId !== paar.tripId || nachher.intakes[registryTravellerId]?.generation !== generation) return
        const art = wert === null ? 'null' : typeof wert === 'string' ? 'string' : 'malformed'
        if (!entered) {
          commit({
            ...nachher,
            intakeBelegt: null,
            intakes: {
              ...nachher.intakes,
              [registryTravellerId]: { phase: 'unproven', satz: 'Das Ergebnis dieser Übernahme ist nicht bekannt. Sie wird nicht von selbst wiederholt.', warnung: true, generation },
            },
          })
          return
        }
        if (art === 'null') {
          commit({
            ...nachher,
            intakeBelegt: null,
            intakes: {
              ...nachher.intakes,
              [registryTravellerId]: { phase: 'accepted', satz: '', warnung: false, generation },
            },
          })
          try {
            await lesenRef.current?.()
          } catch {
            const spaeter = bestand.current
            const intent = spaeter.intakes[registryTravellerId]
            if (!intent || intent.generation !== generation || intent.phase !== 'accepted') return
            commit({
              ...spaeter,
              intakes: {
                ...spaeter.intakes,
                [registryTravellerId]: { ...intent, satz: 'unklar' },
              },
            })
          }
          return
        }
        commit({
          ...nachher,
          intakeBelegt: null,
          intakes: {
            ...nachher.intakes,
            [registryTravellerId]: {
              phase: 'unproven',
              satz: 'Das Ergebnis dieser Übernahme ist nicht bekannt. Sie wird nicht von selbst wiederholt.',
              warnung: true,
              generation,
            },
          },
        })
      })()
    },
    zustand: (registryTravellerId) => {
      const intent = anzeige.intakes[registryTravellerId]
      return {
        phase: intent?.phase ?? 'idle',
        satz: intent?.satz ?? '',
        warnung: intent?.warnung ?? false,
      }
    },
    pending: anzeige.intakeBelegt !== null,
  }

  return {
    entwurf: (clientRef) => anzeige.drafts[clientRef] ?? null,
    intent: (clientRef) => anzeige.intents[clientRef] ?? LEERES_INTENT,
    bearbeitbar: Boolean(onSetzen),
    seam,
    speichernGesperrt: (clientRef) => {
      const entwurf = anzeige.drafts[clientRef]
      if (!entwurf) return true
      return speichernGesperrt(entwurf, anzeige.intents[clientRef]?.phase === 'pending')
    },
    wohnsitzSetzen: (clientRef, countryCode) => entwurfAendern(clientRef, (entwurf) => wohnsitzSetzen(entwurf, countryCode)),
    staatsbuergerschaftSetzen: (clientRef, citizenshipRef, countryCode) =>
      entwurfAendern(clientRef, (entwurf) => staatsbuergerschaftSetzen(entwurf, citizenshipRef, countryCode)),
    staatsbuergerschaftHinzufuegen: (clientRef) => entwurfAendern(clientRef, (entwurf) => staatsbuergerschaftHinzufuegen(entwurf)),
    staatsbuergerschaftEntfernen: (clientRef, citizenshipRef) =>
      entwurfAendern(clientRef, (entwurf) => staatsbuergerschaftEntfernen(entwurf, citizenshipRef)),
    dokumentSetzen: (clientRef, documentRef, teil) => entwurfAendern(clientRef, (entwurf) => dokumentSetzen(entwurf, documentRef, teil)),
    dokumentHinzufuegen: (clientRef) => entwurfAendern(clientRef, (entwurf) => dokumentHinzufuegen(entwurf)),
    dokumentEntfernen: (clientRef, documentRef) => entwurfAendern(clientRef, (entwurf) => dokumentEntfernen(entwurf, documentRef)),
    speichern,
    entfernenAnfragen: (clientRef) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf || entwurf.membership !== 'present') return
      commit({
        ...aktuell,
        interaction: aktuell.interaction + 1,
        intents: {
          ...aktuell.intents,
          [clientRef]: {
            ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
            phase: 'confirm_remove',
            satz: `${entwurf.label ?? clientRef}: Die gespeicherten Angaben für diesen Reiseplatz werden entfernt. Die Personenzahl bleibt, der leere Platz bleibt, und eine Person im Konto-Register wird nicht gelöscht.`,
            draftGeneration: entwurf.generation,
          },
        },
      })
    },
    entfernenBestaetigen,
    entfernenAbbrechen: (clientRef) => {
      const aktuell = bestand.current
      const intent = aktuell.intents[clientRef]
      if (!intent || intent.phase !== 'confirm_remove') return
      commit({
        ...aktuell,
        focusTarget: clientRef,
        intents: { ...aktuell.intents, [clientRef]: { ...intent, phase: 'idle', satz: '' } },
      })
    },
    neuLaden: (clientRef) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf) return
      const platz = travellerSlots(quelle).find((eintrag) => eintrag.clientRef === clientRef)
      commit({
        ...aktuell,
        drafts: {
          ...aktuell.drafts,
          [clientRef]: neuLaden(entwurf, platz?.traveller ?? null, platz?.label ?? entwurf.label),
        },
        intents: { ...aktuell.intents, [clientRef]: { ...(aktuell.intents[clientRef] ?? LEERES_INTENT), phase: 'idle', satz: '' } },
      })
    },
    eingabenBehalten: (clientRef) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf) return
      const platz = travellerSlots(quelle).find((eintrag) => eintrag.clientRef === clientRef)
      commit({
        ...aktuell,
        drafts: { ...aktuell.drafts, [clientRef]: eingabenBehalten(entwurf, platz?.traveller ?? null) },
      })
    },
    neuErfassen: (clientRef) => {
      const aktuell = bestand.current
      const entwurf = aktuell.drafts[clientRef]
      if (!entwurf) return
      commit({
        ...aktuell,
        drafts: { ...aktuell.drafts, [clientRef]: neuErfassen(entwurf, entwurf.label) },
        intents: {
          ...aktuell.intents,
          [clientRef]: {
            ...(aktuell.intents[clientRef] ?? LEERES_INTENT),
            phase: 'idle',
            satz: 'Ein späteres Speichern legt die Angaben für diesen Reiseplatz neu an.',
          },
        },
      })
    },
    gespeicherteReiseLaden: () => {
      void (async () => {
        let lesung: Lesung | undefined
        try {
          lesung = await lesenRef.current?.()
        } catch {
          return
        }
        if (!lesung || lesung.art !== 'success' || !lesung.reise || lesung.reise.id !== tripRef.current) return
        gastRef.current?.(lesung.reise)
        const nachher = bestand.current
        if (nachher.tripId !== tripRef.current) return
        const intents = { ...nachher.intents }
        for (const [ref, intent] of Object.entries(intents)) {
          if (intent.guestBlocked) intents[ref] = { ...intent, guestBlocked: false }
        }
        commit({ ...nachher, guestUnresolved: false, intents })
      })()
    },
    interaktion: () => {
      const aktuell = bestand.current
      commit({ ...aktuell, interaction: aktuell.interaction + 1, focusTarget: null })
    },
    focusTarget: anzeige.focusTarget,
    intake,
  }
}
