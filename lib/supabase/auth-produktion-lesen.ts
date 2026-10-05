// lib/supabase/auth-produktion-lesen.ts
//
// Phase-A-Nachweis für Production Auth: aus einer GET-Antwort nur die
// ausdrücklich freigegebenen Audit-Felder behalten. Rein, ohne Netz.
//
// Die Management-API liefert dieselbe Antwort, in der auch jwt_secret,
// SMTP-Zugangsdaten und Captcha-Secrets stehen. Deshalb darf die Ausgabe
// niemals die Rohantwort oder einen unbekannten Schlüssel weitergeben.
// Unvollständige Evidenz ist kein PASS: fehlt ein Pflichtfeld, bricht der
// Leser ab.

export const BESTAETIGTES_PRODUCTION_PROJEKT = 'qscbgcdmivbbnzrcyegn'

/**
 * Pflichtfelder für Audit 3.3 / 3.6 / 3.7. Alle sind nicht-geheim.
 *
 * 3.6 Redirect: site_url, uri_allow_list
 * 3.7 Rate-Limit / HIBP: password_hibp_enabled, rate_limit_*
 * 3.3 MFA/AAL: mfa_totp_*, mfa_allow_low_aal
 * mailer_allow_unverified_email_sign_ins steht auf der Task-Allowlist,
 * weil ein unverifiziertes Login die übrige Auth-Aussage entwerten würde.
 */
export const PRODUCTION_AUTH_AUDIT_FELDER = [
  'site_url',
  'uri_allow_list',
  'password_hibp_enabled',
  'rate_limit_email_sent',
  'rate_limit_otp',
  'rate_limit_verify',
  'rate_limit_token_refresh',
  'mfa_totp_enroll_enabled',
  'mfa_totp_verify_enabled',
  'mfa_allow_low_aal',
  'mailer_allow_unverified_email_sign_ins',
] as const

export type ProductionAuthAuditFeld = (typeof PRODUCTION_AUTH_AUDIT_FELDER)[number]
export type ProductionAuthAuditWert = string | number | boolean
export type ProductionAuthSnapshot = Record<ProductionAuthAuditFeld, ProductionAuthAuditWert>

const ERLAUBTE_FLAGS = new Set(['--produktion', '--projekt-ref'])

export function produktionLesenAuftrag(
  argv: readonly string[],
  umgebung: { SUPABASE_ACCESS_TOKEN?: string; SUPABASE_PROJECT_REF?: string },
): { bestaetigterRef: typeof BESTAETIGTES_PRODUCTION_PROJEKT } {
  for (const teil of argv) {
    if (!teil.startsWith('--')) continue
    if (!ERLAUBTE_FLAGS.has(teil)) {
      throw new Error(`Unbekanntes Argument ${teil}. Dieser Leser ist GET-only. Abgebrochen.`)
    }
  }

  if (!argv.includes('--produktion')) {
    throw new Error(
      'Production-Lesen braucht --produktion --projekt-ref qscbgcdmivbbnzrcyegn.',
    )
  }

  const i = argv.indexOf('--projekt-ref')
  const ref = i >= 0 ? argv[i + 1] : undefined
  if (!ref || ref.startsWith('--')) {
    throw new Error('Production-Lesen braucht --projekt-ref qscbgcdmivbbnzrcyegn.')
  }
  if (ref !== BESTAETIGTES_PRODUCTION_PROJEKT) {
    throw new Error('Nur das bestätigte Production-Projekt darf gelesen werden. Abgebrochen.')
  }

  if (!umgebung.SUPABASE_ACCESS_TOKEN) {
    throw new Error('SUPABASE_ACCESS_TOKEN fehlt')
  }
  if (!umgebung.SUPABASE_PROJECT_REF) {
    throw new Error('SUPABASE_PROJECT_REF fehlt')
  }
  if (umgebung.SUPABASE_PROJECT_REF !== BESTAETIGTES_PRODUCTION_PROJEKT) {
    throw new Error(
      'Der bestätigte --projekt-ref stimmt nicht mit SUPABASE_PROJECT_REF überein. Abgebrochen.',
    )
  }

  return { bestaetigterRef: BESTAETIGTES_PRODUCTION_PROJEKT }
}

function normalisiereAuditWert(feld: string, wert: unknown): ProductionAuthAuditWert {
  if (typeof wert === 'string' || typeof wert === 'number' || typeof wert === 'boolean') {
    return wert
  }
  if (Array.isArray(wert) && wert.every((eintrag) => typeof eintrag === 'string' || typeof eintrag === 'number')) {
    return wert.map(String).join(',')
  }
  throw new Error(`Production-Auth-Feld ${feld} hat keinen sicheren skalaren Wert. Abgebrochen.`)
}

export function productionAuthSnapshotAusKonfiguration(
  live: Record<string, unknown>,
): ProductionAuthSnapshot {
  const fehlend: string[] = []
  const snapshot = {} as ProductionAuthSnapshot

  for (const feld of PRODUCTION_AUTH_AUDIT_FELDER) {
    if (!Object.prototype.hasOwnProperty.call(live, feld) || live[feld] === undefined || live[feld] === null) {
      fehlend.push(feld)
      continue
    }
    snapshot[feld] = normalisiereAuditWert(feld, live[feld])
  }

  if (fehlend.length > 0) {
    throw new Error(
      `Production-Auth-Nachweis unvollständig. Fehlende Felder: ${fehlend.join(', ')}. Kein PASS.`,
    )
  }

  return snapshot
}

/** Nur Allowlist-Schlüssel, in fester Reihenfolge. Keine Rohantwort. */
export function productionAuthSnapshotText(snapshot: ProductionAuthSnapshot): string {
  const json = JSON.stringify(snapshot, [...PRODUCTION_AUTH_AUDIT_FELDER], 2)
  return [
    'JETNITY_PRODUCTION_AUTH_SNAPSHOT_BEGIN',
    `target_project_ref=${BESTAETIGTES_PRODUCTION_PROJEKT}`,
    'method=GET',
    'fields=allowlist',
    json,
    'JETNITY_PRODUCTION_AUTH_SNAPSHOT_END',
  ].join('\n')
}
