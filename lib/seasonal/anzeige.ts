// lib/seasonal/anzeige.ts
//
// Ruhige Seasonal-Copy. Keine Safety-Wörter, keine erfundenen Wahrscheinlichkeiten.

import type {
  SeasonalCategory,
  SeasonalFreshness,
  SeasonalNextAction,
  SeasonalPresentationClass,
  SeasonalRelevance,
} from '@/lib/seasonal/domain'
import type { SeasonalSummary } from '@/lib/seasonal/status'

export const SEASONAL_KLASSE_TEXT: Record<SeasonalPresentationClass, string> = {
  timing_check: 'Reisezeit prüfen',
  timing_notice: 'Saisonaler Hinweis',
  information: 'Saisonaler Kontext',
  unknown: 'Reisezeit unklar',
}

export const SEASONAL_KATEGORIE_TEXT: Record<SeasonalCategory, string> = {
  heavy_rain: 'stärkere Regenzeit',
  monsoon: 'Monsunzeit',
  tropical_cyclone_season: 'Hurrikan- oder Zyklonsaison',
  heat: 'ausgeprägte Hitzeperiode',
  cold: 'kalte Winterbedingungen',
  wildfire_smoke: 'Waldbrand- oder Rauchsaison',
  flood: 'Hochwasser- oder Starkregenperiode',
  snow_avalanche: 'saisonales Schnee- oder Lawinenrisiko',
  seasonal_access: 'saisonale Erreichbarkeit',
  other: 'saisonaler Reisekontext',
  unknown: 'unklarer saisonaler Kontext',
}

export const SEASONAL_AKTION_TEXT: Record<SeasonalNextAction, string> = {
  review_timing: 'Reisezeit und Auswirkungen prüfen',
  check_stage: 'Betroffene Etappe prüfen',
  check_route: 'Route und Transit prüfen',
  check_activity: 'Aktivitäten und Outdoor-Plan prüfen',
  check_mobility: 'Transfer, Fähre oder Mietwagen prüfen',
  observe: 'Kontext merken, Reise nicht still ändern',
}

export const SEASONAL_RELEVANZ_TEXT: Record<SeasonalRelevance, string> = {
  applies: 'Betrifft diesen Reisezeitraum typischerweise',
  not_applies: 'Betrifft diesen Reisezeitraum nicht',
  insufficient_context: 'Zuordnung unklar, bitte prüfen',
  unknown: 'Relevanz unklar',
}

export const SEASONAL_FRISCHE_TEXT: Record<SeasonalFreshness, string> = {
  never_checked: 'Noch nicht geprüft',
  current: 'Aktuell im geprüften Quellenvertrag',
  recheck_needed: 'Erneut prüfen',
  stale: 'Veraltet',
  provider_unavailable: 'Quelle nicht aktiv',
  source_temporarily_unavailable: 'Quelle vorübergehend nicht erreichbar',
}

export function seasonalZusammenfassungText(summary: SeasonalSummary): string {
  const hinweise = summary.timingCheck + summary.timingNotice + summary.information
  if (summary.checkState === 'unavailable' && hinweise === 0) {
    return 'Saisonale Hinweise können derzeit nicht geprüft werden. Das ist keine Aussage über eine gute Reisezeit.'
  }
  if (summary.checkState === 'unknown' && hinweise === 0) {
    return 'Der saisonale Kontext für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Aussage über eine gute Reisezeit.'
  }
  if (summary.timingCheck > 0) {
    const text =
      summary.timingCheck === 1
        ? 'Dein Aufenthalt fällt in dieser Region typischerweise in eine deutlich ungünstigere Saisonlage. Das muss die Reise nicht ausschliessen, kann sie aber beeinflussen.'
        : 'Mehrere saisonale Hinweise betreffen typischerweise diesen Reisezeitraum und können die Reise beeinflussen.'
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.timingNotice > 0) {
    const text = 'Für diesen Zeitraum gibt es typische saisonale Trade-offs. Die Entscheidung bleibt bei dir.'
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.information > 0) {
    const text = 'Es gibt beobachtenswerten saisonalen Kontext ohne belastbaren Nachteil.'
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.checkState === 'checked_empty') {
    return 'Im geprüften Ausschnitt wurden keine belastbaren relevanten saisonalen Hinweise geliefert. Das ist keine Aussage, dass die Reisezeit optimal ist.'
  }
  return 'Der saisonale Kontext für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Aussage über eine gute Reisezeit.'
}
