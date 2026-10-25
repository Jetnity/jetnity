// lib/readiness/personal-preparation-workflow.ts
//
// Eigene Vorbereitung: Identität, Kontextprüfung und Lesebestätigung.
// Der Fingerprint bleibt der bestehende readinessFingerprint. Er steht nie
// in der Schreiblast. Eine fehlgeschlagene Gastreise-Lesung sperrt jede
// eigene Schreibabsicht, bis dieselbe Reise erfolgreich gelesen wurde.

import { readinessClientRefErzeugen } from '@/lib/readiness/bauen'
import { readinessItemsVon, type ReadinessCurrentness } from '@/lib/readiness/domain'
import { readinessFingerprint } from '@/lib/readiness/fingerprint'
import {
  punktFuerReadiness,
  readinessReisekontext,
  routeFingerprintFelder,
  travellerFingerprintFelderFuer,
} from '@/lib/readiness/kontext'
import { readinessAnsicht } from '@/lib/readiness/status'
import type { ReadinessUserStatus, Trip, TripReadinessItem } from '@/types/trips'

export const PERSONAL_SUCHE_LABEL = 'Suche in eigenen Punkten'
export const PERSONAL_FILTER_LABEL = 'Eigene Punkte filtern'
export const PERSONAL_LEER = 'Noch keine eigene Vorbereitung.'
export const PERSONAL_KEIN_TREFFER = 'Keine eigenen Punkte passen zu dieser Suche oder Auswahl.'
export const PERSONAL_AKTUALISIEREN = 'Stand neu lesen'
export const PERSONAL_VERWERFEN = 'Versuch lokal verwerfen'
export const PERSONAL_STALE_ERKLAERUNG =
  'Dieser Stand ist erneut zu prüfen. Die bisherige Markierung Erledigt oder Nicht relevant gilt nicht mehr als aktuell. Offen ist vorausgewählt. Erledigt oder Nicht relevant werden nur gespeichert, wenn du sie in dieser Bearbeitung neu auswählst.'
export const PERSONAL_BARRIERE =
  'Der gespeicherte Stand dieser Reise konnte nicht gelesen werden. Speichern bleibt gesperrt, bis ein Lesen genau dieser Reise gelingt. Der Entwurf bleibt erhalten.'
export const PERSONAL_UNSICHER =
  'Der gelesene Stand bestätigt diesen Vorgang nicht. Das ist kein Beweis, dass nichts gespeichert wurde. Ein erneuter Versuch verwendet dieselbe Kennung.'
export const PERSONAL_VERALTET =
  'Der Punkt ist im gelesenen Stand noch als erneut zu prüfen markiert. Die erneute Auswahl gilt deshalb nicht als bestätigt.'
export const PERSONAL_ABGESTIMMT =
  'Der sichtbare Stand stimmt mit dieser Eingabe überein. Das belegt nicht, welcher Vorgang ihn geschrieben hat.'
export const PERSONAL_BESTAETIGT = 'Gespeichert und im aktuellen Stand sichtbar.'
export const PERSONAL_AUSSTEHEND = 'Angenommen, der aktuelle Stand ist noch nicht neu gelesen.'
export const PERSONAL_VERWORFEN =
  'Der Versuch ist nur lokal verworfen. Ein bereits abgeschickter Schreibvorgang wird dadurch nicht zurückgenommen.'
export const PERSONAL_ZIEL_WEG =
  'Dieser Punkt ist im aktuellen Stand nicht mehr vorhanden. Er wird nicht neu angelegt.'
export const PERSONAL_KONTEXT =
  'Die Auswahl gilt für einen älteren Reisekontext. Offen ist wieder ausgewählt. Erledigt oder Nicht relevant brauchen eine neue Auswahl.'
export const PERSONAL_UNKLAR =
  'Das Ergebnis ist unklar. Es wird nichts automatisch erneut gesendet.'
export const PERSONAL_ERST_LESEN =
  'Der Ausgang ist unklar. Lies zuerst den aktuellen Stand. Ein Schreibversuch bleibt gesperrt, bis diese Reise gelesen wurde.'

export const PERSONAL_FILTER = [
  ['alle', 'Alle'],
  ['offen', 'Offen'],
  ['erneut', 'Erneut prüfen'],
  ['erledigt', 'Erledigt'],
  ['nicht_relevant', 'Nicht relevant'],
] as const

