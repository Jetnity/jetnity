// lib/activities/anreichern.ts
//
// Hängt Jetnity-Kontext an Provideroptionen. Unbekannt bleibt unbekannt.
// Keine Wegezeiten, keine erfundenen Lücken, keine Nähe nur wegen derselben Stadt.
//
// Frei von Next und Providern.

import type {
  ActivityKandidat,
  ActivityKontext,
  ActivityOption,
  ActivitySuchanfrage,
} from '@/lib/activities/domain'
import { konfliktPruefen, timeslotAlsFenster, type Zeitfenster } from '@/lib/activities/konflikt'
import { luftlinieKm } from '@/lib/hotels/geo'
import type { TripInterest, TripPace } from '@/types/trips'

const INTERESSE_SCHLUESSEL: Record<TripInterest, readonly string[]> = {
  culture: ['culture', 'kultur', 'museum', 'art', 'kunst', 'history', 'geschichte', 'sightseeing'],
  nature: ['nature', 'natur', 'outdoor', 'hike', 'wandern', 'park'],
  food: ['food', 'kulinarik', 'essen', 'cuisine', 'cooking', 'kochen', 'wine', 'wein'],
  beach: ['beach', 'strand', 'sea', 'meer', 'snorkel'],
  adventure: ['adventure', 'abenteuer', 'sport', 'climb', 'kletter'],
  wellness: ['wellness', 'spa', 'relax', 'yoga'],
}

function clamp01(wert: number): number {
  return Math.max(0, Math.min(1, wert))
}

function token(wert: string): string {
  return wert.trim().toLowerCase()
}

function interessenFit(option: ActivityOption, interessen: ReadonlyArray<string>): number | null {
  if (interessen.length === 0) return null
  const merkmale = [...option.kategorien, ...option.tags].map(token).filter(Boolean)
  if (merkmale.length === 0) return null

  let treffer = 0
  for (const interesse of interessen) {
    const schluessel = INTERESSE_SCHLUESSEL[interesse as TripInterest]
    if (!schluessel) continue
    if (merkmale.some((merkmal) => schluessel.some((wort) => merkmal.includes(wort)))) {
      treffer += 1
    }
  }
  return Math.round((treffer / interessen.length) * 1000) / 1000
}

function dauerFit(dauerMinuten: number | null, pace: TripPace | null): number | null {
  if (dauerMinuten === null || pace === null) return null
  if (pace === 'calm') {
    if (dauerMinuten <= 90) return 1
    if (dauerMinuten <= 180) return 0.7
    return clamp01(1 - (dauerMinuten - 180) / 240)
  }
  if (pace === 'intense') {
    if (dauerMinuten >= 90 && dauerMinuten <= 300) return 1
    if (dauerMinuten < 90) return 0.55
    return clamp01(1 - (dauerMinuten - 300) / 300)
  }
  if (dauerMinuten >= 60 && dauerMinuten <= 210) return 1
  if (dauerMinuten < 60) return 0.7
  return clamp01(1 - (dauerMinuten - 210) / 270)
}

function lageFit(option: ActivityOption, etappenPunkt: { lat: number; lon: number } | null): number | null {
  if (!option.punkt || !etappenPunkt) return null
  const km = luftlinieKm(option.punkt, etappenPunkt)
  if (!Number.isFinite(km)) return null
  // Nur grobe Distanz, keine Wegezeit. Über 25 km gilt nicht als Tagesort-Fit.
  return Math.round(clamp01(1 - km / 25) * 1000) / 1000
}

function preisFit(preis: number | null, budget: number | null): number | null {
  if (preis === null || budget === null || budget <= 0) return null
  if (preis <= budget * 0.05) return 1
  if (preis >= budget) return 0.15
  return Math.round(clamp01(1 - preis / budget) * 1000) / 1000
}

export function activityKandidatenAnreichern(
  optionen: ActivityOption[],
  anfrage: ActivitySuchanfrage,
  bestehendeFenster: readonly Zeitfenster[],
  etappenPunkt: { lat: number; lon: number } | null,
): ActivityKandidat[] {
  return optionen.map((option) => {
    const konflikt = konfliktPruefen(
      timeslotAlsFenster(option.timeslot) ?? {
        startsOn: anfrage.dayDate,
        startsAt: null,
        endsOn: null,
        endsAt: null,
      },
      bestehendeFenster,
      anfrage.dayDate,
    )

    const context: ActivityKontext = {
      interessenFit: interessenFit(option, anfrage.interests),
      zeitFit:
        konflikt.konflikt === 'frei' ? 1 : konflikt.konflikt === 'ueberschneidung' ? 0 : null,
      konflikt: konflikt.konflikt,
      preisFit: preisFit(option.preis, anfrage.budgetAmount),
      dauerFit: dauerFit(option.dauerMinuten, anfrage.pace),
      lageFit: lageFit(option, etappenPunkt),
    }

    return { ...option, context }
  })
}
