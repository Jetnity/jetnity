// lib/trips/attention.ts
//
// TW-4 Attention-Layer. Reine Presentation-Aggregation über vorhandene
// maschinenlesbare Ableitungen (ADR-0165). Keine Persistenz, kein LLM-Score,
// kein zweiter Lifecycle.
//
// Die vier Leerstände gelten nur als echte Empty States gegenüber aktiven
// Signalen (Warning, Gap, stale, error, unknown). Degraded Lagen
// (unavailable, insufficient_context, ungeprueft) bleiben als Punkte
// erhalten, auch wenn ein Top-Level-Leerstand gesetzt ist.
// Official-Clean ist fail-closed: jede relevante Traveller-/Credential-
// Option/Destination braucht eine aktuelle Official-Evaluation.

import { landescodeLesen } from '@/lib/readiness/domain'
import { fehlendeFaktenFuerReise, travellerSlots } from '@/lib/readiness/party'
import { readinessAnsicht } from '@/lib/readiness/status'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import { safetyLokalFuerReise } from '@/lib/safety/engine'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { safetyAnsicht } from '@/lib/safety/status'
import { seasonalLokalFuerReise } from '@/lib/seasonal/engine'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { seasonalAnsicht } from '@/lib/seasonal/status'
import { bereichStatus, type Arbeitsbereich, type BereichLage } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripItem } from '@/types/trips'

export type AttentionLeerstand =
  | 'nichts_dringend_geprueft'
  | 'noch_nicht_geprueft'
  | 'noch_nicht_pruefbar'
  | 'pruefung_nicht_verfuegbar'

export type AttentionEbene = 'reise' | 'etappe' | 'tag' | 'item' | 'person'

export type AttentionSchwere = 'blockierend' | 'bald' | 'hinweis'

export type AttentionLage =
  | 'known_gap'
  | 'unknown'
  | 'stale'
  | 'unavailable'
  | 'warning'
  | 'error'
  | 'insufficient_context'
  | 'ungeprueft'

export type AttentionAktion = {
  art: 'bereich'
  bereich: Arbeitsbereich
}

export type AttentionPunkt = {
  id: string
  ebene: AttentionEbene
  signal: string
  schwere: AttentionSchwere
  lage: AttentionLage
  titel: string
  aktion: AttentionAktion | null
}

export type AttentionOrchestrierung = {
  safety: 'angebunden' | 'nicht_ausgefuehrt'
  seasonal: 'angebunden' | 'nicht_ausgefuehrt'
}

export type AttentionAbleitung = {
  leerstand: AttentionLeerstand | null
  orchestrierung: AttentionOrchestrierung
  punkte: AttentionPunkt[]
  sichtbar: AttentionPunkt[]
  weitere: AttentionPunkt[]
}

const ATTENTION_SICHTBAR_LIMIT = 3

const SCHWERE_RANG: Record<AttentionSchwere, number> = {
  blockierend: 0,
  bald: 1,
  hinweis: 2,
}

const SIGNAL_RANG: Record<string, number> = {
  'safety.critical_warning': 0,
  'safety.important_notice': 1,
  'safety.error': 2,
  'coverage.fluege': 3,
  'coverage.unterkunft': 4,
  'readiness.stale': 5,
  'official.insufficient_context': 6,
  'official.ungeprueft': 6,
  'official.stale': 7,
  'official.unavailable': 17,
  'official.unknown': 21,
  'seasonal.timing_check': 8,
  'seasonal.timing_notice': 9,
  'seasonal.error': 10,
  'safety.stale': 11,
  'seasonal.stale': 12,
  'safety.unknown': 13,
  'seasonal.unknown': 14,
  'safety.insufficient_context': 15,
  'seasonal.insufficient_context': 16,
  'safety.unavailable': 17,
  'seasonal.unavailable': 18,
  'safety.ungeprueft': 19,
  'seasonal.ungeprueft': 20,
}

const AKTIVE_LAGEN: ReadonlySet<AttentionLage> = new Set([
  'warning',
  'known_gap',
  'stale',
  'error',
  'unknown',
])

