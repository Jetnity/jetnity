// lib/readiness/official-presentation.ts
//
// Provider-neutrale Besucher-Presentation für Official Evaluations.
// Ändert keine Requirements-Wahrheit. Kein Default-Pass, kein Ranking.

import { landAnzeigeText } from '@/lib/country/darstellung'
import {
  officialActionZweckText,
  officialAnforderungTitel,
  officialFehlendeAngabenText,
  officialFreshnessText,
  OFFICIAL_ERGEBNIS_BEZEICHNUNG,
} from '@/lib/readiness/bezeichnungen'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import type { TravellerDocumentType, TripTraveller } from '@/types/trips'

const OFFICIAL_PRAESENTATION_GRUPPEN = [
  'vor_abreise',
  'dokument_pruefen',
  'bei_einreise_vor_ort',
  'bei_einreise_nachweisen',
  'route_transit',
  'weitere',
] as const
export type OfficialPresentationGruppe = (typeof OFFICIAL_PRAESENTATION_GRUPPEN)[number]

export const OFFICIAL_PRAESENTATION_GRUPPE_TITEL: Record<OfficialPresentationGruppe, string> = {
  vor_abreise: 'Vor Abreise erledigen',
  dokument_pruefen: 'Dokument prüfen',
  bei_einreise_vor_ort: 'Bei Einreise / vor Ort',
  bei_einreise_nachweisen: 'Bei Einreise / Reise nachweisen',
  route_transit: 'Route / Transit',
  weitere: 'Weitere offizielle Anforderungen',
}

const DOKUMENT_TYP_BEZEICHNUNG: Record<TravellerDocumentType, string> = {
  passport: 'Reisepass',
  national_id: 'Personalausweis',
  unknown: 'Reisedokument',
}

const NEUTRALE_CREDENTIAL_COPY = 'Reisedokument-Option'

export type OfficialPresentationAction = {
  href: string
  label: string
}

export type OfficialChecklistSlot = {
  clientRef: string
  label: string
}

export type OfficialChecklistEintrag = {
  scopeKey: string
  gruppe: OfficialPresentationGruppe
  requirementType: OfficialEvaluation['requirementType']
  visaMode: OfficialEvaluation['visaMode']
  result: OfficialEvaluation['result']
  status: OfficialEvaluation['status']
  freshness: OfficialEvaluation['freshness']
  titel: string
  travellerLabel: string
  credentialLabel: string
  ortText: string | null
  ergebnisText: string
  authorityText: string | null
  pruefzeitText: string | null
  freshnessText: string
  aktionen: OfficialPresentationAction[]
}

export type OfficialChecklistGruppe = {
  id: OfficialPresentationGruppe
  titel: string
  eintraege: OfficialChecklistEintrag[]
}

function genauEines<T>(liste: readonly T[]): T | null {
  return liste.length === 1 ? (liste[0] ?? null) : null
}

export function officialEvaluationScopeKey(evaluation: OfficialEvaluation): string {
  return [
    evaluation.travellerClientRef ?? '',
    evaluation.credentialOptionRef ?? '',
    evaluation.destinationCountryCode ?? '',
    evaluation.transitCountryCode ?? '',
    evaluation.requirementType,
  ].join('|')
}

export function officialPresentationGruppe(evaluation: OfficialEvaluation): OfficialPresentationGruppe {
  const typ = evaluation.requirementType
  if (typ === 'visa') {
    if (evaluation.visaMode === 'visa_on_arrival' || evaluation.visaMode === 'visa_exempt') {
      return 'bei_einreise_vor_ort'
    }
    return 'vor_abreise'
  }
  if (
    typ === 'electronic_travel_authorization' ||
    typ === 'entry_form' ||
    typ === 'vaccination' ||
    typ === 'health_document' ||
    typ === 'health' ||
    typ === 'insurance'
  ) {
    return 'vor_abreise'
  }
  if (
    typ === 'passport' ||
    typ === 'identity_document' ||
    typ === 'passport_validity' ||
    typ === 'blank_passport_pages'
  ) {
    return 'dokument_pruefen'
  }
  if (typ === 'onward_or_return_ticket' || typ === 'booking_or_travel_document' || typ === 'financial_means') {
    return 'bei_einreise_nachweisen'
  }
  if (typ === 'transit') return 'route_transit'
  return 'weitere'
}

function officialZeileIstAktuell(evaluation: OfficialEvaluation): boolean {
  return evaluation.status === 'current' && evaluation.freshness === 'current'
}

export function officialZeileErgebnisText(evaluation: OfficialEvaluation): string {
  if (officialZeileIstAktuell(evaluation)) {
    return OFFICIAL_ERGEBNIS_BEZEICHNUNG[evaluation.result]
  }

  const teile: string[] = []
  if (evaluation.status === 'insufficient_context' || evaluation.missingFacts.length > 0) {
    teile.push(officialFehlendeAngabenText(evaluation.missingFacts))
  }
  if (evaluation.freshness === 'source_temporarily_unavailable') {
    teile.push('Offizielle Quelle derzeit nicht erreichbar')
  } else if (evaluation.freshness === 'provider_unavailable') {
    teile.push('Automatische Einreiseprüfung derzeit nicht verfügbar')
  } else if (evaluation.freshness === 'stale' || evaluation.freshness === 'recheck_needed') {
    teile.push('Erneut prüfen')
  } else if (evaluation.freshness === 'never_checked' && teile.length === 0) {
    teile.push('Noch nicht offiziell geprüft')
  }
  if (teile.length === 0) return 'Noch nicht offiziell geprüft'
  return teile.join(' · ')
}