export type PersonalFilter = (typeof PERSONAL_FILTER)[number][0]

export type ReadinessAktualisierung =
  | { art: 'props' }
  | { art: 'success'; reise: Trip }
  | { art: 'missing' }
  | { art: 'invalid'; grund: 'json' | 'graph' }
  | { art: 'unreadable' }
  | { art: 'wrong_trip' }

export type PersonalEingabe = {
  clientRef: string
  kind: 'preparation'
  userStatus: ReadinessUserStatus
  countryCode: string | null
  tripItemId: string | null
  title: string | null
}

export type PersonalPhase =
  | 'pending'
  | 'awaiting'
  | 'confirmed'
  | 'reconciled'
  | 'stale_unconfirmed'
  | 'error'
  | 'unclear'
  | 'conflict'
  | 'blocked'
  | 'absent_uncertain'

export type PersonalIntent = {
  id: string
  lauf: number
  art: 'create' | 'edit' | 'delete'
  clientRef: string
  tripId: string
  title: string | null
  userStatus: ReadinessUserStatus | null
  countryCode: string | null
  tripItemId: string | null
  travellerClientRef: string | null
  boundEpoch: string | null
  recheck: boolean
  phase: PersonalPhase
  dispatchLieferung: number
  responseLieferung: number | null
  continuationUsed: boolean
  meldung: string | null
  composerGeneration: number
  editorGeneration: number
  filterBeiAktion: PersonalFilter
  bereitsPassend: boolean
  fokussieren: boolean
  /** Angenommen heißt, die Schreibantwort kam zurück. Unklar heißt, sie blieb aus. */
  ursache: 'offen' | 'angenommen' | 'unklar'
  beobachtetBei: number
  fokusBei: number
}

export type PersonalLedger = {
  tripId: string
  barrier: boolean
  lieferung: number
  intents: PersonalIntent[]
  locks: string[]
  composerGeneration: number
  composerLock: boolean
  composerRef: string | null
  naechsteId: number
  hinweis: string | null
  editorStand: Record<string, number>
  titelLeerenFuer: string | null
  fokusIntentId: string | null
  draft: string
  fokusGeneration: number
  /** Jüngerer Stand verdrängt keinen neueren Schreibversuch. */
  revision: number
  /** Gleiche Kennung bleibt gesperrt, bis eine spätere Lesung gelesen gesetzt hat. */
  lesePflicht: Record<string, { seit: number; gelesen: number | null }>
}

export type PersonalAuftrag = {
  intentId: string
  lauf: number
  tripId: string
  art: 'set' | 'delete'
  clientRef: string
  payload: PersonalEingabe | null
}

export type PersonalDispatch =
  | { art: 'create'; title: string; filter: PersonalFilter }
  | {
      art: 'edit'
      clientRef: string
      title: string
      userStatus: ReadinessUserStatus
      boundEpoch: string
      editorGeneration: number
      filter: PersonalFilter
    }
  | { art: 'delete'; clientRef: string; filter: PersonalFilter; editorGeneration: number }
  | { art: 'retry'; intentId: string }
  | { art: 'discard'; intentId: string }

type Ziel = Pick<TripReadinessItem, 'kind' | 'countryCode' | 'tripItemId' | 'title' | 'travellerClientRef'>

export function preparationEpoch(reise: Trip, item: Ziel): string {
  const kontext = readinessReisekontext(reise)
  const punkt = punktFuerReadiness(reise, item.tripItemId)
  return readinessFingerprint({
    kind: item.kind,
    countryCode: item.countryCode,
    startDate: kontext.startDate,
    endDate: kontext.endDate,
    travellers: kontext.travellers,
    destinationCountries: kontext.destinationCountries,
    rentalCarPresent: kontext.rentalCarPresent,
    tripItemId: punkt?.id ?? item.tripItemId,
    itemKind: punkt?.kind ?? null,
    bookingStatus: punkt?.bookingStatus ?? null,
    startsOn: punkt?.startsOn ?? null,
    endsOn: punkt?.endsOn ?? null,
    originPlaceId: punkt?.originPlaceId ?? null,
    destinationPlaceId: punkt?.destinationPlaceId ?? null,
    title: item.title,
    ...routeFingerprintFelder(reise),
    ...travellerFingerprintFelderFuer(reise, item.travellerClientRef),
  })
}

