// lib/legal/privacybee-vertrag.ts
//
// PrivacyBee integration 1. Vendor-managed Datenschutzerklärung and Impressum.
// PrivacyBee owns the generated text. This module does not copy it, proxy a
// content API, or claim legal conformity.
//
// Activation: PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG is the reviewed default for the
// licensed host. The server kill switch PRIVACYBEE_KILL_SWITCH=aus turns the
// scripts off. A missing env value keeps the reviewed activation. No new
// secret and no Production env write is required for jetnity.com.
//
// Scripts are allowed only when that activation is on AND the request host is
// exactly jetnity.com. The browser host is checked again before insertion.

export const PRIVACYBEE_WEBSITE_ID = 'cmuj24t7p05512zwul6dghfhu'

/** Exact licensed browser/request host. Not www, not Preview, not localhost. */
export const PRIVACYBEE_LIZENZ_HOST = 'jetnity.com'

/**
 * Reviewed activation for this slice. Product Owner authorized the official
 * embeds on existing prelaunch jetnity.com without waiting for support.
 * Technical Lead merge is what publishes it. Flip to false to roll back in code.
 */
export const PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG = true

/** Server-only disable override. Not a NEXT_PUBLIC_ variable. */
export const PRIVACYBEE_KILL_SWITCH_ENV = 'PRIVACYBEE_KILL_SWITCH'

/** Trimmed exact value that disables vendor scripts. */
export const PRIVACYBEE_KILL_SWITCH_AUS = 'aus'

/** Official script URLs. No SRI: the vendor did not supply a hash and the files are mutable. */
export const PRIVACYBEE_DATENSCHUTZ_SKRIPT = 'https://app.privacybee.io/widget.js'
export const PRIVACYBEE_IMPRESSUM_SKRIPT = 'https://app.privacybee.io/imprint-widget.js'

/** Approved hosted privacy statement. Navigation target, not a copied policy. */
export const PRIVACYBEE_DATENSCHUTZ_URL =
  'https://app.privacybee.io/v/cmuj24t7p05512zwul6dghfhu?lang=de&type=dsgvo'

export const PRIVACYBEE_KONTAKT = 'info@jetnity.ch'

export const PRIVACYBEE_ELEMENT = {
  datenschutz: 'privacybee-widget',
  impressum: 'imprint-widget',
} as const

export type PrivacyBeeFlaeche = keyof typeof PRIVACYBEE_ELEMENT

/**
 * How long a licensed embed may stay on the vendor loading/empty signal
 * before Jetnity shows its own error and fallback. Script onload is not readiness.
 */
export const PRIVACYBEE_BEREITSCHAFT_MS = 12_000

/**
 * DOM signals read from the official widgets on 27 September 2026.
 * Both widgets are react-to-webcomponent builds. They render into the light DOM
 * (no shadow root). They do not use an iframe for the policy or imprint body.
 *
 * Privacy (`widget.js`) fetches its own payload and then:
 * - loading: a div whose text is exactly `Loading...`
 * - error: a paragraph, no h1, with one of the three German sentences below
 * - ready: an h1 beginning with the vendor heading
 *
 * Imprint (`imprint-widget.js`) waits 500ms, fetches, then:
 * - loading: text exactly `Wird geladen...`, no h1
 * - error: h1 `Fehler beim Laden des Impressums` plus a `p.prx_text`
 * - ready: h1 `Impressum` inside `div.prx_wrapper`
 *
 * These strings are readiness/error signals, not a substitute policy.
 */
export const PRIVACYBEE_LADE_TEXT: Record<PrivacyBeeFlaeche, string> = {
  datenschutz: 'Loading...',
  impressum: 'Wird geladen...',
}

export const PRIVACYBEE_FEHLER_TEXT: Record<PrivacyBeeFlaeche, readonly string[]> = {
  datenschutz: [
    'Das PrivacyBee Abonnement für diese Website ist leider nicht mehr gültig.',
    'Die Datenschutzerklärung konnte nicht gefunden werden',
    'Es gab ein Problem beim Laden der Datenschutzerklärung',
  ],
  impressum: [
    'Fehler beim Laden des Impressums',
    'Impressum konnte nicht geladen werden',
    'Netzwerkfehler - Impressum konnte nicht geladen werden',
    'Bitte füllen Sie alle Pflichtfelder im Impressum aus',
  ],
}

export const PRIVACYBEE_EIGENE_UEBERSCHRIFT: Record<PrivacyBeeFlaeche, string> = {
  datenschutz: 'Datenschutzerklärung',
  impressum: 'Impressum',
}

export const PRIVACYBEE_LADE_HINWEIS: Record<PrivacyBeeFlaeche, string> = {
  datenschutz: 'Die Datenschutzerklärung wird geladen.',
  impressum: 'Das Impressum wird geladen.',
}

