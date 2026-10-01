// lib/readiness/official-truth-candidate-batch.ts
//
// Strukturelle und Provenienz-Prüfung für Forschungs-Chargen.
// Eine bestandene Charge ist nur für eine spätere menschliche oder
// systemische Prüfung geformt. Sie ist keine akzeptierte Evidence,
// keine Official Truth und keine Datenbankfreigabe.
//
// Kein Netz, kein Modell, kein Provider, kein Supabase, kein SQL.

import { landescodeLesen } from '@/lib/readiness/domain'
import { checkedAtLesen } from '@/lib/readiness/official'
import { REGEL_EVIDENCE_QUALITAETEN, type RegelEvidenceQualitaet } from '@/lib/readiness/rule-claims'
import { TRAVELLER_DOCUMENT_TYPES, type TravellerDocumentType } from '@/types/trips'

export const KANDIDATEN_CHARGE_FORSCHUNG = 'RESEARCH_ONLY' as const
export const KANDIDATEN_CHARGE_DATENBANK = 'NOT_APPROVED_FOR_DATABASE_IMPORT' as const

const ZIELE_MAX = 32
const QUELLEN_MAX = 8
const TIEFE_MAX = 8
const LISTE_MAX = 64
const URL_MIN = 12
const URL_MAX = 500

const CHARGE_SCHLUESSEL = [
  'researchStatus',
  'databaseImportStatus',
  'citizenshipCountryCode',
  'documentType',
  'destinations',
] as const

const EINTRAG_SCHLUESSEL = [
  'destinationCountryCode',
  'evidenceQuality',
  'officialSourceUrl',
  'additionalOfficialSourceUrl',
  'officialActionLink',
  'retrievedAt',
  'validFrom',
  'validUntil',
] as const

const EXPLIZITES_DOKUMENT = ['passport', 'national_id'] as const
type ExplizitesDokument = (typeof EXPLIZITES_DOKUMENT)[number]

const BELEGTE_QUALITAET = ['explicit_primary_statement', 'composed_from_multiple_primary_sources'] as const

/**
 * Persönliche Schlüssel, die eine globale Forschungs-Charge nicht tragen darf.
 * Die normalisierte Form deckt Groß-/Kleinschreibung und Trennzeichen ab.
 * `image`, `face`, `fingerprint`, `vaccination` und `travellerName` ergänzen
 * die bestehende Kennungsmenge aus dem Evidence-/Claim-Vertrag.
 */
const SENSIBEL_EXAKT = new Set([
  'passportnumber',
  'documentnumber',
  'mrz',
  'passportscan',
  'documentscan',
  'image',
  'images',
  'scan',
  'scans',
  'biometric',
  'biometrics',
  'face',
  'fingerprint',
  'fingerprints',
  'health',
  'healthrecord',
  'vaccination',
  'vaccinationrecord',
  'diagnosis',
  'birthdate',
  'dateofbirth',
  'dob',
  'travellername',
  'travelername',
  'fullname',
  'givenname',
  'familyname',
  'email',
  'emailaddress',
  'accountid',
  'userid',
  'tripid',
  'travellerid',
  'travellerclientref',
  'phone',
])

const SENSIBEL_ENTHAELT = [
  'passportnumber',
  'documentnumber',
  'passportscan',
  'documentscan',
  'biometric',
  'fingerprint',
  'healthrecord',
  'vaccinationrecord',
  'birthdate',
  'dateofbirth',
  'travellername',
  'travelername',
  'fullname',
  'givenname',
  'familyname',
  'emailaddress',
  'accountid',
  'userid',
  'travellerclientref',
  'mrz',
] as const

const VERBOTENE_ANSPRUECHE = new Set([
  'approved',
  'importready',
  'officialtruth',
  'approvedfordatabaseimport',
  'databaseimportauthorized',
  'databaseimportauthorization',
  'accepted',
])

const HERLEITUNG = new Set([
  'residence',
  'residencecountrycode',
  'issuer',
  'issuingcountry',
  'issuingcountrycode',
  'issuercountrycode',
])

