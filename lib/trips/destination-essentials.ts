// lib/trips/destination-essentials.ts
//
// Presentation-only Destination Essentials. Keine zweite Official-/Safety-/
// Seasonal-Engine, keine persistierte Zielwahrheit, kein visited-Schluss,
// keine Commercial-Suche.

import { landAnzeigeText } from '@/lib/country/darstellung'
import {
  officialActionZweckText,
  officialAnforderungTitel,
  officialFehlendeAngabenText,
  officialFreshnessText,
  OFFICIAL_ERGEBNIS_BEZEICHNUNG,
} from '@/lib/readiness/bezeichnungen'
import {
  officialActionPurposeLesen,
  officialAktionAusQuelle,
  quelleUrlLesen,
  type OfficialEvaluation,
} from '@/lib/readiness/official'
import { officialCredentialLabel, officialZeileErgebnisText } from '@/lib/readiness/official-presentation'
import {
  SAFETY_FRISCHE_TEXT,
  SAFETY_KATEGORIE_TEXT,
  SAFETY_KLASSE_TEXT,
} from '@/lib/safety/anzeige'
import type { SafetyEvaluation, SafetyPresentationClass, SafetyTripRef } from '@/lib/safety/domain'
import { quelleUrlLesen as safetyQuelleUrlLesen } from '@/lib/safety/evidence'
import {
  SEASONAL_FRISCHE_TEXT,
  SEASONAL_KATEGORIE_TEXT,
  SEASONAL_KLASSE_TEXT,
} from '@/lib/seasonal/anzeige'
import type {
  SeasonalEvaluation,
  SeasonalPresentationClass,
  SeasonalTripRef,
} from '@/lib/seasonal/domain'
import { quelleUrlLesen as seasonalQuelleUrlLesen } from '@/lib/seasonal/evidence'
import type { Trip, TripStage, TripTraveller } from '@/types/trips'

export const DESTINATION_ESSENTIALS_TITEL = 'Reiseziele im Blick'
export const DESTINATION_ESSENTIALS_LEERTEXT = 'Noch keine verlässlichen Hinweise verfügbar'
export const DESTINATION_QUELLE_OFFIZIELL_LABEL = 'Offizielle Quelle öffnen'
export const DESTINATION_QUELLE_NEUTRAL_LABEL = 'Quelle öffnen'
export const DESTINATION_OFFICIAL_OPTION_ABHAENGIG_TEXT = 'Je nach Reisedokument unterschiedlich'
export const DESTINATION_OFFICIAL_REISENDE_ABHAENGIG_TEXT = 'Je nach Reisendem unterschiedlich'
export const DESTINATION_OFFICIAL_OPTION_UND_REISENDE_ABHAENGIG_TEXT =
  'Je nach Reisendem und Reisedokument unterschiedlich'

export type DestinationOfficialLage =
  | 'keine_evidence'
  | 'unavailable'
  | 'stale'
  | 'unknown'
  | 'insufficient_context'
  | 'required'
  | 'conditional'
  | 'not_required'
  | 'option_abhaengig'
  | 'reisende_abhaengig'
  | 'option_und_reisende_abhaengig'

export type DestinationSafetyLage =
  | 'keine_evidence'
  | 'unavailable'
  | 'stale'
  | 'unknown'
  | 'critical_warning'
  | 'important_notice'
  | 'information'

export type DestinationSeasonalLage =
  | 'keine_evidence'
  | 'unavailable'
  | 'stale'
  | 'unknown'
  | 'timing_check'
  | 'timing_notice'
  | 'information'

export type DestinationEssentialLinkArt = 'action' | 'source'

export type DestinationEssentialLink = {
  href: string
  label: string
  art: DestinationEssentialLinkArt
}

export type DestinationEssentialDetail = {
  id: string
  titel: string
  text: string
  kontextText: string | null
  dokumentLabel: string | null
}

export type DestinationEssentialBereich<Lage extends string> = {
  lage: Lage
  text: string
  unvollstaendig: boolean
  details: DestinationEssentialDetail[]
  links: DestinationEssentialLink[]
}

