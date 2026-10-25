'use client'

import * as React from 'react'

import {
  annehmen,
  draftSetzen,
  editorBewegt,
  entscheiden,
  entwurfGeaendert,
  gastErgebnis,
  kontoBeobachten,
  leerLedger,
  manuellLesen,
  scheitern,
  PERSONAL_UNKLAR,
  type PersonalAuftrag,
  type PersonalDispatch,
  type PersonalFilter,
  type PersonalIntent,
  type PersonalLedger,
  type ReadinessAktualisierung,
} from '@/lib/readiness/personal-preparation-workflow'
import type { ReadinessUserStatus, Trip } from '@/types/trips'

export type PersonalSteuerung = {
  intents: readonly PersonalIntent[]
  barrier: boolean
  hinweis: string | null
  kontextReise: Trip
  fokusIntentId: string | null
  titelLeerenFuer: string | null
  draft: string
  continuationUsed: boolean
  lieferung: number
  erstellen: (title: string, filter: PersonalFilter) => void
  entwurfGeaendert: () => void
  draftSetzen: (title: string) => void
  editorBewegt: (clientRef: string, generation: number) => void
  bearbeiten: (eingabe: {
    clientRef: string
    title: string
    userStatus: ReadinessUserStatus
    boundEpoch: string
    editorGeneration: number
    filter: PersonalFilter
  }) => void
  entfernen: (clientRef: string, filter: PersonalFilter, editorGeneration: number) => void
  erneut: (intentId: string) => void
  verwerfen: (intentId: string) => void
  aktualisieren: () => void
}

export function usePersonalPreparationLifecycle({
  tripId,
  reise,
  kanonisch,
  seam,
  onSetzen,
  onEntfernen,
  onAktualisieren,
}: {
  tripId: string
  reise: Trip
  kanonisch?: Trip
  seam: 'account' | 'guest'
  onSetzen?: (eingabe: {
    clientRef: string
    kind: 'preparation'
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  onAktualisieren?: () => Promise<ReadinessAktualisierung>
}): PersonalSteuerung {
  const [stand, setStand] = React.useState<PersonalLedger>(() => leerLedger(tripId))
  const [beobachtet, setBeobachtet] = React.useState<Trip | undefined>(undefined)
  const bestand = React.useRef(stand)
  const setzenRef = React.useRef(onSetzen)
  const entfernenRef = React.useRef(onEntfernen)
  const lesenRef = React.useRef(onAktualisieren)
  const kontextRef = React.useRef(reise)
  const kanonischRef = React.useRef(kanonisch)
  const seamRef = React.useRef(seam)
  const kontextReise = seam === 'account' && kanonisch ? kanonisch : reise

  let anzeige = stand.tripId === tripId ? stand : leerLedger(tripId)
  let gesehen = stand.tripId === tripId ? beobachtet : undefined
  if (seam === 'account' && kanonisch && kanonisch !== gesehen) {
    anzeige = kontoBeobachten(anzeige, kanonisch)
    gesehen = kanonisch
  }
  if (anzeige !== stand) setStand(anzeige)
  if (gesehen !== beobachtet) setBeobachtet(gesehen)

  const commit = React.useCallback((next: PersonalLedger) => {
    bestand.current = next
    setStand(next)
  }, [])

  React.useEffect(() => {
    bestand.current = stand
    setzenRef.current = onSetzen
    entfernenRef.current = onEntfernen
    lesenRef.current = onAktualisieren
    kontextRef.current = kontextReise
    kanonischRef.current = kanonisch
    seamRef.current = seam
  })

  const ausfuehren = React.useCallback(
    async (auftrag: PersonalAuftrag) => {
      let fehler: string | null = null
      let geworfen = false
      try {
        if (auftrag.art === 'delete') {
          fehler = entfernenRef.current ? await entfernenRef.current(auftrag.clientRef) : 'Entfernen ist hier nicht verbunden.'
        } else if (!setzenRef.current || !auftrag.payload) {
          fehler = 'Speichern ist hier nicht verbunden.'
        } else {
          fehler = await setzenRef.current(auftrag.payload)
        }
      } catch {
        geworfen = true
      }
      if (bestand.current.tripId !== auftrag.tripId) return
      if (geworfen) {
        commit(scheitern(bestand.current, auftrag.intentId, auftrag.lauf, PERSONAL_UNKLAR, 'unclear'))
        return
      }
      if (fehler) {
        commit(scheitern(bestand.current, auftrag.intentId, auftrag.lauf, fehler, 'error'))
        return
      }
      const angenommen = annehmen(bestand.current, auftrag.intentId, auftrag.lauf)
      commit(angenommen.ledger)
      if (!angenommen.lesen || !lesenRef.current) return
      let lesung: ReadinessAktualisierung
      try {
        lesung = await lesenRef.current()
      } catch {
        if (seamRef.current === 'guest' && bestand.current.tripId === auftrag.tripId) {
          commit(gastErgebnis(bestand.current, auftrag.intentId, auftrag.lauf, { art: 'unreadable' }, auftrag.tripId))
        }
        return
      }
      if (bestand.current.tripId !== auftrag.tripId) return
      if (seamRef.current === 'guest') {
        commit(gastErgebnis(bestand.current, auftrag.intentId, auftrag.lauf, lesung, auftrag.tripId))
      }
    },
    [commit],
  )

  const senden = React.useCallback(
    (dispatch: PersonalDispatch) => {
      const ergebnis = entscheiden(bestand.current, dispatch, kontextRef.current, kanonischRef.current ?? null)
      commit(ergebnis.ledger)
      if (ergebnis.auftrag) void ausfuehren(ergebnis.auftrag)
    },
    [ausfuehren, commit],
  )

  const fortsetzung = anzeige.intents.some((intent) => intent.continuationUsed)

  return {
    intents: anzeige.intents,
    barrier: anzeige.barrier,
    hinweis: anzeige.hinweis,
    kontextReise,
    fokusIntentId: anzeige.fokusIntentId,
    titelLeerenFuer: anzeige.titelLeerenFuer,
    draft: anzeige.draft,
    continuationUsed: fortsetzung,
    lieferung: anzeige.lieferung,
    erstellen: (title, filter) => senden({ art: 'create', title, filter }),
    entwurfGeaendert: () => {
      const next = entwurfGeaendert(bestand.current)
      if (next !== bestand.current) commit(next)
    },
    draftSetzen: (title: string) => {
      const next = draftSetzen(bestand.current, title)
      if (next !== bestand.current) commit(next)
    },
    editorBewegt: (clientRef, generation) => commit(editorBewegt(bestand.current, clientRef, generation)),
    bearbeiten: (eingabe) => senden({ art: 'edit', ...eingabe }),
    entfernen: (clientRef, filter, editorGeneration) => senden({ art: 'delete', clientRef, filter, editorGeneration }),
    erneut: (intentId) => senden({ art: 'retry', intentId }),
    verwerfen: (intentId) => senden({ art: 'discard', intentId }),
    aktualisieren: () => {
      const lesen = lesenRef.current
      if (!lesen) return
      void lesen().then((lesung) => {
        if (bestand.current.tripId !== tripId) return
        if (seamRef.current === 'guest') commit(manuellLesen(bestand.current, lesung, tripId))
      }).catch(() => {
        if (bestand.current.tripId !== tripId) return
        if (seamRef.current === 'guest') commit(manuellLesen(bestand.current, { art: 'unreadable' }, tripId))
      })
    },
  }
}
