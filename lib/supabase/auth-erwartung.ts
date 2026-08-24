// lib/supabase/auth-erwartung.ts
//
// Was `supabase/config.toml` über die Auth-Ebene sagt, in der Sprache der
// Supabase Management API.
//
// Phase 1.4 hat Schema, Rechte und Policies aus dem Repository nachvollziehbar
// gemacht. Die Auth-Ebene lag daneben: `config.toml` war der unveränderte
// Vorlagenstand der CLI und beschrieb weder Development noch Production. Diese
// Datei schliesst die Lücke – sie übersetzt die Datei in die Schlüssel, die
// `GET /v1/projects/{ref}/config/auth` liefert, damit sich Anspruch und
// Wirklichkeit vergleichen lassen (`npm run auth:pruefen`).
//
// Die Übersetzung ist nicht geraten. Sie folgt `pkg/config/auth.go` der
// Supabase CLI 2.114 – derselben Stelle, die `supabase config push` benutzt.
// Zwei Fallen stecken darin, die eine naheliegende Vermutung falsch machen:
// `auth.sessions.*` rechnet in **Stunden**, nicht in Sekunden, und
// `auth.rate_limit.sign_in_sign_ups` heisst auf der API-Seite
// `rate_limit_otp`, nicht `rate_limit_verify`.
//
// Bewusst frei von Netz und Dateisystem: Die Abbildung ist damit ohne
// Supabase-Zugang prüfbar und läuft in der CI mit.

import { tomlWert, type TomlTabelle, type TomlWert } from '@/lib/supabase/config-toml'
import { GEFORDERTE_GRUPPEN, PASSWORT_RICHTLINIE } from '@/lib/auth/passwort-richtlinie'

export type ApiWert = string | number | boolean

export type Erwartung = {
  /** Schlüssel in `GET /v1/projects/{ref}/config/auth`. */
  api: string
  wert: ApiWert
  /** Woher der Wert stammt – für die Ausgabe des Abgleichs. */
  quelle: string
  /** Nur bei Werten, die `config.toml` nicht ausdrücken kann. */
  grund?: string
}

/**
 * Eine Regel über eine ganze Schlüsselfamilie. Sie beantwortet die Frage, die
 * eine Aufzählung nicht beantworten kann: Ist etwas eingeschaltet, das niemand
 * eingeschaltet haben wollte?
 */
export type Musterregel = {
  name: string
  muster: RegExp
  erwartet: boolean
  grund: string
}

type Abbildung = {
  /** Pfad in `config.toml`, etwa `auth.email.enable_confirmations`. */
  toml: string
  api: string
  /** Übersetzt den TOML-Wert in den Wert der API, wenn beide sich unterscheiden. */
  wandel?: (wert: TomlWert) => ApiWert
}

/**
 * Die Zeichenmengen, die die API hinter `password_required_characters` führt.
 *
 * Der Wert ist keine Aufzählung, sondern die Liste der erlaubten Zeichen je
 * Gruppe, getrennt durch `:`. Nachgemessen auf dem Development-Branch: 98
 * Zeichen. Die Symbolgruppe enthält selbst einen Doppelpunkt – ein `split(':')`
 * auf dem Ergebnis zählt deshalb fünf Gruppen, nicht vier. Wer die Zahl der
 * Gruppen braucht, nimmt `ZEICHENGRUPPEN_ANZAHL`, nicht den Trenner.
 */
const KLEIN = 'abcdefghijklmnopqrstuvwxyz'
const GROSS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ZIFFERN = '0123456789'
const SYMBOLE = "!@#$%^&*()_+-=[]{};'\\\\:\"|<>?,./`~"

export const ZEICHENGRUPPEN: Record<string, string> = {
  '': '',
  letters_digits: [KLEIN + GROSS, ZIFFERN].join(':'),
  lower_upper_letters_digits: [KLEIN, GROSS, ZIFFERN].join(':'),
  lower_upper_letters_digits_symbols: [KLEIN, GROSS, ZIFFERN, SYMBOLE].join(':'),
}