export type DestinationEssentialZiel = {
  stageId: string
  position: number
  name: string | null
  countryCode: string | null
  countryLabel: string | null
  placeId: string | null
  latitude: number | null
  longitude: number | null
  arrivalDate: string | null
  departureDate: string | null
  zeitraumText: string | null
  einreise: DestinationEssentialBereich<DestinationOfficialLage>
  sicherheit: DestinationEssentialBereich<DestinationSafetyLage>
  saison: DestinationEssentialBereich<DestinationSeasonalLage>
  hatHinweise: boolean
}

export type DestinationEssentialsAbleitung = {
  titel: string
  ziele: DestinationEssentialZiel[]
  leerText: string
  hatZiele: boolean
  hatHinweise: boolean
  loestSucheAus: false
}

const KURZES_DATUM = new Intl.DateTimeFormat('de-CH', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
})

function etappenSortieren(links: TripStage, rechts: TripStage): number {
  const position = links.position - rechts.position
  if (position !== 0) return position
  return links.id.localeCompare(rechts.id)
}

function nameLesen(wert: string): string | null {
  const name = wert.trim()
  return name.length > 0 ? name : null
}

function alsDatum(wert: string) {
  return new Date(`${wert}T00:00:00Z`)
}

function datumText(wert: string | null): string | null {
  if (!wert) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return null
  const ms = Date.parse(`${wert}T00:00:00.000Z`)
  return Number.isFinite(ms) ? KURZES_DATUM.format(alsDatum(wert)) : null
}

function zeitraumText(arrivalDate: string | null, departureDate: string | null): string | null {
  const ankunft = datumText(arrivalDate)
  const abreise = datumText(departureDate)
  if (ankunft && abreise) return `${ankunft} – ${abreise}`
  if (ankunft) return `Ankunft ${ankunft}`
  if (abreise) return `Abreise ${abreise}`
  return null
}

function landLabel(countryCode: string | null): string | null {
  if (!countryCode) return null
  const text = landAnzeigeText(countryCode).trim()
  return text.length > 0 ? text : null
}

export function destinationIstOfficialZiel(
  evaluation: OfficialEvaluation,
  countryCode: string | null,
): boolean {
  if (!countryCode) return false
  if (evaluation.requirementType === 'transit') return false
  if (evaluation.transitCountryCode != null) return false
  return evaluation.destinationCountryCode === countryCode
}

function betrifftStage(
  refs: readonly (SafetyTripRef | SeasonalTripRef)[],
  stageId: string,
): boolean {
  return refs.some((ref) => ref.kind === 'stage' && ref.id === stageId)
}

export function destinationSafetyBetrifftStage(
  evaluation: SafetyEvaluation,
  stageId: string,
): boolean {
  if (evaluation.seasonalRejected) return false
  return betrifftStage(evaluation.affectedRefs, stageId)
}

export function destinationSeasonalBetrifftStage(
  evaluation: SeasonalEvaluation,
  stageId: string,
): boolean {
  if (evaluation.acuteRejected || evaluation.evidenceClass === 'rejected_acute') return false
  return betrifftStage(evaluation.affectedRefs, stageId)
}

export function destinationOfficialAktion(
  evaluation: OfficialEvaluation,
): DestinationEssentialLink | null {
  const action = evaluation.action
  if (!action || action.kind !== 'open_official_action') return null
  const purpose = officialActionPurposeLesen(action.purpose)
  const href = quelleUrlLesen(action.href)
  if (!purpose || !href) return null
  return {
    href,
    label: officialActionZweckText(purpose),
    art: 'action',
  }
}

export function destinationOfficialQuelle(evaluation: OfficialEvaluation): DestinationEssentialLink | null {
  const href = officialAktionAusQuelle(evaluation.evidence.sourceUrl)?.href ?? null
  if (!href) return null
  return {
    href,
    label: DESTINATION_QUELLE_OFFIZIELL_LABEL,
    art: 'source',
  }
}

export function destinationQuelleLabel(authorityClass: string): string {
  return authorityClass.startsWith('official_')
    ? DESTINATION_QUELLE_OFFIZIELL_LABEL
    : DESTINATION_QUELLE_NEUTRAL_LABEL
}

