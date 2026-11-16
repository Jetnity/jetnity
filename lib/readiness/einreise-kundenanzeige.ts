// Anzeigegrenze für Einreise & Visum.
// Liest nur bereits gefilterte Evaluationen und Besucheraussagen.
// Erfindet keine Visumfreiheit, keinen Link und keinen Quellenstand.

import { landAnzeigeText } from '@/lib/country/darstellung'
import {
  OFFICIAL_ERGEBNIS_BEZEICHNUNG,
  OFFICIAL_VISA_MODUS_BEZEICHNUNG,
  officialActionZweckText,
  officialAnforderungTitel,
} from '@/lib/readiness/bezeichnungen'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { officialCredentialLabel, officialZeileErgebnisText } from '@/lib/readiness/official-presentation'
import { officialTemporalTexte } from '@/lib/readiness/temporal'
import { destinationIstOfficialZiel } from '@/lib/trips/destination-essentials'
import { V3_CUSTOMER_INFORMATION_TOPICS, type V3CustomerInformationTopic } from '@/lib/readiness/official-truth-product-v3/customer-information/topics'
import { credentialOptionsAus } from '@/lib/readiness/traveller-kontext'
import type { TripTraveller } from '@/types/trips'

export const EINREISE_AMPEL_TEXT = {
  gruen: 'Kein Visum nötig',
  orange: 'Visum/ETA nötig – jetzt beantragen',
  neutral: 'Noch nicht bestätigt – bitte bei der Behörde prüfen',
} as const

export type EinreiseAmpel = keyof typeof EINREISE_AMPEL_TEXT

export const EINREISE_WEITERE_THEMEN = 'Weitere Themen werden noch geprüft'
export const EINREISE_PLATZHALTER = 'Einreiseanforderungen noch nicht prüfbar'
export const EINREISE_UNBEKANNT_LAND = 'Zielland noch nicht bestätigt'

const VISUMFREI = `${OFFICIAL_ERGEBNIS_BEZEICHNUNG.not_required} · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG.visa_exempt}`
const ORANGE_VISUM = new Set([
  `${OFFICIAL_ERGEBNIS_BEZEICHNUNG.required} · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG.visa_before_travel}`,
  `${OFFICIAL_ERGEBNIS_BEZEICHNUNG.required} · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG.electronic_visa}`,
  `${OFFICIAL_ERGEBNIS_BEZEICHNUNG.required} · ${OFFICIAL_VISA_MODUS_BEZEICHNUNG.visa_on_arrival}`,
  OFFICIAL_ERGEBNIS_BEZEICHNUNG.required,
])

export type EinreiseSlot = {
  clientRef: string
  label: string
  applicable: boolean
  traveller: TripTraveller | null
}

export type EinreiseThema = {
  id: string
  label: string
  text: string
  bedingung: string | null
  href: string | null
  hrefLabel: string | null
  quelle: string | null
  quelleHref: string | null
  stand: string | null
  todo: boolean
  timingTexte: readonly string[]
  requirementType: string | null
  result: string | null
  status: string | null
  freshness: string | null
}

export type EinreisePaar = {
  id: string
  reisende: string
  dokument: string
  land: string
  landCode: string
  ampel: EinreiseAmpel
  ampelText: string
  antragHref: string | null
  antragLabel: string | null
  todos: EinreiseThema[]
  themen: EinreiseThema[]
  ungeprueft: string[]
  platzhalter: boolean
}

export type EinreiseAnzeige = {
  satz: string
  standSatz: string
  paare: EinreisePaar[]
}

export type EinreiseUebersichtZeile = {
  countryCode: string
  land: string
  ampel: EinreiseAmpel
  ampelText: string
}

export type EinreiseBesucherAussage = {
  text: string
  when: string | null
  href: string | null
}

export type EinreiseBesucherErgebnis = {
  status: string
  informationTopic?: string
  statements?: readonly EinreiseBesucherAussage[]
  source?: { label: string; href: string }
  checkedAtText?: string
}

type Land = { code: string; label: string }
type Option = ReturnType<typeof credentialOptionsAus>[number]

function https(wert: string | null | undefined): string | null {
  if (!wert || !wert.startsWith('https://')) return null
  return wert
}

function datumAusIso(wert: string | null | undefined): string | null {
  const treffer = /^(\d{4})-(\d{2})-(\d{2})/.exec(wert ?? '')
  if (!treffer) return null
  return `${treffer[3]}.${treffer[2]}.${treffer[1]}`
}