export function officialCredentialLabel(
  evaluation: Pick<OfficialEvaluation, 'travellerClientRef' | 'credentialOptionRef'>,
  party: readonly TripTraveller[],
): string {
  const travellerRef = evaluation.travellerClientRef
  const optionRef = evaluation.credentialOptionRef
  if (!travellerRef || !optionRef) return NEUTRALE_CREDENTIAL_COPY

  const traveller = genauEines(party.filter((eintrag) => eintrag.clientRef === travellerRef))
  if (!traveller) return NEUTRALE_CREDENTIAL_COPY

  const option = genauEines(
    credentialOptionsAus(traveller).filter((eintrag) => eintrag.optionRef === optionRef),
  )
  if (!option?.document) return NEUTRALE_CREDENTIAL_COPY

  const teile = [DOKUMENT_TYP_BEZEICHNUNG[option.document.documentType]]
  if (option.document.issuingCountryCode) {
    teile.push(landAnzeigeText(option.document.issuingCountryCode))
  }
  if (option.document.citizenshipCountryCode) {
    teile.push(`Staatsbürgerschaft ${landAnzeigeText(option.document.citizenshipCountryCode)}`)
  }
  return teile.join(' · ')
}

function officialTravellerAnzeige(
  travellerClientRef: string | null,
  slots: readonly OfficialChecklistSlot[],
): string {
  if (!travellerClientRef) return 'Reisende'
  const slot = genauEines(slots.filter((eintrag) => eintrag.clientRef === travellerClientRef))
  const label = slot?.label.trim() ?? ''
  if (!label || label === travellerClientRef) return 'Reisende'
  return label
}

export function officialOrtText(evaluation: OfficialEvaluation): string | null {
  const teile: string[] = []
  if (evaluation.destinationCountryCode) {
    teile.push(`Reiseziel ${landAnzeigeText(evaluation.destinationCountryCode)}`)
  }
  if (evaluation.transitCountryCode) {
    teile.push(`Transit ${landAnzeigeText(evaluation.transitCountryCode)}`)
  }
  return teile.length > 0 ? teile.join(' · ') : null
}

export function officialPruefzeitText(checkedAt: string | null): string | null {
  if (!checkedAt) return null
  const treffer = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(checkedAt)
  if (!treffer) return null
  return `Jetnity-Prüfung ${treffer[3]}.${treffer[2]}.${treffer[1]}, ${treffer[4]}:${treffer[5]} UTC`
}

export function officialPresentationAktionen(evaluation: OfficialEvaluation): OfficialPresentationAction[] {
  const aktionen: OfficialPresentationAction[] = []
  const gesehen = new Set<string>()
  if (evaluation.action?.href) {
    aktionen.push({
      href: evaluation.action.href,
      label: officialActionZweckText(evaluation.action.purpose),
    })
    gesehen.add(evaluation.action.href)
  }
  const quelle = evaluation.evidence.sourceUrl
  if (quelle && !gesehen.has(quelle)) {
    aktionen.push({
      href: quelle,
      label: 'Offizielle Quelle öffnen',
    })
  }
  return aktionen
}

function eintragAus(
  evaluation: OfficialEvaluation,
  party: readonly TripTraveller[],
  slots: readonly OfficialChecklistSlot[],
): OfficialChecklistEintrag {
  return {
    scopeKey: officialEvaluationScopeKey(evaluation),
    gruppe: officialPresentationGruppe(evaluation),
    requirementType: evaluation.requirementType,
    visaMode: evaluation.visaMode,
    result: evaluation.result,
    status: evaluation.status,
    freshness: evaluation.freshness,
    titel: officialAnforderungTitel(evaluation.requirementType, evaluation.visaMode),
    travellerLabel: officialTravellerAnzeige(evaluation.travellerClientRef, slots),
    credentialLabel: officialCredentialLabel(evaluation, party),
    ortText: officialOrtText(evaluation),
    ergebnisText: officialZeileErgebnisText(evaluation),
    authorityText: evaluation.evidence.authority,
    pruefzeitText: officialPruefzeitText(evaluation.evidence.checkedAt),
    freshnessText: officialFreshnessText(evaluation.freshness),
    aktionen: officialPresentationAktionen(evaluation),
  }
}

export function officialChecklist(opts: {
  evaluations: readonly OfficialEvaluation[]
  party: readonly TripTraveller[]
  slots: readonly OfficialChecklistSlot[]
}): OfficialChecklistGruppe[] {
  const sortiert = [...opts.evaluations].sort((links, rechts) =>
    officialEvaluationScopeKey(links).localeCompare(officialEvaluationScopeKey(rechts)),
  )
  const nachGruppe = new Map<OfficialPresentationGruppe, OfficialChecklistEintrag[]>()
  for (const evaluation of sortiert) {
    const eintrag = eintragAus(evaluation, opts.party, opts.slots)
    const liste = nachGruppe.get(eintrag.gruppe) ?? []
    liste.push(eintrag)
    nachGruppe.set(eintrag.gruppe, liste)
  }
  return OFFICIAL_PRAESENTATION_GRUPPEN.flatMap((id) => {
    const eintraege = nachGruppe.get(id)
    if (!eintraege?.length) return []
    return [{ id, titel: OFFICIAL_PRAESENTATION_GRUPPE_TITEL[id], eintraege }]
  })
}