type AttentionEingabe = {
  reise: Trip
  ohneTag?: readonly TripItem[]
  safetyEvaluations?: SafetyEvaluation[]
  seasonalEvaluations?: SeasonalEvaluation[]
  officialEvaluations?: OfficialEvaluation[]
  orchestriereSafety?: boolean
  orchestriereSeasonal?: boolean
  sichtbarLimit?: number
}

type DomainSignal = {
  id: string
  ebene: AttentionEbene
  signal: string
  schwere: AttentionSchwere
  lage: AttentionLage
  titel: string
}

function safetyQuelle(
  reise: Trip,
  evaluations: SafetyEvaluation[] | undefined,
  orchestriere: boolean,
): { liste: SafetyEvaluation[] | undefined; ausgefuehrt: boolean } {
  if (evaluations !== undefined) return { liste: evaluations, ausgefuehrt: true }
  if (orchestriere) return { liste: safetyLokalFuerReise(reise), ausgefuehrt: true }
  return { liste: undefined, ausgefuehrt: false }
}

function seasonalQuelle(
  reise: Trip,
  evaluations: SeasonalEvaluation[] | undefined,
  orchestriere: boolean,
): { liste: SeasonalEvaluation[] | undefined; ausgefuehrt: boolean } {
  if (evaluations !== undefined) return { liste: evaluations, ausgefuehrt: true }
  if (orchestriere) return { liste: seasonalLokalFuerReise(reise), ausgefuehrt: true }
  return { liste: undefined, ausgefuehrt: false }
}

function coverageLage(lage: BereichLage): { schwere: AttentionSchwere; lage: AttentionLage } {
  if (lage === 'unbestimmt') return { schwere: 'bald', lage: 'unknown' }
  return { schwere: 'hinweis', lage: 'known_gap' }
}

function coverageTitel(bereich: 'fluege' | 'unterkunft', lage: BereichLage): string {
  if (bereich === 'fluege') {
    if (lage === 'unbestimmt') return 'Flugabdeckung noch nicht vollständig bestimmbar'
    if (lage === 'teilweise') return 'Flugabdeckung nur teilweise'
    return 'Flugstrecke noch offen'
  }
  if (lage === 'unbestimmt') return 'Unterkunftsabdeckung noch nicht vollständig bestimmbar'
  if (lage === 'teilweise') return 'Unterkunftsnächte nur teilweise abgedeckt'
  return 'Unterkunftsnächte fehlen noch'
}

function punktSortieren(links: AttentionPunkt, rechts: AttentionPunkt): number {
  const schwere = SCHWERE_RANG[links.schwere] - SCHWERE_RANG[rechts.schwere]
  if (schwere !== 0) return schwere
  const signal = (SIGNAL_RANG[links.signal] ?? 50) - (SIGNAL_RANG[rechts.signal] ?? 50)
  if (signal !== 0) return signal
  return links.id.localeCompare(rechts.id)
}

function istAktivesSignal(lage: AttentionLage): boolean {
  return AKTIVE_LAGEN.has(lage)
}

type OfficialSlot = {
  travellerClientRef: string
  credentialOptionRef: string
  destination: string
}

function zieleDerReise(reise: Trip): string[] {
  const ziele = new Set<string>()
  for (const etappe of reise.stages) {
    const code = landescodeLesen(etappe.countryCode ?? null)
    if (code) ziele.add(code)
  }
  return [...ziele].sort()
}

function officialOptionRefs(traveller: NonNullable<ReturnType<typeof travellerSlots>[number]['traveller']>): string[] {
  return credentialOptionsAus(traveller)
    .map((option) => option.optionRef)
    .sort((links, rechts) => links.localeCompare(rechts))
}

function officialPflichtslots(reise: Trip): OfficialSlot[] {
  const ziele = zieleDerReise(reise)
  if (ziele.length === 0) return []
  const slots: OfficialSlot[] = []
  for (const slot of travellerSlots(reise)) {
    if (!slot.applicable || !slot.traveller) continue
    for (const optionRef of officialOptionRefs(slot.traveller)) {
      for (const destination of ziele) {
        slots.push({
          travellerClientRef: slot.traveller.clientRef,
          credentialOptionRef: optionRef,
          destination,
        })
      }
    }
  }
  return slots
}