function datumAusStandtext(wert: string | null | undefined): string | null {
  const treffer = /Stand vom (\d{2}\.\d{2}\.\d{4})/.exec(wert ?? '')
  return treffer?.[1] ?? null
}

function standSatz(daten: readonly (string | null)[]): string {
  const bestätigt = [...new Set(daten.filter((eintrag): eintrag is string => Boolean(eintrag)))]
  const stand = bestätigt.length === 1 ? bestätigt[0] : null
  const text = stand ?? 'derzeit nicht verfügbar'
  return `Angaben aus amtlichen Quellen, Stand ${text}. Bitte vor Abreise nochmals prüfen.`
}

function satzAus(paare: readonly EinreisePaar[]): string {
  if (paare.length > 0 && paare.every((paar) => paar.ampel === 'gruen')) {
    return 'Für die erfassten Reisenden und Pässe ist kein Visum nötig.'
  }
  if (paare.some((paar) => paar.ampel === 'orange')) {
    return 'Für mindestens eine Person ist ein Visum oder eine ETA bestätigt nötig.'
  }
  return 'Die Visumlage ist noch nicht bestätigt.'
}

export function einreiseAmpelAggregieren(lichter: readonly EinreiseAmpel[]): EinreiseAmpel {
  if (lichter.length === 0) return 'neutral'
  if (lichter.some((licht) => licht === 'orange')) return 'orange'
  if (lichter.every((licht) => licht === 'gruen')) return 'gruen'
  return 'neutral'
}

export function einreiseUebersicht(anzeige: EinreiseAnzeige): EinreiseUebersichtZeile[] {
  const reihenfolge: string[] = []
  const nachLand = new Map<string, EinreisePaar[]>()
  for (const paar of anzeige.paare) {
    if (!paar.landCode) continue
    const bisher = nachLand.get(paar.landCode)
    if (bisher) bisher.push(paar)
    else {
      reihenfolge.push(paar.landCode)
      nachLand.set(paar.landCode, [paar])
    }
  }
  return reihenfolge.map((countryCode) => {
    const paare = nachLand.get(countryCode) ?? []
    const ampel = einreiseAmpelAggregieren(paare.map((paar) => paar.ampel))
    return { countryCode, land: paare.find((paar) => paar.land)?.land ?? countryCode, ampel, ampelText: EINREISE_AMPEL_TEXT[ampel] }
  })
}

function bestaetigt(evaluation: OfficialEvaluation): boolean {
  return evaluation.status === 'current'
    && evaluation.freshness === 'current'
    && evaluation.result !== 'unknown'
    && evaluation.missingFacts.length === 0
}

function visumGruen(evaluation: OfficialEvaluation): boolean {
  return evaluation.requirementType === 'visa'
    && bestaetigt(evaluation)
    && evaluation.result === 'not_required'
    && evaluation.visaMode === 'visa_exempt'
}

function visumOrange(evaluation: OfficialEvaluation): boolean {
  return evaluation.requirementType === 'visa'
    && bestaetigt(evaluation)
    && evaluation.result === 'required'
    && evaluation.visaMode !== 'visa_exempt'
}

function etaOrange(evaluation: OfficialEvaluation): boolean {
  return evaluation.requirementType === 'electronic_travel_authorization'
    && bestaetigt(evaluation)
    && evaluation.result === 'required'
}

function lichtAusEvaluationen(evaluations: readonly OfficialEvaluation[]): EinreiseAmpel {
  const visa = evaluations.filter((eintrag) => eintrag.requirementType === 'visa' && destinationIstOfficialZiel(eintrag, eintrag.destinationCountryCode))
  const eta = evaluations.filter((eintrag) => eintrag.requirementType === 'electronic_travel_authorization' && destinationIstOfficialZiel(eintrag, eintrag.destinationCountryCode))
  if (visa.some(visumGruen) && visa.some(visumOrange)) return 'neutral'
  if (visa.some(visumOrange) || eta.some(etaOrange)) return 'orange'
  if (visa.length > 0 && visa.every(visumGruen)) return 'gruen'
  return 'neutral'
}

