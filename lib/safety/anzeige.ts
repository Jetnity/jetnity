// lib/safety/anzeige.ts
//
// Semantische Texte. Warnstufe niemals nur über Farbe.

import type {
  SafetyEventCategory,
  SafetyFreshness,
  SafetyNextAction,
  SafetyPresentationClass,
  SafetyRelevance,
} from '@/lib/safety/domain'
import type { SafetySummary } from '@/lib/safety/status'

export const SAFETY_KLASSE_TEXT: Record<SafetyPresentationClass, string> = {
  critical_warning: 'Kritische Warnung',
  important_notice: 'Wichtiger Reisehinweis',
  information: 'Information',
  unknown: 'Lage unklar',
}

export const SAFETY_KATEGORIE_TEXT: Record<SafetyEventCategory, string> = {
  armed_conflict: 'Bewaffneter Konflikt',
  civil_unrest: 'Schwere Unruhen',
  earthquake: 'Erdbeben',
  tsunami: 'Tsunami',
  volcanic_activity: 'Vulkanaktivität',
  flood: 'Hochwasser',
  wildfire: 'Waldbrand oder Rauch',
  tropical_cyclone: 'Wirbelsturm',
  infrastructure_disruption: 'Infrastrukturstörung',
  other: 'Reisebeeinträchtigung',
  unknown: 'Unklare Ereignisart',
}

export const SAFETY_AKTION_TEXT: Record<SafetyNextAction, string> = {
  check_stage: 'Betroffene Etappe prüfen',
  check_route: 'Route und Transit prüfen',
  check_accommodation: 'Unterkunft prüfen',
  check_activity: 'Aktivitäten prüfen',
  check_mobility: 'Transfer oder Mietwagen prüfen',
  check_readiness: 'Reisevorbereitung prüfen',
  observe: 'Lage beobachten, Reise nicht still ändern',
}

export const SAFETY_RELEVANZ_TEXT: Record<SafetyRelevance, string> = {
  affected: 'Betrifft diese Reise',
  not_affected: 'Betrifft diese Reise nicht',
  insufficient_context: 'Zuordnung unklar, bitte prüfen',
  unknown: 'Relevanz unklar',
}

export const SAFETY_FRISCHE_TEXT: Record<SafetyFreshness, string> = {
  never_checked: 'Noch nicht geprüft',
  current: 'Aktuell',
  recheck_needed: 'Erneut prüfen',
  stale: 'Veraltet',
  provider_unavailable: 'Quelle nicht aktiv',
  source_temporarily_unavailable: 'Quelle vorübergehend nicht erreichbar',
}

export function safetyZusammenfassungText(summary: SafetySummary): string {
  const warnungen = summary.critical + summary.important + summary.information
  if (summary.checkState === 'unavailable' && warnungen === 0) {
    return 'Sicherheitshinweise können derzeit nicht geprüft werden. Das ist keine Entwarnung.'
  }
  if (summary.checkState === 'unknown' && warnungen === 0) {
    return 'Die Sicherheitslage für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Entwarnung.'
  }
  if (summary.critical > 0) {
    const text = `${summary.critical === 1 ? 'Eine kritische Warnung' : `${summary.critical} kritische Warnungen`} betrifft diese Reise.`
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.important > 0) {
    const text = `${summary.important === 1 ? 'Ein wichtiger Reisehinweis' : `${summary.important} wichtige Reisehinweise`} sollte geprüft werden.`
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.information > 0) {
    const text = 'Es gibt beobachtenswerte Hinweise ohne belastbare stärkere Warnung.'
    return summary.complete ? text : `${text} Die Prüfung ist unvollständig.`
  }
  if (summary.checkState === 'checked_clean') {
    return 'Keine aktuelle Safety-Warnung für den geprüften Reiseausschnitt.'
  }
  return 'Die Sicherheitslage für diese Reise ist derzeit nicht belastbar prüfbar. Das ist keine Entwarnung.'
}