function officialEvaluationDecktSlot(evaluation: OfficialEvaluation, slot: OfficialSlot): boolean {
  if (evaluation.travellerClientRef !== slot.travellerClientRef) return false
  if (evaluation.destinationCountryCode !== slot.destination) return false
  return evaluation.credentialOptionRef === slot.credentialOptionRef
}

function officialLagenAusEvaluation(evaluation: OfficialEvaluation): AttentionLage[] {
  const lagen = new Set<AttentionLage>()
  if (evaluation.status === 'insufficient_context') lagen.add('insufficient_context')
  if (
    evaluation.status === 'unavailable' ||
    evaluation.freshness === 'provider_unavailable' ||
    evaluation.freshness === 'source_temporarily_unavailable'
  ) {
    lagen.add('unavailable')
  }
  if (evaluation.freshness === 'stale' || evaluation.freshness === 'recheck_needed') lagen.add('stale')
  if (evaluation.freshness === 'never_checked') lagen.add('ungeprueft')
  if (evaluation.status === 'unknown') lagen.add('unknown')
  return [...lagen]
}

function officialLagenFuerSlot(
  slot: OfficialSlot,
  evaluations: readonly OfficialEvaluation[],
): AttentionLage[] {
  const passend = evaluations.filter((evaluation) => officialEvaluationDecktSlot(evaluation, slot))
  if (passend.length === 0) return ['ungeprueft']
  const lagen = new Set<AttentionLage>()
  for (const evaluation of passend) {
    for (const lage of officialLagenAusEvaluation(evaluation)) lagen.add(lage)
  }
  return [...lagen].sort((links, rechts) => links.localeCompare(rechts))
}

function officialPunktFuerSlot(slot: OfficialSlot, lage: AttentionLage): AttentionPunkt {
  const id = `official:${lage}:${slot.travellerClientRef}:${slot.credentialOptionRef}:${slot.destination}`
  const aktion: AttentionAktion = { art: 'bereich', bereich: 'uebersicht' }
  if (lage === 'insufficient_context') {
    return {
      id,
      ebene: 'person',
      signal: 'official.insufficient_context',
      schwere: 'hinweis',
      lage,
      titel: 'Offizielle Prüfung noch nicht möglich',
      aktion,
    }
  }
  if (lage === 'unavailable') {
    return {
      id,
      ebene: 'reise',
      signal: 'official.unavailable',
      schwere: 'hinweis',
      lage,
      titel: 'Offizielle Einreisehinweise sind gerade nicht verfügbar',
      aktion,
    }
  }
  if (lage === 'stale') {
    return {
      id,
      ebene: 'reise',
      signal: 'official.stale',
      schwere: 'bald',
      lage,
      titel: 'Offizielle Anforderungen erneut prüfen',
      aktion,
    }
  }
  if (lage === 'unknown') {
    return {
      id,
      ebene: 'reise',
      signal: 'official.unknown',
      schwere: 'hinweis',
      lage,
      titel: 'Offizielle Einreisehinweise sind unklar',
      aktion,
    }
  }
  return {
    id,
    ebene: 'reise',
    signal: 'official.ungeprueft',
    schwere: 'hinweis',
    lage: 'ungeprueft',
    titel: 'Offizielle Einreisehinweise sind nicht vollständig geprüft',
    aktion,
  }
}

function leerstandOhneAktivePunkte(
  punkte: readonly AttentionPunkt[],
  domainen: readonly AttentionLeerstand[],
): AttentionLeerstand {
  if (punkte.some((punkt) => punkt.lage === 'ungeprueft') || domainen.includes('noch_nicht_geprueft')) {
    return 'noch_nicht_geprueft'
  }
  if (
    punkte.some((punkt) => punkt.lage === 'insufficient_context') ||
    domainen.includes('noch_nicht_pruefbar')
  ) {
    return 'noch_nicht_pruefbar'
  }
  if (punkte.some((punkt) => punkt.lage === 'unavailable') || domainen.includes('pruefung_nicht_verfuegbar')) {
    return 'pruefung_nicht_verfuegbar'
  }
  return 'nichts_dringend_geprueft'
}