export function persoenlicheEingabe(title: string, clientRef: string): PersonalEingabe {
  return {
    clientRef,
    kind: 'preparation',
    userStatus: 'open',
    countryCode: null,
    tripItemId: null,
    title,
  }
}

export function leerLedger(tripId: string): PersonalLedger {
  return {
    tripId,
    barrier: false,
    lieferung: 0,
    intents: [],
    locks: [],
    composerGeneration: 1,
    composerLock: false,
    composerRef: null,
    naechsteId: 1,
    hinweis: null,
    editorStand: {},
    titelLeerenFuer: null,
    fokusIntentId: null,
    draft: '',
    fokusGeneration: 0,
    revision: 0,
    lesePflicht: {},
  }
}

export function interaktion(ledger: PersonalLedger): PersonalLedger {
  return { ...ledger, fokusGeneration: ledger.fokusGeneration + 1, fokusIntentId: null }
}

function filterPasst(
  item: { currentness: ReadinessCurrentness; userStatus: ReadinessUserStatus },
  filter: PersonalFilter,
): boolean {
  if (filter === 'alle') return true
  if (filter === 'offen') return item.currentness === 'current' && item.userStatus === 'open'
  if (filter === 'erneut') return item.currentness === 'stale'
  if (filter === 'erledigt') return item.currentness === 'current' && item.userStatus === 'done'
  return item.currentness === 'current' && item.userStatus === 'skipped'
}

function suchePasst(title: string | null, suche: string): boolean {
  const nadel = suche.trim().toLowerCase()
  if (!nadel) return true
  return (title ?? '').toLowerCase().includes(nadel)
}

const OFFEN: ReadonlySet<PersonalPhase> = new Set(['pending', 'awaiting', 'blocked'])

export function zeileSichtbar(
  item: { clientRef: string; title: string | null; currentness: ReadinessCurrentness; userStatus: ReadinessUserStatus },
  filter: PersonalFilter,
  suche: string,
  intents: readonly Pick<PersonalIntent, 'clientRef' | 'phase' | 'filterBeiAktion' | 'title'>[],
): boolean {
  const schwebend = intents.find((intent) => intent.clientRef === item.clientRef && OFFEN.has(intent.phase))
  if (schwebend && (filter === 'alle' || filter === schwebend.filterBeiAktion)) return true
  return filterPasst(item, filter) && suchePasst(item.title, suche)
}

export function entfernenFrage(title: string, doppelt: boolean, statusText: string): string {
  const frage = `Diesen Punkt entfernen: ${title}?`
  return doppelt ? `${frage} ${statusText}` : frage
}

export function draftSetzen(ledger: PersonalLedger, draft: string): PersonalLedger {
  const mit = ledger.draft === draft ? ledger : { ...ledger, draft }
  return entwurfGeaendert(mit)
}

export function entwurfGeaendert(ledger: PersonalLedger): PersonalLedger {
  if (!ledger.composerLock) return ledger
  return {
    ...ledger,
    composerLock: false,
    composerRef: null,
    composerGeneration: ledger.composerGeneration + 1,
  }
}

export function editorBewegt(ledger: PersonalLedger, clientRef: string, generation: number): PersonalLedger {
  return { ...ledger, editorStand: { ...ledger.editorStand, [clientRef]: generation } }
}

function persoenlich(reise: Trip): TripReadinessItem[] {
  return readinessItemsVon(reise).filter((item) => item.kind === 'preparation')
}

function sicht(reise: Trip, clientRef: string) {
  return readinessAnsicht(reise).items.find((item) => item.clientRef === clientRef && item.kind === 'preparation') ?? null
}

function ersetzen(ledger: PersonalLedger, intent: PersonalIntent): PersonalLedger {
  return { ...ledger, intents: ledger.intents.map((eintrag) => (eintrag.id === intent.id ? intent : eintrag)) }
}

function gesperrt(ledger: PersonalLedger): { ledger: PersonalLedger; auftrag: null } {
  return { ledger: { ...ledger, hinweis: PERSONAL_BARRIERE }, auftrag: null }
}

function leseblock(ledger: PersonalLedger, clientRef: string): { ledger: PersonalLedger; auftrag: null } | null {
  const pflicht = ledger.lesePflicht[clientRef]
  if (!pflicht || pflicht.gelesen != null) return null
  return { ledger: { ...ledger, hinweis: PERSONAL_ERST_LESEN }, auftrag: null }
}