export const ZEICHENGRUPPEN_ANZAHL: Record<string, number> = {
  '': 0,
  letters_digits: 2,
  lower_upper_letters_digits: 3,
  lower_upper_letters_digits_symbols: 4,
}

/** Wandelt `"1s"`, `"5m"`, `"2h"` in Sekunden; eine Zahl bleibt eine Zahl. */
export function inSekunden(wert: TomlWert): number {
  return dauer(wert)
}

/** Dasselbe in Stunden – so erwartet die API `sessions_*` (CLI: `.Hours()`). */
export function inStunden(wert: TomlWert): number {
  return dauer(wert) / 3600
}

function dauer(wert: TomlWert): number {
  if (typeof wert === 'number') return wert
  if (typeof wert !== 'string') throw new Error(`Dauer nicht lesbar: ${JSON.stringify(wert)}`)

  const treffer = /^(\d+)(s|m|h)$/.exec(wert.trim())
  if (!treffer) throw new Error(`Dauer nicht lesbar: ${wert}`)

  const zahl = Number(treffer[1])
  return treffer[2] === 's' ? zahl : treffer[2] === 'm' ? zahl * 60 : zahl * 3600
}

function nicht(wert: TomlWert): boolean {
  if (typeof wert !== 'boolean') throw new Error(`Wahrheitswert erwartet, gelesen: ${JSON.stringify(wert)}`)
  return !wert
}

/**
 * Die Abbildung. Jede Zeile ist eine Aussage über den Branch, und jede lässt
 * sich in beide Richtungen lesen: `config.toml` sagt es, die API zeigt es.
 */