function safetySignale(eintrag: SafetyEvaluation): DomainSignal[] {
  if (eintrag.seasonalRejected) return []
  if (
    eintrag.factKey === 'checked_empty' &&
    !eintrag.conflict &&
    eintrag.freshness === 'current' &&
    eintrag.evidenceStatus === 'current' &&
    eintrag.relevance === 'not_affected'
  ) {
    return []
  }

  const signale: DomainSignal[] = []
  const ebene: AttentionEbene = eintrag.affectedRefs[0]?.kind === 'stage' ? 'etappe' : 'reise'

  if (eintrag.conflict || eintrag.factKey === 'partial_invalid') {
    signale.push({
      id: `safety:${eintrag.factId}:error`,
      ebene: 'reise',
      signal: 'safety.error',
      schwere: 'bald',
      lage: 'error',
      titel: 'Sicherheitsprüfung ist fehlgeschlagen',
    })
  }

  if (eintrag.relevance === 'affected' && eintrag.presentationClass === 'critical_warning') {
    signale.push({
      id: `safety:${eintrag.factId}:critical`,
      ebene,
      signal: 'safety.critical_warning',
      schwere: 'blockierend',
      lage: 'warning',
      titel: 'Sicherheitslage braucht Aufmerksamkeit',
    })
  } else if (eintrag.relevance === 'affected' && eintrag.presentationClass === 'important_notice') {
    signale.push({
      id: `safety:${eintrag.factId}:notice`,
      ebene: 'reise',
      signal: 'safety.important_notice',
      schwere: 'bald',
      lage: 'warning',
      titel: 'Wichtiger Sicherheitshinweis',
    })
  }

  if (eintrag.evidenceStatus === 'insufficient_context' || eintrag.relevance === 'insufficient_context') {
    signale.push({
      id: `safety:${eintrag.factId}:insufficient`,
      ebene: 'reise',
      signal: 'safety.insufficient_context',
      schwere: 'hinweis',
      lage: 'insufficient_context',
      titel: 'Sicherheitsprüfung noch nicht möglich',
    })
    return signale
  }

  if (
    eintrag.freshness === 'provider_unavailable' ||
    eintrag.freshness === 'source_temporarily_unavailable' ||
    eintrag.evidenceStatus === 'unavailable'
  ) {
    signale.push({
      id: `safety:${eintrag.factId}:unavailable`,
      ebene: 'reise',
      signal: 'safety.unavailable',
      schwere: 'hinweis',
      lage: 'unavailable',
      titel: 'Sicherheitsprüfung derzeit nicht verfügbar',
    })
    return signale
  }

  if (eintrag.freshness === 'stale' || eintrag.freshness === 'recheck_needed') {
    signale.push({
      id: `safety:${eintrag.factId}:stale`,
      ebene: 'reise',
      signal: 'safety.stale',
      schwere: 'bald',
      lage: 'stale',
      titel: 'Sicherheitsprüfung ist veraltet',
    })
    return signale
  }

  if (eintrag.freshness === 'never_checked') {
    signale.push({
      id: `safety:${eintrag.factId}:ungeprueft`,
      ebene: 'reise',
      signal: 'safety.ungeprueft',
      schwere: 'hinweis',
      lage: 'ungeprueft',
      titel: 'Sicherheit noch nicht geprüft',
    })
    return signale
  }

  if (eintrag.evidenceStatus === 'unknown' || eintrag.relevance === 'unknown') {
    signale.push({
      id: `safety:${eintrag.factId}:unknown`,
      ebene: 'reise',
      signal: 'safety.unknown',
      schwere: 'hinweis',
      lage: 'unknown',
      titel: 'Sicherheitslage ist unklar',
    })
  }

  return signale
}