function nachLesen(ledger: PersonalLedger, clientRef: string): { ledger: PersonalLedger; unsicher: boolean } {
  const pflicht = ledger.lesePflicht[clientRef]
  if (!pflicht || pflicht.gelesen == null) return { ledger, unsicher: false }
  const lesePflicht = { ...ledger.lesePflicht }
  delete lesePflicht[clientRef]
  return { ledger: { ...ledger, lesePflicht, hinweis: PERSONAL_UNSICHER }, unsicher: true }
}

function titelGleich(beobachtet: string | null, gesendet: string | null): boolean {
  return (beobachtet ?? '') === (gesendet ?? '').trim()
}

function passtSchon(reise: Trip | null, intent: Pick<PersonalIntent, 'art' | 'clientRef' | 'title' | 'userStatus' | 'countryCode' | 'tripItemId' | 'travellerClientRef' | 'recheck'>): boolean {
  if (!reise) return false
  const item = sicht(reise, intent.clientRef)
  if (intent.art === 'delete') return !item
  if (!item || !intent.userStatus) return false
  return (
    titelGleich(item.title, intent.title) &&
    item.userStatus === intent.userStatus &&
    item.countryCode === intent.countryCode &&
    item.tripItemId === intent.tripItemId &&
    (item.travellerClientRef ?? null) === intent.travellerClientRef &&
    (!intent.recheck || item.currentness === 'current')
  )
}

function anlegen(
  ledger: PersonalLedger,
  felder: Omit<PersonalIntent, 'id' | 'lauf' | 'dispatchLieferung' | 'responseLieferung' | 'continuationUsed' | 'meldung' | 'fokussieren' | 'bereitsPassend' | 'ursache' | 'beobachtetBei' | 'fokusBei'> & {
    bereitsPassend?: boolean
    meldung?: string | null
  },
): { ledger: PersonalLedger; intent: PersonalIntent } {
  const intent: PersonalIntent = {
    ...felder,
    id: `personal-${ledger.naechsteId}`,
    lauf: 1,
    dispatchLieferung: ledger.lieferung,
    responseLieferung: null,
    continuationUsed: false,
    meldung: felder.meldung ?? null,
    fokussieren: false,
    bereitsPassend: felder.bereitsPassend ?? false,
    ursache: 'offen',
    beobachtetBei: ledger.lieferung,
    fokusBei: ledger.fokusGeneration,
  }
  return {
    intent,
    ledger: {
      ...ledger,
      naechsteId: ledger.naechsteId + 1,
      locks: [...ledger.locks, intent.clientRef],
      intents: [...ledger.intents, intent],
      fokusIntentId: null,
    },
  }
}

function auftragFuer(intent: PersonalIntent): PersonalAuftrag {
  return {
    intentId: intent.id,
    lauf: intent.lauf,
    tripId: intent.tripId,
    art: intent.art === 'delete' ? 'delete' : 'set',
    clientRef: intent.clientRef,
    payload:
      intent.art === 'delete'
        ? null
        : {
            clientRef: intent.clientRef,
            kind: 'preparation',
            userStatus: intent.userStatus ?? 'open',
            countryCode: intent.countryCode,
            tripItemId: intent.tripItemId,
            title: intent.title,
          },
  }
}

