// lib/admin/security-event-taxonomy.ts
//
// Eine Präsentations-Taxonomie für aufgezeichnete security_events-Typen.
// SecurityWidget und fasseSicherheitslageZusammen müssen dieselbe Regel
// verwenden (RH-10.1, RH-10.2). Das ist kein Producer und kein Beleg für
// vollständige Ingestion. Historische Typen bleiben lesbar. Neue Schreiber
// dürfen diese Namen nicht wiederverwenden.

const LOGIN_FEHLER_TYPEN = new Set(['auth_failed', 'login_failed'])
const AUFFAELLIGKEIT_EXAKT = new Set(['bot', 'suspicious', 'ddos'])

/**
 * Aufgezeichneter Login-Fehler.
 *
 * Exakt `auth_failed` oder historisch `login_failed`. Kein Substring `failed`,
 * damit ein beliebiger anderer Typ die Kennzahl nicht aufbläht.
 */
export function istAufgezeichneterLoginFehler(type: string | null | undefined): boolean {
  if (!type) return false
  return LOGIN_FEHLER_TYPEN.has(type)
}

/**
 * Aufgezeichnete Auffälligkeit.
 *
 * `anomaly*` wie der bisherige Aggregator, plus die historischen exakten Typen
 * `bot`, `suspicious` und `ddos`. Kein Regex-Substring.
 */
export function istAufgezeichneteAuffaelligkeit(type: string | null | undefined): boolean {
  if (!type) return false
  return type.startsWith('anomaly') || AUFFAELLIGKEIT_EXAKT.has(type)
}
