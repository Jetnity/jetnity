// lib/readiness/status.ts
//
// Führt abgeleitete Prüfaufgaben mit persistiertem Nutzerstand zusammen.
// User done + official unknown bleibt official unknown.
// Kein globales „Reisebereit“.
//
// Official Evaluations kommen optional von aussen (serverseitig).
// Ohne Lieferung: lokaler fail-closed Fallback, kein Client-Provider.

import { officialAusEvaluations } from '@/lib/readiness/anforderungen'
import { readinessChecksAbleiten } from '@/lib/readiness/ableitung'
import { requirementsLokalFuerReise } from '@/lib/readiness/engine'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { officialPruefungAusLage } from '@/lib/readiness/bezeichnungen'
import { fehlendeFaktenFuerReise, travellerSlots } from '@/lib/readiness/party'
import {
  readinessItemsVon,
  type OfficialRequirementEvidence,
  type ReadinessCurrentness,
  type ReadinessSummary,
  type ReadinessViewItem,
} from '@/lib/readiness/domain'
import { fingerprintAktuell, readinessFingerprint } from '@/lib/readiness/fingerprint'
import { punktFuerReadiness, readinessReisekontext, routeFingerprintFelder } from '@/lib/readiness/kontext'
import type { Trip, TripReadinessItem } from '@/types/trips'

function aktuellerFingerprint(reise: Trip, item: Pick<TripReadinessItem, 'kind' | 'countryCode' | 'tripItemId' | 'title'>): string {
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
  })
}

function currentnessFuer(
  reise: Trip,
  item: TripReadinessItem,
  abgeleitet: boolean,
): ReadinessCurrentness {
  const kontext = readinessReisekontext(reise)

  if (item.kind === 'entry_check' || item.kind === 'visa_check' || item.kind === 'travel_document_check') {
    if (item.countryCode && !kontext.destinationCountries.includes(item.countryCode)) {
      return 'not_applicable'
    }
  }

  if (item.kind === 'ticket_confirmation_check' || item.kind === 'booking_confirmation_check') {
    const punkt = punktFuerReadiness(reise, item.tripItemId)
    if (!punkt || punkt.bookingStatus !== 'booked') return 'not_applicable'
  }

  const aktuell = aktuellerFingerprint(reise, item)
  if (!fingerprintAktuell(item.contextFingerprint, aktuell)) return 'stale'
  return abgeleitet || item.kind === 'preparation' ? 'current' : 'current'
}

function freshnessAusEvaluations(evaluations: readonly OfficialEvaluation[]): ReadinessSummary['officialFreshness'] {
  if (evaluations.length === 0) return 'never_checked'
  if (evaluations.every((eintrag) => eintrag.freshness === 'provider_unavailable')) return 'provider_unavailable'
  if (evaluations.some((eintrag) => eintrag.freshness === 'source_temporarily_unavailable')) {
    return 'source_temporarily_unavailable'
  }
  if (evaluations.some((eintrag) => eintrag.freshness === 'stale')) return 'stale'
  if (evaluations.some((eintrag) => eintrag.freshness === 'recheck_needed')) return 'recheck_needed'
  if (evaluations.some((eintrag) => eintrag.freshness === 'current')) return 'current'
  return 'never_checked'
}

