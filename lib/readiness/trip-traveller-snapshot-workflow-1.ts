// lib/readiness/trip-traveller-snapshot-workflow-1.ts
//
// Reine Entwurf-, Prüf- und Intentregeln für den Reise-Snapshot eines Travellers.
// Kein React, kein Router, kein Schreibzugriff. Der eingefrorene Leser bleibt unverändert.

import { neueDokumentClientRef } from '@/lib/readiness/dokument-formular'
import { TRAVELLER_CONTEXT_GRENZEN, landescodeLesen } from '@/lib/readiness/domain'
import type { TravellerDocumentType, TripTraveller } from '@/types/trips'

export const SATZ_DUPLIKAT_LAND = 'Dieselbe Staatsbürgerschaft kann nur einmal erfasst werden.'
export const SATZ_BEZIEHUNG = 'Das Dokument muss zu einer Staatsbürgerschaft derselben Person gehören.'
export const SATZ_NICHT_GESENDET = 'Diese Angaben können so nicht gespeichert werden.'

export type ZeilenHerkunft = 'loaded' | 'created'

export type CitizenshipDraft = {
  clientRef: string
  countryCode: string
  origin: ZeilenHerkunft
  touched: boolean
}

export type DocumentDraft = {
  clientRef: string
  documentType: TravellerDocumentType | ''
  issuingCountryCode: string
  expiresOn: string
  citizenshipClientRef: string | null
  origin: ZeilenHerkunft
  touched: boolean
}

export type TravellerDraft = {
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: CitizenshipDraft[]
  documents: DocumentDraft[]
  generation: number
  dirty: boolean
  conflict: boolean
  membership: 'present' | 'absent'
  hadPresent: boolean
  reentry: boolean
  baselineFingerprint: string
}

export type TravellerPayload = {
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: Array<{ clientRef: string; countryCode: string }>
  documents: Array<{
    clientRef: string
    documentType: TravellerDocumentType
    issuingCountryCode: string | null
    expiresOn: string | null
    citizenshipClientRef: string | null
  }>
}

export type Serialisiert =
  | { art: 'ok'; payload: TravellerPayload }
  | { art: 'not_sent'; satz: string }

export type Belegung = {
  tripId: string
  target: string
  generation: number
}

export type GastBasis<T extends { id: string }> = {
  unresolved: boolean
  base: T | null
}

type Zufall = () => string

function clientRefBild(wert: unknown, fallback: string): string {
  if (typeof wert === 'string') {
    const ref = wert.trim().slice(0, 64)
    if (ref.length > 0) return ref
  }
  return fallback.slice(0, 64)
}

function exakterRef(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length >= 1 && wert.length <= 64 && wert === wert.trim()
}

function exaktesLand(wert: string): string | null {
  if (wert !== wert.trim() || wert !== wert.toUpperCase()) return null
  const gelesen = landescodeLesen(wert)
  return gelesen === wert ? gelesen : null
}

function unberuehrteStaatsbuergerschaft(zeile: CitizenshipDraft): boolean {
  return zeile.origin === 'created' && !zeile.touched && zeile.countryCode === ''
}

function unberuehrtesDokument(zeile: DocumentDraft): boolean {
  return (
    zeile.origin === 'created' &&
    !zeile.touched &&
    zeile.documentType === '' &&
    zeile.issuingCountryCode === '' &&
    zeile.expiresOn === '' &&
    zeile.citizenshipClientRef === null
  )
}

function nichtGesendet(satz = SATZ_NICHT_GESENDET): Serialisiert {
  return { art: 'not_sent', satz }
}

function kollidiert(paare: ReadonlyArray<{ geliefert: string; bild: string }>): boolean {
  const nachBild = new Map<string, Set<string>>()
  for (const paar of paare) {
    const menge = nachBild.get(paar.bild) ?? new Set<string>()
    menge.add(paar.geliefert)
    nachBild.set(paar.bild, menge)
  }
  for (const menge of nachBild.values()) {
    if (menge.size > 1) return true
  }
  return false
}

export function neueCitizenshipClientRef(zufall: Zufall = () => globalThis.crypto.randomUUID()): string {
  return `citizenship:${zufall()}`.slice(0, 64)
}

function leeresDokument(zufall?: Zufall): DocumentDraft {
  return {
    clientRef: neueDokumentClientRef(zufall),
    documentType: '',
    issuingCountryCode: '',
    expiresOn: '',
    citizenshipClientRef: null,
    origin: 'created',
    touched: false,
  }
}