function linkRang(link: DestinationEssentialLink): number {
  if (link.art === 'action') return 2
  return 1
}

function uniqueLinks(links: readonly DestinationEssentialLink[]): DestinationEssentialLink[] {
  const reihenfolge: string[] = []
  const nachHref = new Map<string, DestinationEssentialLink>()
  for (const link of links) {
    const bisher = nachHref.get(link.href)
    if (!bisher) {
      reihenfolge.push(link.href)
      nachHref.set(link.href, link)
      continue
    }
    if (linkRang(link) > linkRang(bisher)) {
      nachHref.set(link.href, link)
    }
  }
  return reihenfolge.map((href) => nachHref.get(href)!)
}

function officialUngewiss(evaluation: OfficialEvaluation): boolean {
  if (evaluation.status !== 'current') return true
  if (evaluation.freshness !== 'current') return true
  if (evaluation.result === 'unknown') return true
  if (evaluation.missingFacts.length > 0) return true
  return false
}

function officialUnavailable(evaluation: OfficialEvaluation): boolean {
  return (
    evaluation.status === 'unavailable' ||
    evaluation.freshness === 'provider_unavailable' ||
    evaluation.freshness === 'source_temporarily_unavailable'
  )
}

function officialStale(evaluation: OfficialEvaluation): boolean {
  return evaluation.freshness === 'stale' || evaluation.freshness === 'recheck_needed'
}

function offizielleGruppeLage(evaluations: readonly OfficialEvaluation[]): {
  lage: DestinationOfficialLage
  unvollstaendig: boolean
} {
  if (evaluations.length === 0) return { lage: 'keine_evidence', unvollstaendig: false }

  const alleNichtErforderlich = evaluations.every(
    (eintrag) =>
      eintrag.status === 'current' &&
      eintrag.freshness === 'current' &&
      eintrag.result === 'not_required',
  )
  if (alleNichtErforderlich) return { lage: 'not_required', unvollstaendig: false }

  const aktuell = evaluations.filter(
    (eintrag) => eintrag.status === 'current' && eintrag.freshness === 'current' && eintrag.result !== 'unknown',
  )
  const unvollstaendig = evaluations.some(officialUngewiss)

  if (aktuell.some((eintrag) => eintrag.result === 'required')) {
    return { lage: 'required', unvollstaendig }
  }
  if (aktuell.some((eintrag) => eintrag.result === 'conditional')) {
    return { lage: 'conditional', unvollstaendig }
  }
  if (evaluations.some(officialUnavailable)) return { lage: 'unavailable', unvollstaendig: true }
  if (evaluations.some(officialStale)) return { lage: 'stale', unvollstaendig: true }
  if (
    evaluations.some(
      (eintrag) => eintrag.status === 'insufficient_context' || eintrag.missingFacts.length > 0,
    )
  ) {
    return { lage: 'insufficient_context', unvollstaendig: true }
  }
  return { lage: 'unknown', unvollstaendig: true }
}

function officialGruppenSchluessel(evaluation: OfficialEvaluation): {
  travellerKey: string
  credentialKey: string
  groupKey: string
} {
  const travellerKey = evaluation.travellerClientRef?.trim() || '__kein_reisender__'
  const credentialKey = evaluation.credentialOptionRef?.trim() || '__kein_dokument__'
  return {
    travellerKey,
    credentialKey,
    groupKey: `${travellerKey}\u0000${credentialKey}`,
  }
}