export function entscheiden(
  ledger: PersonalLedger,
  dispatch: PersonalDispatch,
  kontext: Trip,
  kanonisch: Trip | null,
): { ledger: PersonalLedger; auftrag: PersonalAuftrag | null } {
  if (dispatch.art === 'discard') {
    const intent = ledger.intents.find((eintrag) => eintrag.id === dispatch.intentId)
    if (!intent) return { ledger, auftrag: null }
    const composer = ledger.composerRef === intent.clientRef ? { composerLock: false, composerRef: null as string | null } : {}
    return {
      ledger: {
        ...ledger,
        ...composer,
        locks: ledger.locks.filter((ref) => ref !== intent.clientRef),
        intents: ledger.intents.filter((eintrag) => eintrag.id !== intent.id),
        hinweis: ledger.barrier ? ledger.hinweis : PERSONAL_VERWORFEN,
        fokusIntentId: ledger.fokusIntentId === intent.id ? null : ledger.fokusIntentId,
      },
      auftrag: null,
    }
  }

  if (ledger.barrier) return gesperrt(ledger)

  if (dispatch.art === 'retry') {
    const intent = ledger.intents.find((eintrag) => eintrag.id === dispatch.intentId)
    if (!intent) return { ledger, auftrag: null }
    if (intent.phase === 'pending' || intent.phase === 'awaiting' || intent.phase === 'confirmed') {
      return { ledger, auftrag: null }
    }
    if (ledger.locks.includes(intent.clientRef)) return { ledger, auftrag: null }
    const block = leseblock(ledger, intent.clientRef)
    if (block) return block
    if (intent.art !== 'create') {
      const ziel = persoenlich(kontext).find((item) => item.clientRef === intent.clientRef)
      if (!ziel) return { ledger: { ...ledger, hinweis: PERSONAL_ZIEL_WEG }, auftrag: null }
      const epoch = preparationEpoch(kontext, ziel)
      if ((intent.userStatus === 'done' || intent.userStatus === 'skipped') && intent.boundEpoch !== epoch) {
        return { ledger: { ...ledger, hinweis: PERSONAL_KONTEXT }, auftrag: null }
      }
    }
    const gelesen = nachLesen(ledger, intent.clientRef)
    const neu: PersonalIntent = {
      ...intent,
      lauf: intent.lauf + 1,
      phase: 'pending',
      responseLieferung: null,
      continuationUsed: false,
      meldung: gelesen.unsicher ? PERSONAL_UNSICHER : null,
      fokussieren: false,
      dispatchLieferung: gelesen.ledger.lieferung,
      beobachtetBei: gelesen.ledger.lieferung,
      fokusBei: gelesen.ledger.fokusGeneration,
      ursache: 'offen',
      bereitsPassend: passtSchon(kanonisch, intent),
    }
    return {
      ledger: ersetzen({ ...gelesen.ledger, locks: [...gelesen.ledger.locks, neu.clientRef], fokusIntentId: null }, neu),
      auftrag: auftragFuer(neu),
    }
  }

  if (dispatch.art === 'create') {
    if (ledger.composerLock) return { ledger, auftrag: null }
    const clientRef = readinessClientRefErzeugen('preparation')
    const roh = anlegen(ledger, {
      art: 'create',
      clientRef,
      tripId: ledger.tripId,
      title: dispatch.title,
      userStatus: 'open',
      countryCode: null,
      tripItemId: null,
      travellerClientRef: null,
      boundEpoch: null,
      recheck: false,
      phase: 'pending',
      composerGeneration: ledger.composerGeneration,
      editorGeneration: 0,
      filterBeiAktion: dispatch.filter,
    })
    const intent = { ...roh.intent, bereitsPassend: passtSchon(kanonisch, roh.intent) }
    return {
      ledger: {
        ...ersetzen(roh.ledger, intent),
        composerLock: true,
        composerRef: clientRef,
        hinweis: null,
      },
      auftrag: auftragFuer(intent),
    }
  }

  const ziel = persoenlich(kontext).find((item) => item.clientRef === dispatch.clientRef)
  if (!ziel) return { ledger: { ...ledger, hinweis: PERSONAL_ZIEL_WEG }, auftrag: null }
  if (ledger.locks.includes(ziel.clientRef)) return { ledger, auftrag: null }
  const epoch = preparationEpoch(kontext, ziel)
  if (dispatch.art === 'edit' && (dispatch.userStatus === 'done' || dispatch.userStatus === 'skipped') && dispatch.boundEpoch !== epoch) {
    return { ledger: { ...ledger, hinweis: PERSONAL_KONTEXT }, auftrag: null }
  }
  const block = leseblock(ledger, ziel.clientRef)
  if (block) return block
  const gelesen = nachLesen(ledger, ziel.clientRef)
  const ansicht = sicht(kontext, ziel.clientRef)
  const status = dispatch.art === 'delete' ? null : dispatch.userStatus
  const title = dispatch.art === 'delete' ? ziel.title : dispatch.title
  const roh = anlegen(gelesen.ledger, {
    meldung: gelesen.unsicher ? PERSONAL_UNSICHER : null,
    art: dispatch.art === 'delete' ? 'delete' : 'edit',
    clientRef: ziel.clientRef,
    tripId: ledger.tripId,
    title,
    userStatus: status,
    countryCode: ziel.countryCode,
    tripItemId: ziel.tripItemId,
    travellerClientRef: ziel.travellerClientRef ?? null,
    boundEpoch: dispatch.art === 'edit' ? dispatch.boundEpoch : epoch,
    recheck: ansicht?.currentness === 'stale',
    phase: 'pending',
    composerGeneration: ledger.composerGeneration,
    editorGeneration: dispatch.editorGeneration,
    filterBeiAktion: dispatch.filter,
  })
  const intent = { ...roh.intent, bereitsPassend: passtSchon(kanonisch, roh.intent) }
  return {
    ledger: ersetzen({ ...roh.ledger, hinweis: gelesen.unsicher ? PERSONAL_UNSICHER : null }, intent),
    auftrag: auftragFuer(intent),
  }
}