export function fingerprintFelder(eingabe: {
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: ReadonlyArray<{ clientRef: string; countryCode: string }>
  documents: ReadonlyArray<{
    clientRef: string
    documentType: string
    issuingCountryCode: string | null
    expiresOn: string | null
    citizenshipClientRef: string | null
  }>
}): string {
  const citizenships = [...eingabe.citizenships]
    .map((zeile) => ({ clientRef: zeile.clientRef, countryCode: zeile.countryCode }))
    .sort((a, b) => a.clientRef.localeCompare(b.clientRef))
  const documents = [...eingabe.documents]
    .map((zeile) => ({
      clientRef: zeile.clientRef,
      documentType: zeile.documentType,
      issuingCountryCode: zeile.issuingCountryCode,
      expiresOn: zeile.expiresOn,
      citizenshipClientRef: zeile.citizenshipClientRef,
    }))
    .sort((a, b) => a.clientRef.localeCompare(b.clientRef))
  return JSON.stringify({
    clientRef: eingabe.clientRef,
    label: eingabe.label,
    residenceCountryCode: eingabe.residenceCountryCode,
    citizenships,
    documents,
  })
}

export function fingerprintTraveller(traveller: TripTraveller): string {
  return fingerprintFelder({
    clientRef: traveller.clientRef,
    label: traveller.label,
    residenceCountryCode: traveller.residenceCountryCode,
    citizenships: traveller.citizenships,
    documents: traveller.documents,
  })
}

export function entwurfAusVorhanden(traveller: TripTraveller, zufall?: Zufall): TravellerDraft {
  return {
    clientRef: traveller.clientRef,
    label: traveller.label,
    residenceCountryCode: traveller.residenceCountryCode,
    citizenships: traveller.citizenships.map((zeile) => ({
      clientRef: zeile.clientRef,
      countryCode: zeile.countryCode,
      origin: 'loaded',
      touched: false,
    })),
    documents: traveller.documents.length
      ? traveller.documents.map((zeile) => ({
          clientRef: zeile.clientRef,
          documentType: zeile.documentType,
          issuingCountryCode: zeile.issuingCountryCode ?? '',
          expiresOn: zeile.expiresOn ?? '',
          citizenshipClientRef: zeile.citizenshipClientRef,
          origin: 'loaded' as const,
          touched: false,
        }))
      : [leeresDokument(zufall)],
    generation: 1,
    dirty: false,
    conflict: false,
    membership: 'present',
    hadPresent: true,
    reentry: false,
    baselineFingerprint: fingerprintTraveller(traveller),
  }
}

export function leererEntwurf(clientRef: string, label: string | null, zufall?: Zufall): TravellerDraft {
  return {
    clientRef,
    label,
    residenceCountryCode: null,
    citizenships: [
      {
        clientRef: neueCitizenshipClientRef(zufall),
        countryCode: '',
        origin: 'created',
        touched: false,
      },
    ],
    documents: [leeresDokument(zufall)],
    generation: 1,
    dirty: false,
    conflict: false,
    membership: 'absent',
    hadPresent: false,
    reentry: false,
    baselineFingerprint: '',
  }
}

function geaendert(entwurf: TravellerDraft, teil: Partial<TravellerDraft>): TravellerDraft {
  return {
    ...entwurf,
    ...teil,
    dirty: true,
    generation: entwurf.generation + 1,
  }
}

export function wohnsitzSetzen(entwurf: TravellerDraft, countryCode: string): TravellerDraft {
  return geaendert(entwurf, { residenceCountryCode: countryCode })
}

export function staatsbuergerschaftSetzen(
  entwurf: TravellerDraft,
  clientRef: string,
  countryCode: string,
): TravellerDraft {
  return geaendert(entwurf, {
    citizenships: entwurf.citizenships.map((zeile) =>
      zeile.clientRef === clientRef ? { ...zeile, countryCode, touched: true } : zeile,
    ),
  })
}

export function staatsbuergerschaftHinzufuegen(entwurf: TravellerDraft, zufall?: Zufall): TravellerDraft {
  if (entwurf.citizenships.length >= TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) return entwurf
  return geaendert(entwurf, {
    citizenships: [
      ...entwurf.citizenships,
      {
        clientRef: neueCitizenshipClientRef(zufall),
        countryCode: '',
        origin: 'created',
        touched: false,
      },
    ],
  })
}