function officialLageAus(evaluations: readonly OfficialEvaluation[]): {
  lage: DestinationOfficialLage
  unvollstaendig: boolean
} {
  if (evaluations.length === 0) return { lage: 'keine_evidence', unvollstaendig: false }

  const gruppenMap = new Map<string, OfficialEvaluation[]>()
  const meta = new Map<string, { travellerKey: string; credentialKey: string }>()
  for (const eintrag of evaluations) {
    const { travellerKey, credentialKey, groupKey } = officialGruppenSchluessel(eintrag)
    const bisher = gruppenMap.get(groupKey)
    if (bisher) bisher.push(eintrag)
    else gruppenMap.set(groupKey, [eintrag])
    meta.set(groupKey, { travellerKey, credentialKey })
  }

  const gruppen = [...gruppenMap.entries()].map(([groupKey, eintraege]) => {
    const schluessel = meta.get(groupKey)!
    return {
      ...schluessel,
      ...offizielleGruppeLage(eintraege),
    }
  })
  const unvollstaendig = gruppen.some((gruppe) => gruppe.unvollstaendig)

  if (gruppen.length === 1) {
    return { lage: gruppen[0]!.lage, unvollstaendig: gruppen[0]!.unvollstaendig }
  }

  const uniqueLagen = new Set(gruppen.map((gruppe) => gruppe.lage))
  if (uniqueLagen.size === 1) {
    return { lage: gruppen[0]!.lage, unvollstaendig }
  }

  const lagenJeReisender = new Map<string, Set<DestinationOfficialLage>>()
  for (const gruppe of gruppen) {
    const lagen = lagenJeReisender.get(gruppe.travellerKey) ?? new Set<DestinationOfficialLage>()
    lagen.add(gruppe.lage)
    lagenJeReisender.set(gruppe.travellerKey, lagen)
  }

  const optionenUnterschiedlich = [...lagenJeReisender.values()].some((lagen) => lagen.size > 1)
  const reisendeZusammenfassung = [...lagenJeReisender.values()].map((lagen) =>
    lagen.size === 1 ? [...lagen][0]! : 'gemischt',
  )
  const reisendeUnterschiedlich = new Set(reisendeZusammenfassung).size > 1

  if (optionenUnterschiedlich && reisendeUnterschiedlich) {
    return { lage: 'option_und_reisende_abhaengig', unvollstaendig }
  }
  if (optionenUnterschiedlich) return { lage: 'option_abhaengig', unvollstaendig }
  if (reisendeUnterschiedlich) return { lage: 'reisende_abhaengig', unvollstaendig }
  return { lage: 'option_abhaengig', unvollstaendig }
}

function officialText(lage: DestinationOfficialLage, unvollstaendig: boolean, evaluations: readonly OfficialEvaluation[]): string {
  if (lage === 'keine_evidence') return DESTINATION_ESSENTIALS_LEERTEXT
  if (lage === 'option_abhaengig') return DESTINATION_OFFICIAL_OPTION_ABHAENGIG_TEXT
  if (lage === 'reisende_abhaengig') return DESTINATION_OFFICIAL_REISENDE_ABHAENGIG_TEXT
  if (lage === 'option_und_reisende_abhaengig') return DESTINATION_OFFICIAL_OPTION_UND_REISENDE_ABHAENGIG_TEXT
  if (lage === 'unavailable') {
    if (evaluations.some((eintrag) => eintrag.freshness === 'source_temporarily_unavailable')) {
      return officialFreshnessText('source_temporarily_unavailable')
    }
    return officialFreshnessText('provider_unavailable')
  }
  if (lage === 'stale') return officialFreshnessText('stale')
  if (lage === 'insufficient_context') {
    const facts = [...new Set(evaluations.flatMap((eintrag) => eintrag.missingFacts))].sort((links, rechts) =>
      links.localeCompare(rechts),
    )
    return officialFehlendeAngabenText(facts)
  }
  if (lage === 'unknown') return OFFICIAL_ERGEBNIS_BEZEICHNUNG.unknown
  const kern = OFFICIAL_ERGEBNIS_BEZEICHNUNG[lage]
  return unvollstaendig ? `${kern} · Prüfung unvollständig` : kern
}

function travellerKontext(
  evaluation: OfficialEvaluation,
  party: readonly TripTraveller[],
): string | null {
  const refs = party.filter((eintrag) => eintrag.clientRef === evaluation.travellerClientRef)
  const traveller = refs.length === 1 ? refs[0] : null
  const label = traveller?.label?.trim()
  const person = label && label !== evaluation.travellerClientRef ? label : null
  return person || null
}