export function readinessAnsicht(
  reise: Trip,
  evaluationsGeliefert?: readonly OfficialEvaluation[],
): {
  items: ReadinessViewItem[]
  summary: ReadinessSummary
  evaluations: OfficialEvaluation[]
} {
  const kontext = readinessReisekontext(reise)
  const persistiert = readinessItemsVon(reise)
  const abgeleitet = readinessChecksAbleiten(reise)
  const nachRef = new Map(persistiert.map((item) => [item.clientRef, item]))
  const evaluations = [...(evaluationsGeliefert ?? requirementsLokalFuerReise(reise))]

  const officialFuer = (countryCode: string | null): OfficialRequirementEvidence => {
    const passend = evaluations.filter(
      (eintrag) => !countryCode || eintrag.destinationCountryCode === countryCode,
    )
    return officialAusEvaluations(passend.length > 0 ? passend : evaluations, {
      destinationCountryCode: countryCode ?? kontext.destinationCountries[0] ?? null,
      travellers: kontext.travellers,
    })
  }

  const items: ReadinessViewItem[] = []
  const gesehen = new Set<string>()

  for (const check of abgeleitet) {
    const gespeichert = nachRef.get(check.clientRef)
    gesehen.add(check.clientRef)
    const userStatus = gespeichert?.userStatus ?? 'open'
    const currentness = gespeichert
      ? currentnessFuer(reise, { ...gespeichert, tripItemId: check.tripItemId }, true)
      : 'current'
    items.push({
      clientRef: check.clientRef,
      kind: check.kind,
      userStatus,
      evidence: 'user',
      currentness,
      countryCode: check.countryCode,
      tripItemId: check.tripItemId,
      title: check.title,
      persisted: Boolean(gespeichert),
      official: officialFuer(check.countryCode),
    })
  }

  for (const gespeichert of persistiert) {
    if (gesehen.has(gespeichert.clientRef)) continue
    items.push({
      clientRef: gespeichert.clientRef,
      kind: gespeichert.kind,
      userStatus: gespeichert.userStatus,
      evidence: 'user',
      currentness: currentnessFuer(reise, gespeichert, false),
      countryCode: gespeichert.countryCode,
      tripItemId: gespeichert.tripItemId,
      title: gespeichert.title,
      persisted: true,
      official: officialFuer(gespeichert.countryCode),
    })
  }

  const zaehlbar = items.filter((item) => item.currentness !== 'not_applicable')
  const official = officialAusEvaluations(evaluations, {
    destinationCountryCode: kontext.destinationCountries[0] ?? null,
    travellers: kontext.travellers,
  })

  const summary: ReadinessSummary = {
    open: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'open').length,
    done: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'done').length,
    skipped: zaehlbar.filter((item) => item.currentness === 'current' && item.userStatus === 'skipped').length,
    stale: zaehlbar.filter((item) => item.currentness === 'stale').length,
    notApplicable: items.filter((item) => item.currentness === 'not_applicable').length,
    officialStatus: official.status,
    officialResult: 'unknown',
    officialReason: official.reason,
    travellers: kontext.travellers,
    destinationCountries: kontext.destinationCountries,
    unknownCountryContext: kontext.unknownCountryStages > 0,
    individualClaimsForbidden: kontext.travellers > 1 || travellerSlots(reise).some((slot) => slot.applicable && slot.missingFacts.includes('nationality')),
    missingFacts: [
      ...new Set([
        ...fehlendeFaktenFuerReise({ ...reise, stages: reise.stages }),
        ...evaluations.flatMap((eintrag) => eintrag.missingFacts),
      ]),
    ],
    officialFreshness: freshnessAusEvaluations(evaluations),
  }

  return { items, summary, evaluations }
}

export function readinessZusammenfassungText(summary: ReadinessSummary): string {
  const teile: string[] = []
  const vorbereitung = summary.done + summary.open + summary.skipped + summary.stale
  if (vorbereitung === 0) {
    teile.push('Noch keine Vorbereitungspunkte')
  } else {
    teile.push(`${summary.done} von ${summary.done + summary.open + summary.stale} Vorbereitungspunkten erledigt`)
  }
  if (summary.stale > 0) {
    teile.push(`${summary.stale} erneut prüfen`)
  }
  teile.push(
    officialPruefungAusLage([
      {
        freshness: summary.officialFreshness,
        status:
          summary.missingFacts.length > 0
            ? 'insufficient_context'
            : summary.officialStatus === 'unavailable'
              ? 'unavailable'
              : 'unknown',
        missingFacts: summary.missingFacts,
      },
    ]),
  )
  return teile.join(' · ')
}