export const AUTH_ABBILDUNG: Abbildung[] = [
  // Wohin Auth weiterleiten darf. Ohne diese beiden Werte landet jeder
  // Bestätigungs- und Rücksetzlink auf `site_url`, egal was die Anwendung als
  // `redirectTo` mitgibt.
  { toml: 'auth.site_url', api: 'site_url' },
  {
    toml: 'auth.additional_redirect_urls',
    api: 'uri_allow_list',
    wandel: (wert) => (Array.isArray(wert) ? wert.join(',') : String(wert)),
  },

  // Sitzungen und Token.
  { toml: 'auth.jwt_expiry', api: 'jwt_exp' },
  { toml: 'auth.enable_refresh_token_rotation', api: 'refresh_token_rotation_enabled' },
  { toml: 'auth.refresh_token_reuse_interval', api: 'security_refresh_token_reuse_interval' },
  { toml: 'auth.sessions.timebox', api: 'sessions_timebox', wandel: inStunden },
  { toml: 'auth.sessions.inactivity_timeout', api: 'sessions_inactivity_timeout', wandel: inStunden },

  // Wer sich anmelden darf.
  { toml: 'auth.enable_signup', api: 'disable_signup', wandel: nicht },
  { toml: 'auth.enable_anonymous_sign_ins', api: 'external_anonymous_users_enabled' },
  { toml: 'auth.enable_manual_linking', api: 'security_manual_linking_enabled' },
  { toml: 'auth.email.enable_signup', api: 'external_email_enabled' },
  { toml: 'auth.sms.enable_signup', api: 'external_phone_enabled' },
  { toml: 'auth.sms.enable_confirmations', api: 'sms_autoconfirm' },
  { toml: 'auth.passkey.enabled', api: 'passkey_enabled' },
  { toml: 'auth.web3.solana.enabled', api: 'external_web3_solana_enabled' },
  { toml: 'auth.web3.ethereum.enabled', api: 'external_web3_ethereum_enabled' },

  // Passwörter.
  { toml: 'auth.minimum_password_length', api: 'password_min_length' },
  {
    toml: 'auth.password_requirements',
    api: 'password_required_characters',
    wandel: (wert) => {
      const gruppen = ZEICHENGRUPPEN[String(wert)]
      if (gruppen === undefined) throw new Error(`password_requirements unbekannt: ${String(wert)}`)
      return gruppen
    },
  },
  { toml: 'auth.email.secure_password_change', api: 'security_update_password_require_reauthentication' },

  // E-Mail.
  { toml: 'auth.email.enable_confirmations', api: 'mailer_autoconfirm', wandel: nicht },
  { toml: 'auth.email.double_confirm_changes', api: 'mailer_secure_email_change_enabled' },
  { toml: 'auth.email.otp_length', api: 'mailer_otp_length' },
  { toml: 'auth.email.otp_expiry', api: 'mailer_otp_exp' },
  { toml: 'auth.email.max_frequency', api: 'smtp_max_frequency', wandel: inSekunden },

  // Zweiter Faktor.
  { toml: 'auth.mfa.max_enrolled_factors', api: 'mfa_max_enrolled_factors' },
  { toml: 'auth.mfa.totp.enroll_enabled', api: 'mfa_totp_enroll_enabled' },
  { toml: 'auth.mfa.totp.verify_enabled', api: 'mfa_totp_verify_enabled' },
  { toml: 'auth.mfa.phone.enroll_enabled', api: 'mfa_phone_enroll_enabled' },
  { toml: 'auth.mfa.phone.verify_enabled', api: 'mfa_phone_verify_enabled' },
  { toml: 'auth.mfa.phone.otp_length', api: 'mfa_phone_otp_length' },
  { toml: 'auth.mfa.phone.max_frequency', api: 'mfa_phone_max_frequency', wandel: inSekunden },
  { toml: 'auth.mfa.web_authn.enroll_enabled', api: 'mfa_web_authn_enroll_enabled' },
  { toml: 'auth.mfa.web_authn.verify_enabled', api: 'mfa_web_authn_verify_enabled' },

  // Missbrauchsschutz.
  { toml: 'auth.captcha.enabled', api: 'security_captcha_enabled' },
  { toml: 'auth.rate_limit.email_sent', api: 'rate_limit_email_sent' },
  { toml: 'auth.rate_limit.sms_sent', api: 'rate_limit_sms_sent' },
  { toml: 'auth.rate_limit.anonymous_users', api: 'rate_limit_anonymous_users' },
  { toml: 'auth.rate_limit.token_refresh', api: 'rate_limit_token_refresh' },
  { toml: 'auth.rate_limit.sign_in_sign_ups', api: 'rate_limit_otp' },
  { toml: 'auth.rate_limit.token_verifications', api: 'rate_limit_verify' },
  { toml: 'auth.rate_limit.web3', api: 'rate_limit_web3' },

  // SMS: aus, und die Vorlage bleibt stehen, damit die Prüfung sie sieht.
  { toml: 'auth.sms.max_frequency', api: 'sms_max_frequency', wandel: inSekunden },
  { toml: 'auth.sms.template', api: 'sms_template' },

  // Fremde Anmeldedienste. Die Oberfläche zeigt einen Anbieter nur, wenn
  // config.toml ihn explizit aktiviert. Beide Dienste sind auf dem Branch aus.
  { toml: 'auth.external.google.enabled', api: 'external_google_enabled' },
  { toml: 'auth.external.apple.enabled', api: 'external_apple_enabled' },
]

/**
 * Werte, die `config.toml` nicht ausdrücken kann.
 *
 * Für diese Schlüssel kennt die CLI-Konfiguration keinen Weg – geprüft an
 * `pkg/config/auth.go` der CLI 2.114. Sie stehen deshalb hier, jeder mit dem
 * Grund, warum er überhaupt geprüft wird. Ohne diese Liste wäre die
 * Konfiguration-als-Code unvollständig und der wichtigste Wert – der Schutz
 * vor kompromittierten Passwörtern – gerade nicht abgedeckt.
 */