function officialBereich(
  evaluations: readonly OfficialEvaluation[],
  party: readonly TripTraveller[],
): DestinationEssentialBereich<DestinationOfficialLage> {
  const { lage, unvollstaendig } = officialLageAus(evaluations)
  const links = uniqueLinks(
    evaluations.flatMap((eintrag) => {
      const aktion = destinationOfficialAktion(eintrag)
      const quelle = destinationOfficialQuelle(eintrag)
      return [aktion, quelle].filter((wert): wert is DestinationEssentialLink => wert != null)
    }),
  )
  const details = evaluations.map((eintrag, index) => ({
    id: [
      eintrag.travellerClientRef ?? 'none',
      eintrag.credentialOptionRef ?? 'none',
      eintrag.requirementType,
      String(index),
    ].join(':'),
    titel: officialAnforderungTitel(eintrag.requirementType, eintrag.visaMode),
    text: officialZeileErgebnisText(eintrag),
    kontextText: travellerKontext(eintrag, party),
    dokumentLabel: officialCredentialLabel(eintrag, party),
  }))
  return {
    lage,
    text: officialText(lage, unvollstaendig, evaluations),
    unvollstaendig,
    details,
    links,
  }
}

function safetyUnavailable(evaluation: SafetyEvaluation): boolean {
  return (
    evaluation.evidenceStatus === 'unavailable' ||
    evaluation.freshness === 'provider_unavailable' ||
    evaluation.freshness === 'source_temporarily_unavailable'
  )
}

function safetyStale(evaluation: SafetyEvaluation): boolean {
  return evaluation.freshness === 'stale' || evaluation.freshness === 'recheck_needed'
}

function safetyWarnungKlasse(evaluation: SafetyEvaluation): SafetyPresentationClass | null {
  if (evaluation.relevance !== 'affected') return null
  if (evaluation.freshness !== 'current' || evaluation.evidenceStatus !== 'current') return null
  if (evaluation.conflict) return null
  if (
    evaluation.presentationClass === 'critical_warning' ||
    evaluation.presentationClass === 'important_notice' ||
    evaluation.presentationClass === 'information'
  ) {
    return evaluation.presentationClass
  }
  return null
}

function safetyLageAus(evaluations: readonly SafetyEvaluation[]): {
  lage: DestinationSafetyLage
  unvollstaendig: boolean
} {
  if (evaluations.length === 0) return { lage: 'keine_evidence', unvollstaendig: false }
  const klassen = evaluations
    .map(safetyWarnungKlasse)
    .filter((wert): wert is SafetyPresentationClass => wert != null)
  const unvollstaendig =
    evaluations.some(safetyUnavailable) ||
    evaluations.some(safetyStale) ||
    evaluations.some(
      (eintrag) =>
        eintrag.conflict ||
        eintrag.freshness === 'never_checked' ||
        eintrag.evidenceStatus === 'unknown' ||
        eintrag.evidenceStatus === 'insufficient_context' ||
        eintrag.relevance === 'insufficient_context' ||
        eintrag.relevance === 'unknown' ||
        eintrag.presentationClass === 'unknown',
    )
  if (klassen.includes('critical_warning')) return { lage: 'critical_warning', unvollstaendig }
  if (klassen.includes('important_notice')) return { lage: 'important_notice', unvollstaendig }
  if (klassen.includes('information')) return { lage: 'information', unvollstaendig }
  if (evaluations.some(safetyUnavailable)) return { lage: 'unavailable', unvollstaendig: true }
  if (evaluations.some(safetyStale)) return { lage: 'stale', unvollstaendig: true }
  return { lage: 'unknown', unvollstaendig: true }
}

function safetyText(lage: DestinationSafetyLage, unvollstaendig: boolean): string {
  if (lage === 'keine_evidence') return DESTINATION_ESSENTIALS_LEERTEXT
  if (lage === 'unavailable') return SAFETY_FRISCHE_TEXT.provider_unavailable
  if (lage === 'stale') return SAFETY_FRISCHE_TEXT.stale
  if (lage === 'unknown') return SAFETY_KLASSE_TEXT.unknown
  const kern = SAFETY_KLASSE_TEXT[lage]
  return unvollstaendig ? `${kern} · Prüfung unvollständig` : kern
}