export type KandidatenChargeFehler =
  | 'invalid_batch'
  | 'invalid_validation_clock'
  | 'input_too_deep'
  | 'input_too_large'
  | 'sensitive_personal_field'
  | 'forbidden_claim'
  | 'citizenship_not_derivable'
  | 'unexpected_field'
  | 'research_status_required'
  | 'research_status_invalid'
  | 'database_import_status_required'
  | 'database_import_status_invalid'
  | 'citizenship_required'
  | 'invalid_country_code'
  | 'document_type_required'
  | 'document_type_not_explicit'
  | 'invalid_document_type'
  | 'destinations_required'
  | 'destinations_limit'
  | 'invalid_destination'
  | 'field_required'
  | 'invalid_evidence_quality'
  | 'insufficient_official_sources'
  | 'duplicate_official_source'
  | 'official_sources_limit'
  | 'invalid_url'
  | 'tracking_parameter'
  | 'invalid_action_link'
  | 'retrieved_at_required'
  | 'invalid_retrieved_at'
  | 'retrieved_at_in_future'
  | 'invalid_validity'
  | 'validity_order'
  | 'research_gap_not_required_forbidden'
  | 'conflict_resolved_forbidden'
  | 'stale_as_current_forbidden'

export type KandidatenChargeBefund = {
  code: KandidatenChargeFehler
  path: string
}

export type KandidatenChargeEintrag = {
  destinationCountryCode: string
  evidenceQuality: RegelEvidenceQualitaet
  supportingOfficialSourceUrls: readonly string[]
  officialActionLink: string | null
  retrievedAt: string | null
  validFrom: string | null
  validUntil: string | null
  promotion: 'not_performed'
  truthDisposition: 'review_only' | 'not_importable_truth'
}

export type KandidatenChargeErfolg = {
  ok: true
  researchStatus: typeof KANDIDATEN_CHARGE_FORSCHUNG
  databaseImportStatus: typeof KANDIDATEN_CHARGE_DATENBANK
  citizenshipCountryCode: string
  documentType: ExplizitesDokument
  destinations: readonly KandidatenChargeEintrag[]
  findings: readonly []
}

export type KandidatenChargeErgebnis =
  | KandidatenChargeErfolg
  | {
      ok: false
      findings: readonly KandidatenChargeBefund[]
    }

export type KandidatenChargeUhr = () => Date

type Befundliste = {
  melden(code: KandidatenChargeFehler, path: string): void
  liste(): readonly KandidatenChargeBefund[]
}