export const OHNE_TOML_SCHLUESSEL: Erwartung[] = [
  {
    api: 'password_hibp_enabled',
    wert: true,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Schutz vor kompromittierten Passwörtern (HaveIBeenPwned). Production führt ihn, der Branch lag ' +
      'darunter; der Advisor auth_leaked_password_protection meldet die Lücke. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'mailer_allow_unverified_email_sign_ins',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Würde die E-Mail-Bestätigung aushebeln: ein unbestätigtes Konto könnte sich anmelden. ' +
      'Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'security_update_password_require_current_password',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Muss aus bleiben, solange der Weg über den Rücksetzlink führt: Wer sein Passwort vergessen hat, ' +
      'kann das alte nicht mitsenden. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'mfa_allow_low_aal',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Ein Konto mit zweitem Faktor darf nicht auf AAL1 stehen bleiben; sonst wäre die Einrichtung ' +
      'des Faktors folgenlos. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'sessions_single_per_user',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Reisen werden auf Telefon und Rechner geplant. Eine Sitzung je Konto würde die zweite ' +
      'unangekündigt beenden. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'security_sb_forwarded_for_enabled',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Liesse den Aufrufer seine eigene IP behaupten und damit die Ratenbegrenzung umgehen. ' +
      'Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'saml_enabled',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund: 'Kein Unternehmens-Login vorgesehen. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'oauth_server_enabled',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Jetnity ist kein OAuth-Anbieter für fremde Anwendungen. Der Abschnitt [auth.oauth_server] ' +
      'existiert in der CLI, überträgt aber nichts (auth.go: „implement me").',
  },
  {
    api: 'custom_oauth_enabled',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund: 'Gehört zum OAuth-Anbieter-Betrieb und ist aus demselben Grund aus. Kein CLI-Schlüssel vorhanden.',
  },
  {
    api: 'oauth_server_allow_dynamic_registration',
    wert: false,
    quelle: 'lib/supabase/auth-erwartung.ts',
    grund:
      'Würde fremden Anwendungen erlauben, sich selbst als Client zu registrieren. Kein CLI-Schlüssel vorhanden.',
  },
]

/**
 * Schlüssel, die bewusst nicht geprüft werden.
 *
 * Die Liste ist die Gegenprobe zur Vollständigkeit: `npm run auth:pruefen`
 * meldet jeden Schlüssel der API, der weder abgebildet noch hier genannt ist.
 * Ohne sie könnte ein neuer sicherheitsrelevanter Schalter auftauchen, ohne
 * dass jemand ihn bemerkt. Jeder Eintrag braucht einen Grund; „unwichtig"
 * genügt nicht.
 */
export const NICHT_GEPRUEFT: Record<string, string> = {
  api_max_request_duration: 'Betriebsgrösse der Plattform, keine Zugangsentscheidung.',
  audit_log_disable_postgres: 'Ablage des Audit-Logs, von Supabase je Branch gesetzt.',
  custom_oauth_max_providers: 'Obergrenze, wirkungslos solange custom_oauth_enabled aus ist.',
  db_max_pool_size: 'Verbindungsgrösse der Datenbank, keine Zugangsentscheidung.',
  db_max_pool_size_unit: 'Einheit zu db_max_pool_size.',
  index_worker_ensure_user_search_indexes_exist: 'Interner Wartungsschalter von Supabase.',
  jwt_secret: 'Secret. Wird nie mit einem Sollwert verglichen.',
  rate_limit_otp: 'Über auth.rate_limit.sign_in_sign_ups abgebildet.',
  sessions_tags: 'Ohne sessions_single_per_user ohne Wirkung.',
  sms_otp_exp: 'SMS ist aus (external_phone_enabled = false).',
  sms_otp_length: 'SMS ist aus.',
  sms_provider: 'SMS ist aus; der Anbieter ist ohne Zugangsdaten wirkungslos.',
  sms_test_otp: 'SMS ist aus.',
  sms_test_otp_valid_until: 'SMS ist aus.',
  saml_allow_encrypted_assertions: 'SAML ist aus.',
  saml_external_url: 'SAML ist aus.',
  security_captcha_provider: 'Ohne security_captcha_enabled ohne Wirkung.',
  smtp_max_frequency: 'Über auth.email.max_frequency abgebildet.',
  webauthn_rp_display_name: 'WebAuthn ist aus (mfa_web_authn_*_enabled = false).',
  webauthn_rp_id: 'WebAuthn ist aus.',
  webauthn_rp_origins: 'WebAuthn ist aus.',
}