function themaId(evaluation: OfficialEvaluation): V3CustomerInformationTopic | null {
  switch (evaluation.requirementType) {
    case 'visa': return 'visa'
    case 'electronic_travel_authorization': return 'electronic_travel_authorization'
    case 'passport': return 'passport'
    case 'identity_document': return 'identity_document'
    case 'passport_validity': return 'passport_validity'
    case 'blank_passport_pages': return 'blank_passport_pages'
    case 'vaccination':
      if (evaluation.officialClass === 'recommendation') return 'recommended_vaccinations'
      if (evaluation.officialClass === 'requirement' && evaluation.result === 'required') return 'required_vaccinations'
      return null
    case 'health': return 'health_measures'
    case 'health_document': return 'health_documents'
    case 'entry_form': return 'entry_forms'
    case 'insurance': return 'insurance'
    case 'onward_or_return_ticket': return 'onward_return_ticket'
    case 'financial_means': return 'financial_means'
    case 'booking_or_travel_document': return 'booking_or_travel_document'
    case 'transit': return 'transit'
    default: return null
  }
}

function betrifftLand(evaluation: OfficialEvaluation, code: string): boolean {
  if (!code) return !evaluation.destinationCountryCode && !evaluation.transitCountryCode
  if (evaluation.requirementType === 'transit') {
    return evaluation.transitCountryCode === code || evaluation.destinationCountryCode === code
  }
  return destinationIstOfficialZiel(evaluation, code)
}

function leerThema(evaluation: OfficialEvaluation, id: string, label: string, text: string, todo: boolean): EinreiseThema {
  const quelleHref = https(evaluation.evidence.sourceUrl)
  return {
    id,
    label,
    text,
    bedingung: null,
    href: https(evaluation.action?.href) ,
    hrefLabel: evaluation.action ? officialActionZweckText(evaluation.action.purpose) : null,
    quelle: evaluation.evidence.authority,
    quelleHref,
    stand: datumAusIso(evaluation.evidence.checkedAt),
    todo,
    timingTexte: officialTemporalTexte(evaluation.temporalRule),
    requirementType: evaluation.requirementType,
    result: evaluation.result,
    status: evaluation.status,
    freshness: evaluation.freshness,
  }
}

function themenAus(evaluations: readonly OfficialEvaluation[]): EinreiseThema[] {
  const thema = new Map<string, EinreiseThema>()
  for (const evaluation of evaluations) {
    if (!bestaetigt(evaluation)) continue
    const id = themaId(evaluation)
    if (!id || thema.has(id)) continue
    const label = V3_CUSTOMER_INFORMATION_TOPICS.find((eintrag) => eintrag.id === id)?.label ?? officialAnforderungTitel(evaluation.requirementType, evaluation.visaMode)
    const text = visumGruen(evaluation)
      ? EINREISE_AMPEL_TEXT.gruen
      : visumOrange(evaluation) || etaOrange(evaluation)
        ? EINREISE_AMPEL_TEXT.orange
        : officialZeileErgebnisText(evaluation)
    const todo = visumOrange(evaluation)
      || etaOrange(evaluation)
      || (evaluation.result === 'required' && evaluation.officialClass !== 'recommendation' && id !== 'visa' && id !== 'electronic_travel_authorization')
    thema.set(id, leerThema(evaluation, id, label, text, todo))
  }
  return V3_CUSTOMER_INFORMATION_TOPICS.flatMap((eintrag) => {
    const gefunden = thema.get(eintrag.id)
    return gefunden ? [gefunden] : []
  })
}

function antragAus(evaluations: readonly OfficialEvaluation[], ampel: EinreiseAmpel): { href: string | null; label: string | null } {
  if (ampel !== 'orange') return { href: null, label: null }
  const pflicht = evaluations.find((eintrag) => visumOrange(eintrag) || etaOrange(eintrag))
  const href = https(pflicht?.action?.href)
  if (!pflicht || !href || !pflicht.action) return { href: null, label: null }
  return { href, label: officialActionZweckText(pflicht.action.purpose) }
}