export function scheitern(
  ledger: PersonalLedger,
  intentId: string,
  lauf: number,
  meldung: string,
  phase: 'error' | 'unclear',
): PersonalLedger {
  const intent = ledger.intents.find((eintrag) => eintrag.id === intentId)
  if (!intent || intent.lauf !== lauf || intent.phase !== 'pending') return ledger
  const unklar = phase === 'unclear'
  return ersetzen(
    {
      ...ledger,
      locks: ledger.locks.filter((ref) => ref !== intent.clientRef),
      hinweis: unklar && !ledger.barrier ? PERSONAL_ERST_LESEN : ledger.hinweis,
      lesePflicht: unklar
        ? { ...ledger.lesePflicht, [intent.clientRef]: { seit: ledger.lieferung, gelesen: null } }
        : ledger.lesePflicht,
    },
    {
      ...intent,
      phase,
      meldung,
      fokussieren: false,
      ursache: unklar ? 'unklar' : intent.ursache,
      beobachtetBei: ledger.lieferung,
    },
  )
}

export function annehmen(
  ledger: PersonalLedger,
  intentId: string,
  lauf: number,
): { ledger: PersonalLedger; lesen: boolean } {
  const intent = ledger.intents.find((eintrag) => eintrag.id === intentId)
  if (!intent || intent.lauf !== lauf || intent.phase !== 'pending') return { ledger, lesen: false }
  const lesen = !intent.continuationUsed
  const neu: PersonalIntent = {
    ...intent,
    phase: 'awaiting',
    responseLieferung: ledger.lieferung,
    continuationUsed: lesen ? true : intent.continuationUsed,
    meldung: PERSONAL_AUSSTEHEND,
    ursache: 'angenommen',
    beobachtetBei: ledger.lieferung,
  }
  return { ledger: ersetzen(ledger, neu), lesen }
}

function terminal(ledger: PersonalLedger, intent: PersonalIntent, phase: PersonalPhase, meldung: string): PersonalLedger {
  const neuerEntwurf = intent.art === 'create' && ledger.composerGeneration !== intent.composerGeneration
  const editorFremd = intent.art !== 'create' && ledger.editorStand[intent.clientRef] !== undefined && ledger.editorStand[intent.clientRef] !== intent.editorGeneration
  const fokusAktuell = ledger.fokusGeneration === intent.fokusBei
  const fokussieren = fokusAktuell && !neuerEntwurf && !editorFremd && (phase === 'confirmed' || phase === 'reconciled') && intent.art !== 'delete'
  const titelLeeren =
    intent.art === 'create' &&
    phase === 'confirmed' &&
    !neuerEntwurf &&
    ledger.composerRef === intent.clientRef
  return ersetzen(
    {
      ...ledger,
      locks: ledger.locks.filter((ref) => ref !== intent.clientRef),
      composerLock: titelLeeren ? false : ledger.composerLock,
      composerRef: titelLeeren ? null : ledger.composerRef,
      titelLeerenFuer: titelLeeren ? intent.id : ledger.titelLeerenFuer,
      fokusIntentId: fokussieren ? intent.id : ledger.fokusIntentId,
      draft: titelLeeren ? '' : ledger.draft,
    },
    { ...intent, phase, meldung, fokussieren, beobachtetBei: ledger.lieferung },
  )
}

const WEITER_LESBAR: ReadonlySet<PersonalPhase> = new Set([
  'awaiting',
  'absent_uncertain',
  'conflict',
  'stale_unconfirmed',
  'unclear',
  'blocked',
])