/**
 * Muster, die auf den Wortanfang eines Schlüssels prüfen und ihn damit ohne
 * Aufzählung abdecken. Sie fangen genau das, was eine Liste nicht fängt: einen
 * Schalter, den es beim Schreiben der Liste noch nicht gab.
 */
export const ABGEDECKTE_MUSTER: { muster: RegExp; grund: string }[] = [
  { muster: /^external_.+_(client_id|secret|url|email_optional|additional_client_ids|skip_nonce_check)$/, grund: 'Zugangsdaten eines abgeschalteten Anmeldedienstes.' },
  { muster: /^hook_.+_(uri|secrets)$/, grund: 'Ziel eines abgeschalteten Hooks.' },
  { muster: /^mailer_(subjects|templates)_/, grund: 'Wortlaut einer E-Mail, keine Zugangsentscheidung.' },
  { muster: /^mailer_notifications_.+_enabled$/, grund: 'Benachrichtigung über ein Ereignis, keine Zugangsentscheidung.' },
  { muster: /^smtp_/, grund: 'Zugangsdaten des Mailversands; ohne eigenen Server unbenutzt.' },
  { muster: /^sms_(twilio|vonage|messagebird|textlocal)/, grund: 'Zugangsdaten eines SMS-Anbieters; SMS ist aus.' },
  { muster: /^mfa_phone_(otp_length|template|max_frequency)$/, grund: 'Ausgestaltung eines abgeschalteten zweiten Faktors.' },
  { muster: /^nimbus_oauth_/, grund: 'Gehört zum OAuth-Anbieter-Betrieb; aus.' },
  { muster: /^oauth_server_authorization_path$/, grund: 'Gehört zum OAuth-Anbieter-Betrieb; aus.' },
  { muster: /^security_captcha_secret$/, grund: 'Secret eines abgeschalteten Captcha.' },
]

/**
 * Nichts ist eingeschaltet, was niemand eingeschaltet hat.
 *
 * Eine Aufzählung deckt nur ab, was sie kennt. Diese Regeln decken ab, was
 * dazukommt: ein neuer Anmeldedienst, ein neuer Hook. Beides sind Wege in die
 * Anwendung hinein und dürfen nicht still entstehen.
 */
export function musterregeln(): Musterregel[] {
  return [
    {
      name: 'fremde Anmeldedienste',
      muster: /^external_.+_enabled$/,
      erwartet: false,
      grund:
        'Ein Anmeldedienst, den das Repository nicht nennt, ist ein Weg in die Anwendung, den niemand ' +
        'beschlossen hat. Erlaubt ist nur, was in config.toml steht.',
    },
    {
      name: 'Auth-Hooks',
      muster: /^hook_.+_enabled$/,
      erwartet: false,
      grund:
        'Ein Hook greift in die Anmeldung ein und ruft fremden Code. Keiner ist vorgesehen ' +
        '(config.toml lässt die Abschnitte auskommentiert).',
    },
  ]
}

/**
 * Baut die erwartete Auth-Konfiguration.
 *
 * `remote` ist der Name eines `[remotes.<name>]`-Blocks aus `config.toml`.
 * Jetnity führt heute keinen – der Parameter bleibt, weil die offizielle
 * Branch-Konfiguration darüber läuft und ein zweites Ziel genau hier
 * andocken würde (docs/AUTH.md).
 */