function safetyBereich(
  evaluations: readonly SafetyEvaluation[],
): DestinationEssentialBereich<DestinationSafetyLage> {
  const { lage, unvollstaendig } = safetyLageAus(evaluations)
  const links = uniqueLinks(
    evaluations.flatMap((eintrag) => {
      const href = safetyQuelleUrlLesen(eintrag.evidence.sourceUrl)
      return href
        ? [{ href, label: destinationQuelleLabel(eintrag.authorityClass), art: 'source' as const }]
        : []
    }),
  )
  return {
    lage,
    text: safetyText(lage, unvollstaendig),
    unvollstaendig,
    details: evaluations.map((eintrag) => ({
      id: eintrag.factId,
      titel: eintrag.evidence.headline ?? SAFETY_KATEGORIE_TEXT[eintrag.category],
      text: `${SAFETY_KLASSE_TEXT[eintrag.presentationClass]} · ${SAFETY_FRISCHE_TEXT[eintrag.freshness]}`,
      kontextText: eintrag.reason || null,
      dokumentLabel: null,
    })),
    links,
  }
}

function seasonalUnavailable(evaluation: SeasonalEvaluation): boolean {
  return (
    evaluation.evidenceStatus === 'unavailable' ||
    evaluation.freshness === 'provider_unavailable' ||
    evaluation.freshness === 'source_temporarily_unavailable'
  )
}

function seasonalStale(evaluation: SeasonalEvaluation): boolean {
  return evaluation.freshness === 'stale' || evaluation.freshness === 'recheck_needed'
}

function seasonalKlasse(evaluation: SeasonalEvaluation): SeasonalPresentationClass | null {
  if (evaluation.relevance !== 'applies') return null
  if (evaluation.freshness !== 'current' || evaluation.evidenceStatus !== 'current') return null
  if (evaluation.conflict) return null
  if (
    evaluation.presentationClass === 'timing_check' ||
    evaluation.presentationClass === 'timing_notice' ||
    evaluation.presentationClass === 'information'
  ) {
    return evaluation.presentationClass
  }
  return null
}

function seasonalLageAus(evaluations: readonly SeasonalEvaluation[]): {
  lage: DestinationSeasonalLage
  unvollstaendig: boolean
} {
  if (evaluations.length === 0) return { lage: 'keine_evidence', unvollstaendig: false }
  const klassen = evaluations
    .map(seasonalKlasse)
    .filter((wert): wert is SeasonalPresentationClass => wert != null)
  const unvollstaendig =
    evaluations.some(seasonalUnavailable) ||
    evaluations.some(seasonalStale) ||
    evaluations.some(
      (eintrag) =>
        eintrag.conflict ||
        eintrag.freshness === 'never_checked' ||
        eintrag.evidenceStatus === 'unknown' ||
        eintrag.evidenceStatus === 'insufficient_context' ||
        eintrag.relevance === 'insufficient_context' ||
        eintrag.relevance === 'unknown' ||
        eintrag.presentationClass === 'unknown',
    )
  if (klassen.includes('timing_check')) return { lage: 'timing_check', unvollstaendig }
  if (klassen.includes('timing_notice')) return { lage: 'timing_notice', unvollstaendig }
  if (klassen.includes('information')) return { lage: 'information', unvollstaendig }
  if (evaluations.some(seasonalUnavailable)) return { lage: 'unavailable', unvollstaendig: true }
  if (evaluations.some(seasonalStale)) return { lage: 'stale', unvollstaendig: true }
  return { lage: 'unknown', unvollstaendig: true }
}

function seasonalText(lage: DestinationSeasonalLage, unvollstaendig: boolean): string {
  if (lage === 'keine_evidence') return DESTINATION_ESSENTIALS_LEERTEXT
  if (lage === 'unavailable') return SEASONAL_FRISCHE_TEXT.provider_unavailable
  if (lage === 'stale') return SEASONAL_FRISCHE_TEXT.stale
  if (lage === 'unknown') return SEASONAL_KLASSE_TEXT.unknown
  const kern = SEASONAL_KLASSE_TEXT[lage]
  return unvollstaendig ? `${kern} · Prüfung unvollständig` : kern
}