function paarBauen(teil: {
  id: string
  reisende: string
  dokument: string
  land: Land
  evaluations: readonly OfficialEvaluation[]
}): EinreisePaar {
  const ampel = lichtAusEvaluationen(teil.evaluations)
  const themen = themenAus(teil.evaluations)
  const belegt = new Set(themen.map((thema) => thema.id))
  const ungeprueft = V3_CUSTOMER_INFORMATION_TOPICS.filter((thema) => !belegt.has(thema.id)).map((thema) => thema.label)
  const antrag = antragAus(teil.evaluations, ampel)
  return {
    id: teil.id,
    reisende: teil.reisende,
    dokument: teil.dokument,
    land: teil.land.label,
    landCode: teil.land.code,
    ampel,
    ampelText: EINREISE_AMPEL_TEXT[ampel],
    antragHref: antrag.href,
    antragLabel: antrag.label,
    todos: themen.filter((thema) => thema.todo),
    themen,
    ungeprueft,
    platzhalter: themen.length === 0,
  }
}

function anzeigeAus(paare: EinreisePaar[]): EinreiseAnzeige {
  const staende = paare.flatMap((paar) => paar.themen.map((thema) => thema.stand))
  return { satz: satzAus(paare), standSatz: standSatz(staende), paare }
}

function laenderAus(codes: readonly (string | null)[]): Land[] {
  const gesehen = new Set<string>()
  const laender: Land[] = []
  for (const code of codes) {
    const normalisiert = code?.trim() ?? ''
    if (gesehen.has(normalisiert)) continue
    gesehen.add(normalisiert)
    laender.push({
      code: normalisiert,
      label: normalisiert ? landAnzeigeText(normalisiert) : EINREISE_UNBEKANNT_LAND,
    })
  }
  if (laender.length === 0) laender.push({ code: '', label: EINREISE_UNBEKANNT_LAND })
  return laender
}

function dokumentname(option: Option | null, party: readonly TripTraveller[]): string {
  if (!option) return 'Reisedokument-Option'
  return officialCredentialLabel(
    { travellerClientRef: option.travellerClientRef, credentialOptionRef: option.optionRef },
    party,
  )
}

export function einreiseKundenanzeige(input: {
  evaluations: readonly OfficialEvaluation[]
  party: readonly TripTraveller[]
  slots: readonly EinreiseSlot[]
  laender: readonly (string | null)[]
}): EinreiseAnzeige {
  const laender = laenderAus(input.laender)
  const slots = input.slots.filter((slot) => slot.applicable)
  const verwendet = new Set<OfficialEvaluation>()
  const paare: EinreisePaar[] = []

  const raster = slots.length > 0 ? slots : [{ clientRef: '', label: 'Reisende', applicable: true, traveller: null }]
  for (const land of laender) {
    for (const slot of raster) {
      const optionen: Array<Option | null> = slot.traveller ? credentialOptionsAus(slot.traveller) : [null]
      for (const option of optionen) {
        const ref = option?.optionRef ?? ''
        const evaluations = input.evaluations.filter((evaluation) => {
          if (!betrifftLand(evaluation, land.code)) return false
          if ((evaluation.travellerClientRef ?? '') !== slot.clientRef) return false
          return (evaluation.credentialOptionRef ?? '') === ref
        })
        for (const evaluation of evaluations) verwendet.add(evaluation)
        paare.push(paarBauen({
          id: `${slot.clientRef || 'reisende'}:${ref || 'dokument'}:${land.code || 'ohne-land'}`,
          reisende: slot.label.trim() || 'Reisende',
          dokument: dokumentname(option, input.party),
          land,
          evaluations,
        }))
      }
    }
    const rest = new Map<string, OfficialEvaluation[]>()
    for (const evaluation of input.evaluations) {
      if (verwendet.has(evaluation) || !betrifftLand(evaluation, land.code)) continue
      const key = `${evaluation.travellerClientRef ?? ''}\u0000${evaluation.credentialOptionRef ?? ''}`
      const liste = rest.get(key) ?? []
      liste.push(evaluation)
      rest.set(key, liste)
    }
    for (const [key, evaluations] of rest) {
      for (const evaluation of evaluations) verwendet.add(evaluation)
      const [travellerRef, credentialRef] = key.split('\u0000')
      const slot = slots.find((eintrag) => eintrag.clientRef === travellerRef)
      paare.push(paarBauen({
        id: `extra:${key}:${land.code || 'ohne-land'}`,
        reisende: slot?.label.trim() || 'Reisende',
        dokument: officialCredentialLabel(
          { travellerClientRef: travellerRef || null, credentialOptionRef: credentialRef || null },
          input.party,
        ),
        land,
        evaluations,
      }))
    }
  }
  return anzeigeAus(paare)
}