export function staatsbuergerschaftEntfernen(entwurf: TravellerDraft, clientRef: string): TravellerDraft {
  return geaendert(entwurf, {
    citizenships: entwurf.citizenships.filter((zeile) => zeile.clientRef !== clientRef),
    documents: entwurf.documents.map((zeile) =>
      zeile.citizenshipClientRef === clientRef
        ? { ...zeile, citizenshipClientRef: null, touched: true }
        : zeile,
    ),
  })
}

export function dokumentSetzen(
  entwurf: TravellerDraft,
  clientRef: string,
  teil: Partial<Pick<DocumentDraft, 'documentType' | 'issuingCountryCode' | 'expiresOn' | 'citizenshipClientRef'>>,
): TravellerDraft {
  return geaendert(entwurf, {
    documents: entwurf.documents.map((zeile) =>
      zeile.clientRef === clientRef ? { ...zeile, ...teil, touched: true } : zeile,
    ),
  })
}

export function dokumentHinzufuegen(entwurf: TravellerDraft, zufall?: Zufall): TravellerDraft {
  if (entwurf.documents.length >= TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) return entwurf
  return geaendert(entwurf, { documents: [...entwurf.documents, leeresDokument(zufall)] })
}

export function dokumentEntfernen(entwurf: TravellerDraft, clientRef: string): TravellerDraft {
  return geaendert(entwurf, {
    documents: entwurf.documents.filter((zeile) => zeile.clientRef !== clientRef),
  })
}

export function serialisieren(entwurf: TravellerDraft): Serialisiert {
  if (!exakterRef(entwurf.clientRef) || clientRefBild(entwurf.clientRef, '') !== entwurf.clientRef) {
    return nichtGesendet()
  }

  for (const zeile of entwurf.citizenships) {
    if (unberuehrteStaatsbuergerschaft(zeile)) continue
    if (!exakterRef(zeile.clientRef)) return nichtGesendet()
  }
  for (const zeile of entwurf.documents) {
    if (unberuehrtesDokument(zeile)) continue
    if (!exakterRef(zeile.clientRef)) return nichtGesendet()
    if (zeile.citizenshipClientRef !== null && !exakterRef(zeile.citizenshipClientRef)) return nichtGesendet()
  }

  const verknuepft = new Set(
    entwurf.documents.flatMap((zeile) => (zeile.citizenshipClientRef ? [zeile.citizenshipClientRef] : [])),
  )
  if (entwurf.citizenships.some((zeile) => unberuehrteStaatsbuergerschaft(zeile) && verknuepft.has(zeile.clientRef))) {
    return nichtGesendet(SATZ_BEZIEHUNG)
  }

  const staatsbuergerschaften = entwurf.citizenships.filter(
    (zeile) => !(unberuehrteStaatsbuergerschaft(zeile) && !verknuepft.has(zeile.clientRef)),
  )
  if (
    kollidiert(
      staatsbuergerschaften.map((zeile) => ({
        geliefert: zeile.clientRef,
        bild: clientRefBild(zeile.clientRef, `citizenship:${zeile.countryCode}`),
      })),
    )
  ) {
    return nichtGesendet()
  }

  const laender = new Set<string>()
  const refs = new Set<string>()
  for (const zeile of staatsbuergerschaften) {
    if (zeile.countryCode === '') return nichtGesendet()
    const land = exaktesLand(zeile.countryCode)
    if (!land) return nichtGesendet()
    if (laender.has(land)) return nichtGesendet(SATZ_DUPLIKAT_LAND)
    if (refs.has(zeile.clientRef)) return nichtGesendet()
    laender.add(land)
    refs.add(zeile.clientRef)
  }
  if (staatsbuergerschaften.length > TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller) return nichtGesendet()

  const dokumente = entwurf.documents.filter((zeile) => !unberuehrtesDokument(zeile))
  if (
    kollidiert(
      dokumente.map((zeile) => ({
        geliefert: zeile.clientRef,
        bild: clientRefBild(zeile.clientRef, `document:${zeile.documentType}:${zeile.issuingCountryCode || 'xx'}`),
      })),
    )
  ) {
    return nichtGesendet()
  }
  const dokumentRefs = new Set<string>()
  const dokumentPayload: TravellerPayload['documents'] = []
  for (const zeile of dokumente) {
    if (zeile.documentType !== 'passport' && zeile.documentType !== 'national_id' && zeile.documentType !== 'unknown') {
      return nichtGesendet()
    }
    if (dokumentRefs.has(zeile.clientRef)) return nichtGesendet()
    dokumentRefs.add(zeile.clientRef)
    let issuing: string | null = null
    if (zeile.issuingCountryCode !== '') {
      const land = exaktesLand(zeile.issuingCountryCode)
      if (!land) return nichtGesendet()
      issuing = land
    }
    let expiresOn: string | null = null
    if (zeile.expiresOn !== '') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(zeile.expiresOn)) return nichtGesendet()
      expiresOn = zeile.expiresOn
    }
    if (zeile.citizenshipClientRef !== null && !refs.has(zeile.citizenshipClientRef)) {
      return nichtGesendet(SATZ_BEZIEHUNG)
    }
    dokumentPayload.push({
      clientRef: zeile.clientRef,
      documentType: zeile.documentType,
      issuingCountryCode: issuing,
      expiresOn,
      citizenshipClientRef: zeile.citizenshipClientRef,
    })
  }
  if (dokumentPayload.length > TRAVELLER_CONTEXT_GRENZEN.documentsJeTraveller) return nichtGesendet()

  let residence: string | null = null
  if (entwurf.residenceCountryCode) {
    const land = exaktesLand(entwurf.residenceCountryCode)
    if (!land) return nichtGesendet()
    residence = land
  }

  return {
    art: 'ok',
    payload: {
      clientRef: entwurf.clientRef,
      label: entwurf.label,
      residenceCountryCode: residence,
      citizenships: staatsbuergerschaften.map((zeile) => ({
        clientRef: zeile.clientRef,
        countryCode: zeile.countryCode,
      })),
      documents: dokumentPayload,
    },
  }
}