function norm(wert: string): string {
  return wert.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function datensatz(wert: unknown): Record<string, unknown> | null {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  return wert as Record<string, unknown>
}

function befunde(): Befundliste {
  const gesehen = new Set<string>()
  const liste: KandidatenChargeBefund[] = []
  return {
    melden(code, path) {
      const schluessel = `${code}\u0000${path}`
      if (gesehen.has(schluessel)) return
      gesehen.add(schluessel)
      liste.push({ code, path })
    },
    liste() {
      return liste.sort((links, rechts) =>
        links.path < rechts.path ? -1 : links.path > rechts.path ? 1 : links.code < rechts.code ? -1 : links.code > rechts.code ? 1 : 0,
      )
    },
  }
}

function sensibel(schluessel: string): boolean {
  const name = norm(schluessel)
  if (!name) return false
  if (SENSIBEL_EXAKT.has(name)) return true
  if (SENSIBEL_ENTHAELT.some((teil) => name.includes(teil))) return true
  if (name.includes('email')) return true
  return (
    name.endsWith('image') ||
    name.endsWith('images') ||
    name.endsWith('scan') ||
    name.endsWith('scans') ||
    name.startsWith('face') ||
    name.endsWith('face')
  )
}

function anspruch(wert: string): boolean {
  return VERBOTENE_ANSPRUECHE.has(norm(wert))
}

function schaltjahr(jahr: number): boolean {
  return (jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0
}

function kalenderdatum(jahr: number, monat: number, tag: number): boolean {
  if (monat < 1 || monat > 12 || tag < 1) return false
  const laenge = [0, 31, schaltjahr(jahr) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return tag <= (laenge[monat] ?? 0)
}

function uhrzeit(stunde: number, minute: number, sekunde: number): boolean {
  return stunde <= 23 && minute <= 59 && sekunde <= 59
}

function zahl(wert: string): number {
  return Number(wert)
}

/**
 * Dieselbe Instant-Form wie `checkedAtLesen`, ohne Zuschneiden und ohne
 * stilles Umschreiben auf `Z`. Ein Kalenderüberlauf bleibt ungültig.
 */
function instantLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  if (checkedAtLesen(wert) !== wert) return null
  const teile = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/.exec(wert)
  if (!teile) return null
  const jahr = zahl(teile[1] ?? '')
  const monat = zahl(teile[2] ?? '')
  const tag = zahl(teile[3] ?? '')
  const stunde = zahl(teile[4] ?? '')
  const minute = zahl(teile[5] ?? '')
  const sekunde = zahl(teile[6] ?? '')
  if (!kalenderdatum(jahr, monat, tag) || !uhrzeit(stunde, minute, sekunde)) return null
  return wert
}

function datumLesen(wert: unknown): string | null | 'invalid' {
  if (wert === null) return null
  if (typeof wert !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return 'invalid'
  const teile = /^(\d{4})-(\d{2})-(\d{2})$/.exec(wert)
  if (!teile || !kalenderdatum(zahl(teile[1] ?? ''), zahl(teile[2] ?? ''), zahl(teile[3] ?? ''))) return 'invalid'
  return wert
}

type UrlLesen =
  | { ok: true; url: string }
  | { ok: false; reason: 'invalid_url' | 'tracking_parameter' }

/**
 * Absolute HTTPS-URL ohne Umschreiben.
 * `quelleUrlLesen` kanonisiert über `URL.toString()` und würde die geschriebene
 * Autorität verändern. Hier bleibt die Eingabe stehen oder sie scheitert.
 * Ein Query-Name mit Präfix `utm_` scheitert. Eine weitere Tracking-Liste ist
 * in den Official-Truth-Forschungskonventionen nicht dokumentiert.
 */
function urlLesen(wert: unknown): UrlLesen {
  if (typeof wert !== 'string') return { ok: false, reason: 'invalid_url' }
  if (wert.length < URL_MIN || wert.length > URL_MAX) return { ok: false, reason: 'invalid_url' }
  if (!wert.startsWith('https://')) return { ok: false, reason: 'invalid_url' }
  if (/[\s\u0000-\u001f\\]/.test(wert)) return { ok: false, reason: 'invalid_url' }
  let gelesen: URL
  try {
    gelesen = new URL(wert)
  } catch {
    return { ok: false, reason: 'invalid_url' }
  }
  if (gelesen.protocol !== 'https:' || gelesen.username || gelesen.password) return { ok: false, reason: 'invalid_url' }
  const host = gelesen.hostname
  if (!host || host === 'localhost' || host.endsWith('.local')) return { ok: false, reason: 'invalid_url' }
  for (const name of gelesen.searchParams.keys()) {
    if (name.toLowerCase().startsWith('utm_')) return { ok: false, reason: 'tracking_parameter' }
  }
  return { ok: true, url: wert }
}

function privatsphaere(wert: unknown, path: string, tiefe: number, zyklus: WeakSet<object>, bericht: Befundliste): void {
  if (tiefe > TIEFE_MAX) {
    bericht.melden('input_too_deep', path || '$')
    return
  }
  if (Array.isArray(wert)) {
    if (wert.length > LISTE_MAX) {
      bericht.melden('input_too_large', path || '$')
      return
    }
    wert.forEach((eintrag, index) => privatsphaere(eintrag, `${path}[${index}]`, tiefe + 1, zyklus, bericht))
    return
  }
  if (!wert || typeof wert !== 'object') {
    if (typeof wert === 'string' && anspruch(wert)) bericht.melden('forbidden_claim', path || '$')
    return
  }
  if (zyklus.has(wert)) {
    bericht.melden('invalid_batch', path || '$')
    return
  }
  zyklus.add(wert)
  for (const [schluessel, kind] of Object.entries(wert as Record<string, unknown>)) {
    const hier = path ? `${path}.${schluessel}` : schluessel
    if (sensibel(schluessel)) bericht.melden('sensitive_personal_field', hier)
    else if (anspruch(schluessel)) bericht.melden('forbidden_claim', hier)
    else if (HERLEITUNG.has(norm(schluessel))) bericht.melden('citizenship_not_derivable', hier)
    privatsphaere(kind, hier, tiefe + 1, zyklus, bericht)
  }
}

function qualitaetLesen(wert: unknown): RegelEvidenceQualitaet | null {
  return typeof wert === 'string' && (REGEL_EVIDENCE_QUALITAETEN as readonly string[]).includes(wert)
    ? (wert as RegelEvidenceQualitaet)
    : null
}

function dokumentLesen(wert: unknown): ExplizitesDokument | null {
  return typeof wert === 'string' && (EXPLIZITES_DOKUMENT as readonly string[]).includes(wert) ? (wert as ExplizitesDokument) : null
}

function belegt(qualitaet: RegelEvidenceQualitaet): boolean {
  return (BELEGTE_QUALITAET as readonly string[]).includes(qualitaet)
}

function lage(qualitaet: RegelEvidenceQualitaet): KandidatenChargeEintrag['truthDisposition'] {
  return belegt(qualitaet) ? 'review_only' : 'not_importable_truth'
}

function mindestQuellen(qualitaet: RegelEvidenceQualitaet): number {
  if (qualitaet === 'composed_from_multiple_primary_sources') return 2
  if (qualitaet === 'explicit_primary_statement' || qualitaet === 'stale_primary_evidence') return 1
  return 0
}

function abrufNoetig(qualitaet: RegelEvidenceQualitaet, quellen: number): boolean {
  if (qualitaet === 'research_gap') return quellen > 0
  return true
}

function verbotenerWert(qualitaet: RegelEvidenceQualitaet, wert: string): KandidatenChargeFehler | null {
  const name = norm(wert)
  if (qualitaet === 'research_gap' && name === 'notrequired') return 'research_gap_not_required_forbidden'
  if (qualitaet === 'unresolved_conflict' && name === 'resolved') return 'conflict_resolved_forbidden'
  if (qualitaet === 'stale_primary_evidence' && name === 'current') return 'stale_as_current_forbidden'
  return null
}

function verbotenerSchluessel(qualitaet: RegelEvidenceQualitaet, schluessel: string): KandidatenChargeFehler | null {
  const name = norm(schluessel)
  if (qualitaet === 'research_gap' && name === 'notrequired') return 'research_gap_not_required_forbidden'
  if (qualitaet === 'unresolved_conflict' && (name === 'resolved' || name === 'resolution')) return 'conflict_resolved_forbidden'
  if (qualitaet === 'stale_primary_evidence' && name === 'current') return 'stale_as_current_forbidden'
  return null
}

function werteDerQualitaet(
  wert: unknown,
  path: string,
  qualitaet: RegelEvidenceQualitaet,
  tiefe: number,
  zyklus: WeakSet<object>,
  bericht: Befundliste,
): void {
  if (tiefe > TIEFE_MAX) return
  if (typeof wert === 'string') {
    const verstoss = verbotenerWert(qualitaet, wert)
    if (verstoss) bericht.melden(verstoss, path || '$')
    return
  }
  if (Array.isArray(wert)) {
    wert.forEach((eintrag, index) => werteDerQualitaet(eintrag, `${path}[${index}]`, qualitaet, tiefe + 1, zyklus, bericht))
    return
  }
  if (!wert || typeof wert !== 'object' || zyklus.has(wert)) return
  zyklus.add(wert)
  for (const [schluessel, kind] of Object.entries(wert as Record<string, unknown>)) {
    const hier = path ? `${path}.${schluessel}` : schluessel
    const verstoss = verbotenerSchluessel(qualitaet, schluessel)
    if (verstoss) bericht.melden(verstoss, hier)
    werteDerQualitaet(kind, hier, qualitaet, tiefe + 1, zyklus, bericht)
  }
}

function uhrLesen(uhr: KandidatenChargeUhr, bericht: Befundliste): number | null {
  if (typeof uhr !== 'function') {
    bericht.melden('invalid_validation_clock', '$uhr')
    return null
  }
  let instant: Date
  try {
    instant = uhr()
  } catch {
    bericht.melden('invalid_validation_clock', '$uhr')
    return null
  }
  if (!(instant instanceof Date)) {
    bericht.melden('invalid_validation_clock', '$uhr')
    return null
  }
  const ms = instant.getTime()
  if (!Number.isFinite(ms)) {
    bericht.melden('invalid_validation_clock', '$uhr')
    return null
  }
  return ms
}

function land(wert: unknown, path: string, fehlend: KandidatenChargeFehler, bericht: Befundliste): string | null {
  if (wert == null || wert === '') {
    bericht.melden(fehlend, path)
    return null
  }
  if (typeof wert !== 'string') {
    bericht.melden('invalid_country_code', path)
    return null
  }
  const code = landescodeLesen(wert)
  if (!code) {
    bericht.melden('invalid_country_code', path)
    return null
  }
  return code
}

function urlFeld(
  wert: unknown,
  path: string,
  leerErlaubt: boolean,
  bericht: Befundliste,
): string | null | undefined {
  if (wert === null && leerErlaubt) return null
  const gelesen = urlLesen(wert)
  if (!gelesen.ok) {
    bericht.melden(gelesen.reason === 'tracking_parameter' ? 'tracking_parameter' : path.endsWith('officialActionLink') ? 'invalid_action_link' : 'invalid_url', path)
    return undefined
  }
  return gelesen.url
}

function eintragLesen(
  wert: unknown,
  path: string,
  uhrMs: number | null,
  bericht: Befundliste,
): KandidatenChargeEintrag | null {
  const satz = datensatz(wert)
  if (!satz) {
    bericht.melden('invalid_destination', path)
    return null
  }
  const qualitaet = qualitaetLesen(satz.evidenceQuality)
  if (!('evidenceQuality' in satz)) bericht.melden('field_required', `${path}.evidenceQuality`)
  else if (!qualitaet) bericht.melden('invalid_evidence_quality', `${path}.evidenceQuality`)
  if (qualitaet) werteDerQualitaet(satz, path, qualitaet, 0, new WeakSet(), bericht)

  for (const name of Object.keys(satz)) {
    if ((EINTRAG_SCHLUESSEL as readonly string[]).includes(name)) continue
    if (sensibel(name) || anspruch(name) || HERLEITUNG.has(norm(name))) continue
    if (qualitaet && verbotenerSchluessel(qualitaet, name)) continue
    bericht.melden('unexpected_field', `${path}.${name}`)
  }
  for (const name of EINTRAG_SCHLUESSEL) {
    if (!(name in satz)) bericht.melden('field_required', `${path}.${name}`)
  }

  const ziel = 'destinationCountryCode' in satz ? land(satz.destinationCountryCode, `${path}.destinationCountryCode`, 'invalid_country_code', bericht) : null
  const amt = 'officialActionLink' in satz ? urlFeld(satz.officialActionLink, `${path}.officialActionLink`, true, bericht) : undefined
  const primaer = 'officialSourceUrl' in satz ? urlFeld(satz.officialSourceUrl, `${path}.officialSourceUrl`, true, bericht) : undefined

  const zusaetzlich: string[] = []
  let zusaetzlichBrauchbar = false
  let zusaetzlichFehler = false
  if ('additionalOfficialSourceUrl' in satz) {
    if (!Array.isArray(satz.additionalOfficialSourceUrl)) {
      bericht.melden('invalid_url', `${path}.additionalOfficialSourceUrl`)
    } else if (satz.additionalOfficialSourceUrl.length > LISTE_MAX) {
      bericht.melden('input_too_large', `${path}.additionalOfficialSourceUrl`)
    } else {
      zusaetzlichBrauchbar = true
      satz.additionalOfficialSourceUrl.forEach((eintrag, index) => {
        const url = urlFeld(eintrag, `${path}.additionalOfficialSourceUrl[${index}]`, false, bericht)
        if (url) zusaetzlich.push(url)
        else zusaetzlichFehler = true
      })
    }
  }

  const quellen = [...(primaer ? [primaer] : []), ...zusaetzlich]
  const gesehen = new Set<string>()
  for (let index = 0; index < quellen.length; index += 1) {
    const url = quellen[index] ?? ''
    if (gesehen.has(url)) {
      const quellePfad = primaer && index === 0 ? `${path}.officialSourceUrl` : `${path}.additionalOfficialSourceUrl[${primaer ? index - 1 : index}]`
      bericht.melden('duplicate_official_source', quellePfad)
    }
    gesehen.add(url)
  }
  if (quellen.length > QUELLEN_MAX) bericht.melden('official_sources_limit', `${path}.officialSourceUrl`)
  if (qualitaet && quellen.length < mindestQuellen(qualitaet) && (primaer !== undefined || zusaetzlichBrauchbar)) {
    bericht.melden('insufficient_official_sources', `${path}.officialSourceUrl`)
  }

  let abgerufen: string | null | undefined
  if ('retrievedAt' in satz) {
    if (satz.retrievedAt === null) {
      if (qualitaet && abrufNoetig(qualitaet, quellen.length)) bericht.melden('retrieved_at_required', `${path}.retrievedAt`)
      abgerufen = null
    } else {
      const instant = instantLesen(satz.retrievedAt)
      if (!instant) bericht.melden('invalid_retrieved_at', `${path}.retrievedAt`)
      else if (uhrMs != null && Date.parse(instant) > uhrMs) bericht.melden('retrieved_at_in_future', `${path}.retrievedAt`)
      abgerufen = instant
    }
  }

  const von = 'validFrom' in satz ? datumLesen(satz.validFrom) : 'missing'
  const bis = 'validUntil' in satz ? datumLesen(satz.validUntil) : 'missing'
  if (von === 'invalid') bericht.melden('invalid_validity', `${path}.validFrom`)
  if (bis === 'invalid') bericht.melden('invalid_validity', `${path}.validUntil`)
  if (typeof von === 'string' && typeof bis === 'string' && bis < von) bericht.melden('validity_order', `${path}.validUntil`)

  if (
    !qualitaet ||
    !ziel ||
    primaer === undefined ||
    !zusaetzlichBrauchbar ||
    zusaetzlichFehler ||
    amt === undefined ||
    abgerufen === undefined ||
    von === 'invalid' ||
    bis === 'invalid' ||
    von === 'missing' ||
    bis === 'missing' ||
    quellen.length > QUELLEN_MAX ||
    quellen.length !== gesehen.size ||
    quellen.length < mindestQuellen(qualitaet)
  ) {
    return null
  }
  if (abrufNoetig(qualitaet, quellen.length) && !abgerufen) return null
  if (abgerufen && uhrMs != null && Date.parse(abgerufen) > uhrMs) return null

  return {
    destinationCountryCode: ziel,
    evidenceQuality: qualitaet,
    supportingOfficialSourceUrls: quellen,
    officialActionLink: amt,
    retrievedAt: abgerufen,
    validFrom: von,
    validUntil: bis,
    promotion: 'not_performed',
    truthDisposition: lage(qualitaet),
  }
}

/**
 * Prüft eine Forschungs-Charge.
 * Die Uhr ist Pflicht. Es gibt keine versteckte Umgebungszeit.
 * `promotion` ist im Erfolg immer `not_performed`.
 */
export function kandidatenChargeValidieren(eingabe: unknown, uhr: KandidatenChargeUhr): KandidatenChargeErgebnis {
  const bericht = befunde()
  const uhrMs = uhrLesen(uhr, bericht)
  privatsphaere(eingabe, '', 0, new WeakSet(), bericht)

  const satz = datensatz(eingabe)
  if (!satz) {
    bericht.melden('invalid_batch', '$')
    return { ok: false, findings: bericht.liste() }
  }

  for (const name of Object.keys(satz)) {
    if ((CHARGE_SCHLUESSEL as readonly string[]).includes(name)) continue
    if (sensibel(name) || anspruch(name) || HERLEITUNG.has(norm(name))) continue
    bericht.melden('unexpected_field', name)
  }

  if (!('researchStatus' in satz)) bericht.melden('research_status_required', 'researchStatus')
  else if (satz.researchStatus !== KANDIDATEN_CHARGE_FORSCHUNG && !(typeof satz.researchStatus === 'string' && anspruch(satz.researchStatus))) {
    bericht.melden('research_status_invalid', 'researchStatus')
  }

  if (!('databaseImportStatus' in satz)) bericht.melden('database_import_status_required', 'databaseImportStatus')
  else if (
    satz.databaseImportStatus !== KANDIDATEN_CHARGE_DATENBANK &&
    !(typeof satz.databaseImportStatus === 'string' && anspruch(satz.databaseImportStatus))
  ) {
    bericht.melden('database_import_status_invalid', 'databaseImportStatus')
  }

  const buergerschaft = 'citizenshipCountryCode' in satz
    ? land(satz.citizenshipCountryCode, 'citizenshipCountryCode', 'citizenship_required', bericht)
    : null
  if (!('citizenshipCountryCode' in satz)) bericht.melden('citizenship_required', 'citizenshipCountryCode')

  let dokument: ExplizitesDokument | null = null
  if (!('documentType' in satz)) bericht.melden('document_type_required', 'documentType')
  else if (satz.documentType === 'unknown' && (TRAVELLER_DOCUMENT_TYPES as readonly TravellerDocumentType[]).includes('unknown')) {
    bericht.melden('document_type_not_explicit', 'documentType')
  } else {
    dokument = dokumentLesen(satz.documentType)
    if (!dokument) bericht.melden('invalid_document_type', 'documentType')
  }

  const ziele: KandidatenChargeEintrag[] = []
  if (!('destinations' in satz) || !Array.isArray(satz.destinations) || satz.destinations.length === 0) {
    bericht.melden('destinations_required', 'destinations')
  } else if (satz.destinations.length > ZIELE_MAX) {
    bericht.melden('destinations_limit', 'destinations')
  } else {
    satz.destinations.forEach((eintrag, index) => {
      const gelesen = eintragLesen(eintrag, `destinations[${index}]`, uhrMs, bericht)
      if (gelesen) ziele.push(gelesen)
    })
  }

  const ergebnis = bericht.liste()
  if (
    ergebnis.length > 0 ||
    uhrMs == null ||
    satz.researchStatus !== KANDIDATEN_CHARGE_FORSCHUNG ||
    satz.databaseImportStatus !== KANDIDATEN_CHARGE_DATENBANK ||
    !buergerschaft ||
    !dokument ||
    !Array.isArray(satz.destinations) ||
    ziele.length !== satz.destinations.length
  ) {
    return { ok: false, findings: ergebnis.length > 0 ? ergebnis : [{ code: 'invalid_batch', path: '$' }] }
  }

  return {
    ok: true,
    researchStatus: KANDIDATEN_CHARGE_FORSCHUNG,
    databaseImportStatus: KANDIDATEN_CHARGE_DATENBANK,
    citizenshipCountryCode: buergerschaft,
    documentType: dokument,
    destinations: ziele,
    findings: [],
  }
}