function aussageBrauchbar(text: string): boolean {
  const zeile = text.trim()
  if (!zeile || zeile === 'Derzeit nicht verfügbar') return false
  if (/: Derzeit nicht verfügbar$/.test(zeile)) return false
  return true
}

function lichtAusBesucher(topic: string, texte: readonly string[]): EinreiseAmpel | null {
  if (texte.length === 0) return null
  if (topic === 'visa') {
    if (texte.every((text) => text === VISUMFREI)) return 'gruen'
    if (texte.every((text) => ORANGE_VISUM.has(text))) return 'orange'
    return 'neutral'
  }
  if (topic === 'electronic_travel_authorization' && texte.every((text) => text === OFFICIAL_ERGEBNIS_BEZEICHNUNG.required)) {
    return 'orange'
  }
  return null
}

function themaBekannt(id: string): id is V3CustomerInformationTopic {
  return V3_CUSTOMER_INFORMATION_TOPICS.some((thema) => thema.id === id)
}

export function einreiseAusBesucher(input: {
  zielCode: string
  zielLabel: string
  zellen: readonly { landCode: string; landLabel: string; ergebnisse: readonly EinreiseBesucherErgebnis[] }[]
}): EinreiseAnzeige {
  const paare = input.zellen.map((zelle) => {
    const lichter: EinreiseAmpel[] = []
    const thema = new Map<string, EinreiseThema>()
    for (const ergebnis of zelle.ergebnisse) {
      if (ergebnis.status !== 'accepted' || !ergebnis.informationTopic || !themaBekannt(ergebnis.informationTopic)) continue
      const aussagen = (ergebnis.statements ?? []).filter((aussage) => aussageBrauchbar(aussage.text))
      if (aussagen.length === 0) continue
      const licht = lichtAusBesucher(ergebnis.informationTopic, aussagen.map((aussage) => aussage.text))
      if (licht) lichter.push(licht)
      if (thema.has(ergebnis.informationTopic)) continue
      const label = V3_CUSTOMER_INFORMATION_TOPICS.find((eintrag) => eintrag.id === ergebnis.informationTopic)?.label ?? ergebnis.informationTopic
      const erste = aussagen.find((aussage) => aussage.text)
      const visaThema = ergebnis.informationTopic === 'visa' || ergebnis.informationTopic === 'electronic_travel_authorization'
      thema.set(ergebnis.informationTopic, {
        id: ergebnis.informationTopic,
        label,
        text: visaThema && licht ? EINREISE_AMPEL_TEXT[licht] : (erste?.text ?? ''),
        bedingung: erste?.when ?? null,
        href: https(erste?.href),
        hrefLabel: https(erste?.href) ? 'Amtliche Seite öffnen' : null,
        quelle: ergebnis.source?.label ?? null,
        quelleHref: https(ergebnis.source?.href),
        stand: datumAusStandtext(ergebnis.checkedAtText),
        todo: licht === 'orange',
        timingTexte: [],
        requirementType: ergebnis.informationTopic,
        result: licht === 'gruen' ? 'not_required' : licht === 'orange' ? 'required' : 'unknown',
        status: 'current',
        freshness: 'current',
      })
    }
    const ampel = einreiseAmpelAggregieren(lichter.length > 0 ? lichter : ['neutral'])
    const themen = V3_CUSTOMER_INFORMATION_TOPICS.flatMap((eintrag) => {
      const gefunden = thema.get(eintrag.id)
      return gefunden ? [gefunden] : []
    })
    const belegt = new Set(themen.map((eintrag) => eintrag.id))
    return {
      id: `${zelle.landCode}:${input.zielCode}`,
      reisende: zelle.landLabel,
      dokument: 'Gewählter Pass',
      land: input.zielLabel,
      landCode: input.zielCode,
      ampel,
      ampelText: EINREISE_AMPEL_TEXT[ampel],
      antragHref: themen.find((eintrag) => eintrag.todo && eintrag.href)?.href ?? null,
      antragLabel: themen.find((eintrag) => eintrag.todo && eintrag.href)?.hrefLabel ?? null,
      todos: themen.filter((eintrag) => eintrag.todo),
      themen,
      ungeprueft: V3_CUSTOMER_INFORMATION_TOPICS.filter((eintrag) => !belegt.has(eintrag.id)).map((eintrag) => eintrag.label),
      platzhalter: themen.length === 0,
    } satisfies EinreisePaar
  })
  return anzeigeAus(paare)
}