function seasonalSignale(eintrag: SeasonalEvaluation): DomainSignal[] {
  if (eintrag.acuteRejected) return []
  if (
    eintrag.factKey === 'checked_empty' &&
    !eintrag.conflict &&
    eintrag.freshness === 'current' &&
    eintrag.evidenceStatus === 'current' &&
    eintrag.relevance === 'not_applies'
  ) {
    return []
  }

  const signale: DomainSignal[] = []

  if (eintrag.conflict || eintrag.factKey === 'partial_invalid') {
    signale.push({
      id: `seasonal:${eintrag.factId}:error`,
      ebene: 'reise',
      signal: 'seasonal.error',
      schwere: 'bald',
      lage: 'error',
      titel: 'Reisezeitprüfung ist fehlgeschlagen',
    })
  }

  if (eintrag.relevance === 'applies' && eintrag.presentationClass === 'timing_check') {
    signale.push({
      id: `seasonal:${eintrag.factId}:timing`,
      ebene: 'reise',
      signal: 'seasonal.timing_check',
      schwere: 'bald',
      lage: 'warning',
      titel: 'Reisezeit hat eine erhebliche Wirkung',
    })
  } else if (eintrag.relevance === 'applies' && eintrag.presentationClass === 'timing_notice') {
    signale.push({
      id: `seasonal:${eintrag.factId}:notice`,
      ebene: 'reise',
      signal: 'seasonal.timing_notice',
      schwere: 'hinweis',
      lage: 'warning',
      titel: 'Hinweis zur Reisezeit',
    })
  }

  if (eintrag.evidenceStatus === 'insufficient_context' || eintrag.relevance === 'insufficient_context') {
    signale.push({
      id: `seasonal:${eintrag.factId}:insufficient`,
      ebene: 'reise',
      signal: 'seasonal.insufficient_context',
      schwere: 'hinweis',
      lage: 'insufficient_context',
      titel: 'Reisezeitprüfung noch nicht möglich',
    })
    return signale
  }

  if (
    eintrag.freshness === 'provider_unavailable' ||
    eintrag.freshness === 'source_temporarily_unavailable' ||
    eintrag.evidenceStatus === 'unavailable'
  ) {
    signale.push({
      id: `seasonal:${eintrag.factId}:unavailable`,
      ebene: 'reise',
      signal: 'seasonal.unavailable',
      schwere: 'hinweis',
      lage: 'unavailable',
      titel: 'Reisezeitprüfung derzeit nicht verfügbar',
    })
    return signale
  }

  if (eintrag.freshness === 'stale' || eintrag.freshness === 'recheck_needed') {
    signale.push({
      id: `seasonal:${eintrag.factId}:stale`,
      ebene: 'reise',
      signal: 'seasonal.stale',
      schwere: 'bald',
      lage: 'stale',
      titel: 'Reisezeitprüfung ist veraltet',
    })
    return signale
  }

  if (eintrag.freshness === 'never_checked') {
    signale.push({
      id: `seasonal:${eintrag.factId}:ungeprueft`,
      ebene: 'reise',
      signal: 'seasonal.ungeprueft',
      schwere: 'hinweis',
      lage: 'ungeprueft',
      titel: 'Reisezeit noch nicht geprüft',
    })
    return signale
  }

  if (eintrag.evidenceStatus === 'unknown' || eintrag.relevance === 'unknown') {
    signale.push({
      id: `seasonal:${eintrag.factId}:unknown`,
      ebene: 'reise',
      signal: 'seasonal.unknown',
      schwere: 'hinweis',
      lage: 'unknown',
      titel: 'Reisezeitlage ist unklar',
    })
  }

  return signale
}

function punktVonSignal(signal: DomainSignal, aktion: AttentionAktion | null = null): AttentionPunkt {
  return { ...signal, aktion }
}