export function speichernGesperrt(entwurf: TravellerDraft, pending: boolean): boolean {
  if (pending || entwurf.conflict) return true
  return entwurf.hadPresent && entwurf.membership === 'absent' && !entwurf.reentry
}

export function lieferungAnwenden(
  entwurf: TravellerDraft | null,
  traveller: TripTraveller | null,
  platz: { clientRef: string; label: string | null },
  zufall?: Zufall,
): TravellerDraft {
  if (!traveller) {
    if (!entwurf) return leererEntwurf(platz.clientRef, platz.label, zufall)
    return { ...entwurf, membership: 'absent' }
  }
  const fingerprint = fingerprintTraveller(traveller)
  if (!entwurf) return entwurfAusVorhanden(traveller, zufall)
  if (entwurf.reentry) return { ...entwurf, membership: 'present' }
  if (!entwurf.dirty && !entwurf.conflict && fingerprint !== entwurf.baselineFingerprint) {
    return { ...entwurfAusVorhanden(traveller, zufall), generation: entwurf.generation + 1 }
  }
  if (entwurf.dirty && fingerprint !== entwurf.baselineFingerprint) {
    return { ...entwurf, membership: 'present', conflict: true }
  }
  return { ...entwurf, membership: 'present' }
}

export function neuLaden(entwurf: TravellerDraft, traveller: TripTraveller | null, label: string | null, zufall?: Zufall): TravellerDraft {
  if (!traveller) {
    const leer = leererEntwurf(entwurf.clientRef, label, zufall)
    return {
      ...leer,
      generation: entwurf.generation + 1,
      hadPresent: entwurf.hadPresent,
      membership: 'absent',
      reentry: false,
    }
  }
  return { ...entwurfAusVorhanden(traveller, zufall), generation: entwurf.generation + 1 }
}

export function eingabenBehalten(entwurf: TravellerDraft, traveller: TripTraveller | null): TravellerDraft {
  if (entwurf.hadPresent && entwurf.membership === 'absent' && !entwurf.reentry) return entwurf
  if (!traveller) return entwurf
  return {
    ...entwurf,
    conflict: false,
    membership: 'present',
    baselineFingerprint: fingerprintTraveller(traveller),
  }
}

export function neuErfassen(entwurf: TravellerDraft, label: string | null, zufall?: Zufall): TravellerDraft {
  const leer = leererEntwurf(entwurf.clientRef, label, zufall)
  return {
    ...leer,
    generation: entwurf.generation + 1,
    reentry: true,
    hadPresent: false,
    membership: 'absent',
  }
}