export const PRIVACYBEE_FEHLER_HINWEIS: Record<PrivacyBeeFlaeche, string> = {
  datenschutz: 'Die Datenschutzerklärung konnte hier nicht angezeigt werden.',
  impressum: 'Das Impressum konnte hier nicht angezeigt werden.',
}

export const PRIVACYBEE_AUS_HINWEIS: Record<PrivacyBeeFlaeche, string> = {
  datenschutz:
    'Diese Seite übernimmt die Datenschutzerklärung nicht. Die Fassung von PrivacyBee steht unter dem folgenden Link.',
  impressum: 'Das Impressum ist hier gerade nicht verfügbar.',
}

export type PrivacyBeeDomLage = 'laden' | 'bereit' | 'fehler' | 'leer'

export type PrivacyBeeDomSchnappschuss = {
  text: string
  ueberschriften: readonly string[]
  /** Privacy error paragraph (`p.text-slate-900`) observed in widget.js. */
  hatDatenschutzFehlerAbsatz: boolean
  /** Imprint error paragraph (`p.prx_text`) observed in imprint-widget.js. */
  hatImpressumFehlerAbsatz: boolean
}

export function hostnameAusHostHeader(host: string | null | undefined): string | null {
  if (typeof host !== 'string') return null
  const roh = host.trim().toLowerCase()
  if (!roh || /[\s/@\\]/.test(roh) || roh.includes('/')) return null
  if (roh.startsWith('[')) {
    const ende = roh.indexOf(']')
    if (ende <= 1) return null
    return roh.slice(1, ende)
  }
  const erster = roh.indexOf(':')
  if (erster !== -1) {
    if (roh.indexOf(':', erster + 1) !== -1) return null
    const name = roh.slice(0, erster)
    const port = roh.slice(erster + 1)
    if (!name || !/^\d+$/.test(port)) return null
    return name
  }
  return roh
}

export function hostIstLizenziert(host: string | null | undefined): boolean {
  return hostnameAusHostHeader(host) === PRIVACYBEE_LIZENZ_HOST
}

/** `location.hostname` has no port. Exact licensed host only. */
export function browserHostIstLizenziert(hostname: string | null | undefined): boolean {
  if (typeof hostname !== 'string') return false
  return hostname.toLowerCase() === PRIVACYBEE_LIZENZ_HOST
}

/**
 * Missing, empty, or any value other than trimmed `aus` keeps `geprueft`.
 * `geprueft` defaults to the reviewed activation constant.
 */
export function privacyBeeAktivierungWirksam(
  killSwitch: string | null | undefined,
  geprueft: boolean = PRIVACYBEE_GEPRUEFTE_AKTIVIERUNG,
): boolean {
  if (!geprueft) return false
  if (typeof killSwitch === 'string' && killSwitch.trim() === PRIVACYBEE_KILL_SWITCH_AUS) return false
  return true
}

export function privacyBeeEinbettungErlaubt(input: {
  hostHeader: string | null
  killSwitch?: string | null
  geprueft?: boolean
}): boolean {
  return (
    privacyBeeAktivierungWirksam(input.killSwitch, input.geprueft) &&
    hostIstLizenziert(input.hostHeader)
  )
}

export type SkriptLage = {
  elementDefiniert: boolean
  skriptVorhanden: boolean
}

/** Second mount must not insert the official script again. */
export function skriptEinfuegen(lage: SkriptLage): boolean {
  return !lage.elementDefiniert && !lage.skriptVorhanden
}

export function privacyBeeSkriptFuer(flaeche: PrivacyBeeFlaeche): string {
  return flaeche === 'datenschutz' ? PRIVACYBEE_DATENSCHUTZ_SKRIPT : PRIVACYBEE_IMPRESSUM_SKRIPT
}

export function privacyBeeDomSignal(
  flaeche: PrivacyBeeFlaeche,
  schnappschuss: PrivacyBeeDomSchnappschuss,
): PrivacyBeeDomLage {
  const text = schnappschuss.text.replace(/\s+/g, ' ').trim()
  const titel = schnappschuss.ueberschriften
    .map((eintrag) => eintrag.replace(/\s+/g, ' ').trim())
    .filter((eintrag) => eintrag.length > 0)

  if (!text && titel.length === 0) return 'leer'
  if (text === PRIVACYBEE_LADE_TEXT[flaeche]) return 'laden'

  if (PRIVACYBEE_FEHLER_TEXT[flaeche].some((muster) => text.includes(muster))) return 'fehler'

  if (
    flaeche === 'datenschutz' &&
    schnappschuss.hatDatenschutzFehlerAbsatz &&
    titel.length === 0
  ) {
    return 'fehler'
  }

  if (flaeche === 'impressum' && schnappschuss.hatImpressumFehlerAbsatz && titel.length === 0) {
    return 'fehler'
  }

  if (titel.length > 0) return 'bereit'

  // Substantial body without a heading is still vendor content, not an empty success.
  if (text.length >= 240) return 'bereit'

  return 'laden'
}