export function attentionAbleiten(eingabe: AttentionEingabe): AttentionAbleitung {
  const reise = eingabe.reise
  const ohneTag = eingabe.ohneTag ?? []
  const orchestriereSafety = eingabe.orchestriereSafety !== false
  const orchestriereSeasonal = eingabe.orchestriereSeasonal !== false
  const limit = eingabe.sichtbarLimit ?? ATTENTION_SICHTBAR_LIMIT

  const safety = safetyQuelle(reise, eingabe.safetyEvaluations, orchestriereSafety)
  const seasonal = seasonalQuelle(reise, eingabe.seasonalEvaluations, orchestriereSeasonal)
  const safetySicht = safetyAnsicht(reise, safety.liste)
  const seasonalSicht = seasonalAnsicht(reise, seasonal.liste)
  const readiness = readinessAnsicht(reise, eingabe.officialEvaluations)

  const punkte: AttentionPunkt[] = []
  const domainen: AttentionLeerstand[] = []

  const abdeckungen = bereichStatus(reise, ohneTag)
  for (const eintrag of abdeckungen) {
    if (eintrag.bereich !== 'fluege' && eintrag.bereich !== 'unterkunft') continue
    if (eintrag.lage === 'belegt') continue
    const gewicht = coverageLage(eintrag.lage)
    punkte.push({
      id: `coverage:${eintrag.bereich}`,
      ebene: 'reise',
      signal: `coverage.${eintrag.bereich}`,
      schwere: gewicht.schwere,
      lage: gewicht.lage,
      titel: coverageTitel(eintrag.bereich, eintrag.lage),
      aktion: { art: 'bereich', bereich: eintrag.bereich },
    })
  }

  if (!safety.ausgefuehrt) {
    domainen.push('noch_nicht_geprueft')
    punkte.push(
      punktVonSignal({
        id: 'safety:ungeprueft',
        ebene: 'reise',
        signal: 'safety.ungeprueft',
        schwere: 'hinweis',
        lage: 'ungeprueft',
        titel: 'Sicherheit noch nicht geprüft',
      }),
    )
  } else {
    for (const eintrag of safetySicht.evaluations) {
      for (const signal of safetySignale(eintrag)) {
        punkte.push(punktVonSignal(signal))
      }
    }
  }

  if (!seasonal.ausgefuehrt) {
    domainen.push('noch_nicht_geprueft')
    punkte.push(
      punktVonSignal({
        id: 'seasonal:ungeprueft',
        ebene: 'reise',
        signal: 'seasonal.ungeprueft',
        schwere: 'hinweis',
        lage: 'ungeprueft',
        titel: 'Reisezeit noch nicht geprüft',
      }),
    )
  } else {
    for (const eintrag of seasonalSicht.evaluations) {
      for (const signal of seasonalSignale(eintrag)) {
        punkte.push(punktVonSignal(signal))
      }
    }
  }

  if (readiness.summary.stale > 0) {
    punkte.push({
      id: 'readiness:stale',
      ebene: 'reise',
      signal: 'readiness.stale',
      schwere: 'bald',
      lage: 'stale',
      titel: 'Vorbereitungspunkte erneut prüfen',
      aktion: { art: 'bereich', bereich: 'uebersicht' },
    })
  }

  const fehlendeFakten = fehlendeFaktenFuerReise({ ...reise, stages: reise.stages })
  const officialNichtPruefbar =
    fehlendeFakten.includes('nationality') ||
    fehlendeFakten.includes('destination_country') ||
    fehlendeFakten.includes('travel_dates')

  if (officialNichtPruefbar) {
    domainen.push('noch_nicht_pruefbar')
    punkte.push({
      id: 'official:insufficient_context',
      ebene: 'person',
      signal: 'official.insufficient_context',
      schwere: 'hinweis',
      lage: 'insufficient_context',
      titel: 'Offizielle Prüfung noch nicht möglich',
      aktion: { art: 'bereich', bereich: 'uebersicht' },
    })
  } else {
    const slots = officialPflichtslots(reise)
    if (slots.length === 0) {
      domainen.push('noch_nicht_geprueft')
      punkte.push(
        officialPunktFuerSlot(
          { travellerClientRef: 'traveller:none', credentialOptionRef: 'none', destination: 'none' },
          'ungeprueft',
        ),
      )
    } else {
      for (const slot of slots) {
        for (const lage of officialLagenFuerSlot(slot, readiness.evaluations)) {
          punkte.push(officialPunktFuerSlot(slot, lage))
        }
      }
    }
  }

  const geordnet = [...punkte].sort(punktSortieren)
  const hatAktive = geordnet.some((punkt) => istAktivesSignal(punkt.lage))
  const leerstand = hatAktive ? null : leerstandOhneAktivePunkte(geordnet, domainen)
  return {
    leerstand,
    orchestrierung: {
      safety: safety.ausgefuehrt ? 'angebunden' : 'nicht_ausgefuehrt',
      seasonal: seasonal.ausgefuehrt ? 'angebunden' : 'nicht_ausgefuehrt',
    },
    punkte: geordnet,
    sichtbar: geordnet.slice(0, limit),
    weitere: geordnet.slice(limit),
  }
}