export function readbackUrteil(eingabe: {
  readbackAfterDelivery: number
  submittedFingerprint: string
  intentGeneration: number
  draftGeneration: number
  draftDirty: boolean
  delivery: number
  membership: 'present' | 'absent'
  fingerprint: string | null
}): 'ignored' | 'consistent' | 'differs' | 'stale' {
  if (eingabe.draftGeneration !== eingabe.intentGeneration) return 'stale'
  if (eingabe.delivery <= eingabe.readbackAfterDelivery) return 'ignored'
  if (eingabe.draftDirty) return 'differs'
  if (eingabe.membership === 'present' && eingabe.fingerprint === eingabe.submittedFingerprint) return 'consistent'
  return 'differs'
}

export function belegungAufnehmen(
  belegt: readonly Belegung[],
  seam: 'account' | 'guest',
  tripId: string,
  target: string,
  generation: number,
  guestUnresolved: boolean,
):
  | { art: 'enter'; belegt: Belegung[] }
  | { art: 'not_sent'; grund: 'gleiche-person' | 'andere-person' | 'unaufgeloest' } {
  if (seam === 'guest' && guestUnresolved) return { art: 'not_sent', grund: 'unaufgeloest' }
  if (belegt.some((eintrag) => eintrag.tripId === tripId && eintrag.target === target)) {
    return { art: 'not_sent', grund: 'gleiche-person' }
  }
  if (seam === 'guest' && belegt.some((eintrag) => eintrag.tripId === tripId)) {
    return { art: 'not_sent', grund: 'andere-person' }
  }
  return { art: 'enter', belegt: [...belegt, { tripId, target, generation }] }
}

export function belegungLoesen(belegt: readonly Belegung[], schluessel: Belegung): Belegung[] {
  return belegt.filter(
    (eintrag) =>
      !(
        eintrag.tripId === schluessel.tripId &&
        eintrag.target === schluessel.target &&
        eintrag.generation === schluessel.generation
      ),
  )
}

export function abschlussAktuell(belegt: readonly Belegung[], schluessel: Belegung): boolean {
  return belegt.some(
    (eintrag) =>
      eintrag.tripId === schluessel.tripId &&
      eintrag.target === schluessel.target &&
      eintrag.generation === schluessel.generation,
  )
}

export function ergebnisKlasse(
  writerEntered: boolean,
  result: 'null' | 'string' | 'throw' | 'malformed',
): 'not_sent' | 'unproven' | 'accepted' {
  if (!writerEntered) return 'not_sent'
  if (result === 'null') return 'accepted'
  return 'unproven'
}

export function gastBasisUebernehmen<T extends { id: string }>(
  zustand: GastBasis<T>,
  graph: T,
  tripId: string,
): GastBasis<T> {
  if (zustand.unresolved || graph.id !== tripId) return zustand
  return { unresolved: false, base: graph }
}

export function gastTravellerAbschliessen<T extends { id: string }>(
  zustand: GastBasis<T>,
  ergebnis: 'accepted' | 'unproven',
  geschrieben: T | null,
  tripId: string,
): GastBasis<T> {
  if (ergebnis === 'unproven') return { unresolved: true, base: zustand.base }
  if (geschrieben && geschrieben.id === tripId) return { unresolved: false, base: geschrieben }
  return zustand
}

export function gastExplizitLesen<T extends { id: string }>(
  zustand: GastBasis<T>,
  art: string,
  graph: T | null,
  tripId: string,
): { zustand: GastBasis<T>; rearm: boolean } {
  if (art === 'success' && graph && graph.id === tripId) {
    return { zustand: { unresolved: false, base: graph }, rearm: true }
  }
  return { zustand, rearm: false }
}

export type AufnahmeVersuch = {
  art: 'enter' | 'not_sent'
  writer: 'product' | 'legacy' | null
  calls: number
}

export function legacyAufnahme(writer: ((paar: { tripId: string; registryTravellerId: string }) => Promise<string | null>) | null): {
  invoke: (paar: { tripId: string; registryTravellerId: string }) => Promise<string | null>
  calls: () => number
} {
  let calls = 0
  return {
    calls: () => calls,
    invoke: async (paar) => {
      if (!writer) return 'Diese Übernahme ist nicht verbunden.'
      calls += 1
      return writer(paar)
    },
  }
}