function seasonalBereich(
  evaluations: readonly SeasonalEvaluation[],
): DestinationEssentialBereich<DestinationSeasonalLage> {
  const { lage, unvollstaendig } = seasonalLageAus(evaluations)
  const links = uniqueLinks(
    evaluations.flatMap((eintrag) => {
      const href = seasonalQuelleUrlLesen(eintrag.evidence.sourceUrl)
      return href
        ? [{ href, label: destinationQuelleLabel(eintrag.authorityClass), art: 'source' as const }]
        : []
    }),
  )
  return {
    lage,
    text: seasonalText(lage, unvollstaendig),
    unvollstaendig,
    details: evaluations.map((eintrag) => ({
      id: eintrag.factId,
      titel: eintrag.evidence.headline ?? SEASONAL_KATEGORIE_TEXT[eintrag.category],
      text: `${SEASONAL_KLASSE_TEXT[eintrag.presentationClass]} · ${SEASONAL_FRISCHE_TEXT[eintrag.freshness]}`,
      kontextText: eintrag.reason || null,
      dokumentLabel: null,
    })),
    links,
  }
}

function zielAus(
  stage: TripStage,
  officialEvaluations: readonly OfficialEvaluation[],
  safetyEvaluations: readonly SafetyEvaluation[],
  seasonalEvaluations: readonly SeasonalEvaluation[],
  party: readonly TripTraveller[],
): DestinationEssentialZiel {
  const countryCode = stage.countryCode
  const official = officialEvaluations.filter((eintrag) => destinationIstOfficialZiel(eintrag, countryCode))
  const safety = safetyEvaluations.filter((eintrag) => destinationSafetyBetrifftStage(eintrag, stage.id))
  const seasonal = seasonalEvaluations.filter((eintrag) =>
    destinationSeasonalBetrifftStage(eintrag, stage.id),
  )
  const einreise = officialBereich(official, party)
  const sicherheit = safetyBereich(safety)
  const saison = seasonalBereich(seasonal)
  return {
    stageId: stage.id,
    position: stage.position,
    name: nameLesen(stage.name),
    countryCode,
    countryLabel: landLabel(countryCode),
    placeId: stage.placeId,
    latitude: stage.latitude,
    longitude: stage.longitude,
    arrivalDate: stage.arrivalDate,
    departureDate: stage.departureDate,
    zeitraumText: zeitraumText(stage.arrivalDate, stage.departureDate),
    einreise,
    sicherheit,
    saison,
    hatHinweise:
      einreise.lage !== 'keine_evidence' ||
      sicherheit.lage !== 'keine_evidence' ||
      saison.lage !== 'keine_evidence',
  }
}

export function destinationEssentialsAbleiten(opts: {
  reise: Pick<Trip, 'stages' | 'party'>
  officialEvaluations?: readonly OfficialEvaluation[]
  safetyEvaluations?: readonly SafetyEvaluation[]
  seasonalEvaluations?: readonly SeasonalEvaluation[]
}): DestinationEssentialsAbleitung {
  const stages = [...opts.reise.stages].sort(etappenSortieren)
  const officialEvaluations = opts.officialEvaluations ?? []
  const safetyEvaluations = opts.safetyEvaluations ?? []
  const seasonalEvaluations = opts.seasonalEvaluations ?? []
  const party = opts.reise.party ?? []
  const ziele = stages.map((stage) =>
    zielAus(stage, officialEvaluations, safetyEvaluations, seasonalEvaluations, party),
  )
  return {
    titel: DESTINATION_ESSENTIALS_TITEL,
    ziele,
    leerText: DESTINATION_ESSENTIALS_LEERTEXT,
    hatZiele: ziele.length > 0,
    hatHinweise: ziele.some((ziel) => ziel.hatHinweise),
    loestSucheAus: false,
  }
}