function pflichtAktualisieren(ledger: PersonalLedger): PersonalLedger {
  let anders = false
  const lesePflicht = { ...ledger.lesePflicht }
  for (const [ref, eintrag] of Object.entries(lesePflicht)) {
    if (eintrag.gelesen == null && ledger.lieferung > eintrag.seit) {
      lesePflicht[ref] = { ...eintrag, gelesen: ledger.lieferung }
      anders = true
    }
  }
  return anders ? { ...ledger, lesePflicht } : ledger
}

function klassifizieren(ledger: PersonalLedger, intent: PersonalIntent, reise: Trip): PersonalLedger {
  const item = sicht(reise, intent.clientRef)
  const unklar = intent.ursache === 'unklar'
  if (intent.art === 'delete') {
    if (!item) {
      if (unklar) return terminal(ledger, intent, 'reconciled', PERSONAL_ABGESTIMMT)
      return terminal(
        ledger,
        intent,
        intent.bereitsPassend ? 'reconciled' : 'confirmed',
        intent.bereitsPassend ? PERSONAL_ABGESTIMMT : 'Der Punkt ist im gelesenen Stand nicht mehr vorhanden.',
      )
    }
    return terminal(ledger, intent, 'conflict', PERSONAL_UNSICHER)
  }
  if (!item || intent.userStatus == null) return terminal(ledger, intent, 'absent_uncertain', PERSONAL_UNSICHER)
  const gleich =
    titelGleich(item.title, intent.title) &&
    item.userStatus === intent.userStatus &&
    item.countryCode === intent.countryCode &&
    item.tripItemId === intent.tripItemId &&
    (item.travellerClientRef ?? null) === intent.travellerClientRef
  if (!gleich) return terminal(ledger, intent, 'conflict', PERSONAL_UNSICHER)
  if (intent.recheck && item.currentness !== 'current') return terminal(ledger, intent, 'stale_unconfirmed', PERSONAL_VERALTET)
  if (unklar || intent.bereitsPassend) return terminal(ledger, intent, 'reconciled', PERSONAL_ABGESTIMMT)
  return terminal(ledger, intent, 'confirmed', PERSONAL_BESTAETIGT)
}

function offeneLesen(ledger: PersonalLedger, reise: Trip): PersonalLedger {
  let next = ledger
  for (const intent of next.intents) {
    if (!WEITER_LESBAR.has(intent.phase)) continue
    if (next.lieferung <= intent.beobachtetBei) continue
    next = klassifizieren(next, intent, reise)
  }
  return next
}

export function gastErgebnis(
  ledger: PersonalLedger,
  intentId: string,
  lauf: number,
  lesung: ReadinessAktualisierung,
  tripId: string,
): PersonalLedger {
  const intent = ledger.intents.find((eintrag) => eintrag.id === intentId)
  if (!intent || intent.lauf !== lauf) return ledger
  if (intent.phase !== 'awaiting' && intent.phase !== 'blocked') return ledger
  if (lesung.art === 'success' && lesung.reise.id === tripId) {
    const basis = pflichtAktualisieren({ ...ledger, lieferung: ledger.lieferung + 1, barrier: false, hinweis: null })
    return offeneLesen(basis, lesung.reise)
  }
  if (lesung.art === 'props') return ledger
  return ersetzen(
    { ...ledger, barrier: true, hinweis: PERSONAL_BARRIERE, locks: ledger.locks.filter((ref) => ref !== intent.clientRef) },
    { ...intent, phase: 'blocked', meldung: PERSONAL_BARRIERE, fokussieren: false },
  )
}

export function kontoBeobachten(ledger: PersonalLedger, reise: Trip): PersonalLedger {
  if (reise.id !== ledger.tripId) return ledger
  const next = pflichtAktualisieren({ ...ledger, lieferung: ledger.lieferung + 1 })
  return offeneLesen(next, reise)
}

export function manuellLesen(ledger: PersonalLedger, lesung: ReadinessAktualisierung, tripId: string): PersonalLedger {
  if (lesung.art === 'props') return ledger
  if (lesung.art === 'success' && lesung.reise.id === tripId) {
    const next = pflichtAktualisieren({ ...ledger, lieferung: ledger.lieferung + 1, barrier: false, hinweis: null })
    return offeneLesen(next, lesung.reise)
  }
  return { ...ledger, barrier: true, hinweis: PERSONAL_BARRIERE }
}