export function erwarteteAuthKonfiguration(config: TomlTabelle, remote?: string): Erwartung[] {
  const erwartungen: Erwartung[] = []

  for (const eintrag of AUTH_ABBILDUNG) {
    const remotePfad = remote ? `remotes.${remote}.${eintrag.toml}` : undefined
    const ausRemote = remotePfad ? tomlWert(config, remotePfad) : undefined
    const roh = ausRemote !== undefined ? ausRemote : tomlWert(config, eintrag.toml)

    if (roh === undefined) {
      throw new Error(`config.toml nennt ${eintrag.toml} nicht – die Abbildung erwartet den Wert`)
    }

    erwartungen.push({
      api: eintrag.api,
      wert: eintrag.wandel ? eintrag.wandel(roh) : (roh as ApiWert),
      quelle: `config.toml: ${ausRemote !== undefined ? remotePfad : eintrag.toml}`,
    })
  }

  return [...erwartungen, ...OHNE_TOML_SCHLUESSEL]
}

/**
 * Schlüssel der laufenden Konfiguration, die keine Aussage des Repositories
 * treffen – weder abgebildet, noch als API-Wert erwartet, noch von einer
 * Musterregel oder einem begründeten Verzicht gedeckt.
 *
 * Der Rückgabewert soll leer sein. Ist er es nicht, hat die API einen Schalter
 * bekommen, über den Jetnity noch nichts gesagt hat.
 */
export function unklassifizierteSchluessel(schluessel: string[], erwartungen: Erwartung[]): string[] {
  const genannt = new Set(erwartungen.map((e) => e.api))
  const regeln = musterregeln()

  return schluessel
    .filter((s) => !genannt.has(s))
    .filter((s) => !(s in NICHT_GEPRUEFT))
    .filter((s) => !regeln.some((r) => r.muster.test(s)))
    .filter((s) => !ABGEDECKTE_MUSTER.some((m) => m.muster.test(s)))
    .sort()
}

/**
 * Die Passwortregel, die die Formulare anzeigen, gegen die Konfiguration
 * geprüft.
 *
 * `RegisterForm` verlangt zwölf Zeichen aus vier Gruppen. Diese Zusage stammt
 * nicht aus dem Formular, sondern aus `config.toml`; sie hier zu vergleichen
 * verhindert, dass die Oberfläche etwas verspricht, das der Auth-Server nicht
 * verlangt – oder umgekehrt etwas ablehnt, das er annehmen würde.
 */
export function richtlinieStimmt(config: TomlTabelle, remote?: string): { stimmt: boolean; meldung?: string } {
  const laenge = tomlWert(config, remote ? `remotes.${remote}.auth.minimum_password_length` : 'auth.minimum_password_length')
    ?? tomlWert(config, 'auth.minimum_password_length')

  if (laenge !== PASSWORT_RICHTLINIE.mindestlaenge) {
    return {
      stimmt: false,
      meldung: `Mindestlänge: config.toml ${String(laenge)}, Oberfläche ${PASSWORT_RICHTLINIE.mindestlaenge}`,
    }
  }

  const anforderung = String(
    tomlWert(config, remote ? `remotes.${remote}.auth.password_requirements` : 'auth.password_requirements')
      ?? tomlWert(config, 'auth.password_requirements'),
  )
  const anzahl = ZEICHENGRUPPEN_ANZAHL[anforderung]

  if (anzahl === undefined) {
    return { stimmt: false, meldung: `password_requirements unbekannt: ${anforderung}` }
  }

  if (anzahl !== GEFORDERTE_GRUPPEN) {
    return {
      stimmt: false,
      meldung: `Zeichengruppen: config.toml ${anzahl}, Oberfläche ${GEFORDERTE_GRUPPEN}`,
    }
  }

  return { stimmt: true }
}
