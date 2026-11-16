// Code-owned Austria ordinary-passport reader. Identity and semantics only.
// It does not approve a method, store evidence, or widen the CH→DE HRS gate.
import 'server-only'
import { createHash } from 'node:crypto'
import { V3_CUSTOMER_INFORMATION_TOPICS, type V3CustomerInformationTopic } from '../customer-information/topics'

export const AT_VISA_MATRIX_URL = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
export const AT_SHORT_STAY_URL = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'
export const AT_BERN_URL = 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'
export const AT_BERN_CANONICAL_URL = 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag'
/** Editorial edition printed in the current visa-list original. Not an HTTP cache date. */
export const AT_VISA_MATRIX_EDITION = '2026-11-06'
export const AT_VISA_MATRIX_EDITION_TEXT = '(Stand: 6.11.2026)'
export const AT_FETCHED_AT_UTC = '2026-11-16T19:45:39Z'
export const AT_VISA_MATRIX_SHA256 = 'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778'
export const AT_SHORT_STAY_SHA256 = 'ab2b735bf53e21a83c447fe9cfefabd7ffc54406f68793d01acac421fd6c301e'
export const AT_BERN_SHA256 = '7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18'
/** First ten ranks are the reviewed priority contract. CH is required and is not in that prefix. */
export const AT_PRIORITY_PREFIX = Object.freeze(['IN', 'TR', 'CN', 'DE', 'PL', 'IT', 'US', 'UA', 'RO', 'FR'] as const)
export const AT_PRIORITY_KNOWN_CODES = Object.freeze([...AT_PRIORITY_PREFIX, 'CH'] as const)

const FREE_MOVEMENT = new Set(['AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'])
const BIOMETRIC_EXEMPTIONS = new Set([
  'Ja, nur biometrische gewöhnliche Reisepässe',
  'Ja, nur biometrische Reisepässe (alle Kategorien)',
  'Ja, nur biometrische Reisepässe (alle Kategorien) + nicht-biometrische Diplomatenpässe',
])
const NAMES: Readonly<Record<string, string>> = Object.freeze({
  Afghanistan: 'AF', Ägypten: 'EG', Albanien: 'AL', Algerien: 'DZ', Andorra: 'AD', Angola: 'AO',
  'Antigua und Barbuda': 'AG', Argentinien: 'AR', Äquatorialguinea: 'GQ', Armenien: 'AM', Aserbaidschan: 'AZ',
  Äthiopien: 'ET', Australien: 'AU', Bahamas: 'BS', Bahrain: 'BH', Bangladesch: 'BD', Barbados: 'BB',
  Belarus: 'BY', Belgien: 'BE', Belize: 'BZ', Benin: 'BJ', Bhutan: 'BT', Bolivien: 'BO',
  'Bosnien und Herzegowina': 'BA', Botsuana: 'BW', Brasilien: 'BR', Brunei: 'BN', Bulgarien: 'BG',
  'Burkina Faso': 'BF', Burundi: 'BI', Chile: 'CL', China: 'CN', 'Costa Rica': 'CR',
  'Côte d`Ivoire (Elfenbeinküste)': 'CI', Dänemark: 'DK', Deutschland: 'DE', Dominica: 'DM',
  'Dominikanische Republik': 'DO', Dschibuti: 'DJ', Ecuador: 'EC', 'El Salvador': 'SV', Eritrea: 'ER',
  Estland: 'EE', Fidschi: 'FJ', Finnland: 'FI', Frankreich: 'FR', Gabun: 'GA', Gambia: 'GM',
  Georgien: 'GE', Ghana: 'GH', Grenada: 'GD', Griechenland: 'GR', 'Großbritannien und Nordirland': 'GB',
  Guatemala: 'GT', Guinea: 'GN', 'Guinea-Bissau': 'GW', Guyana: 'GY', Haiti: 'HT', Honduras: 'HN',
  Indien: 'IN', Indonesien: 'ID', Irak: 'IQ', Iran: 'IR', Irland: 'IE', Island: 'IS', Israel: 'IL',
  Italien: 'IT', Jamaika: 'JM', Japan: 'JP', Jemen: 'YE', Jordanien: 'JO', Kambodscha: 'KH', Kamerun: 'CM',
  Kanada: 'CA', 'Kap Verde (Cabo Verde)': 'CV', Kasachstan: 'KZ', Katar: 'QA', Kenia: 'KE', Kirgisistan: 'KG',
  Kiribati: 'KI', Kolumbien: 'CO', Komoren: 'KM', Kongo: 'CG', 'Kongo, Demokr. Rep.': 'CD', Nordkorea: 'KP',
  Südkorea: 'KR', Kroatien: 'HR', Kuba: 'CU', Kuwait: 'KW', Laos: 'LA', Lesotho: 'LS', Lettland: 'LV',
  Libanon: 'LB', Liberia: 'LR', Libyen: 'LY', Liechtenstein: 'LI', Litauen: 'LT', Luxemburg: 'LU',
  Madagaskar: 'MG', Malawi: 'MW', Malaysia: 'MY', Malediven: 'MV', Mali: 'ML', Malta: 'MT', Marokko: 'MA',
  'Marshall-Inseln': 'MH', Mauretanien: 'MR', Mauritius: 'MU', Mexiko: 'MX', Mikronesien: 'FM', Moldau: 'MD',
  Monaco: 'MC', Mongolei: 'MN', Montenegro: 'ME', Mosambik: 'MZ', 'Myanmar/Birma': 'MM', Namibia: 'NA',
  Nauru: 'NR', Nepal: 'NP', Neuseeland: 'NZ', Nicaragua: 'NI', Niederlande: 'NL', Niger: 'NE', Nigeria: 'NG',
  Nordmazedonien: 'MK', Norwegen: 'NO', Oman: 'OM', Pakistan: 'PK', Palau: 'PW', Panama: 'PA',
  'Papua-Neuguinea': 'PG', Paraguay: 'PY', Peru: 'PE', Philippinen: 'PH', Polen: 'PL', Portugal: 'PT',
  Ruanda: 'RW', Rumänien: 'RO', 'Russische Föderation': 'RU', Salomonen: 'SB', Sambia: 'ZM', Samoa: 'WS',
  'San Marino': 'SM', 'São Tomé und Príncipe': 'ST', 'Saudi-Arabien': 'SA', Schweden: 'SE', Schweiz: 'CH',
  Senegal: 'SN', Serbien: 'RS', Seychellen: 'SC', 'Sierra Leone': 'SL', Simbabwe: 'ZW', Singapur: 'SG',
  Slowakei: 'SK', Slowenien: 'SI', Somalia: 'SO', Spanien: 'ES', 'Sri Lanka': 'LK', 'St. Lucia': 'LC',
  'St. Kitts und Nevis': 'KN', 'St. Vincent und die Grenadinen': 'VC', Südafrika: 'ZA', Sudan: 'SD',
  Südsudan: 'SS', Suriname: 'SR', 'Eswatini (Swasiland)': 'SZ', Syrien: 'SY', Tadschikistan: 'TJ',
  Tansania: 'TZ', Thailand: 'TH', 'Timor-Leste': 'TL', Togo: 'TG', Tonga: 'TO', 'Trinidad und Tobago': 'TT',
  Tschad: 'TD', 'Tschechische Republik': 'CZ', Tunesien: 'TN', Türkei: 'TR', Turkmenistan: 'TM', Tuvalu: 'TV',
  Uganda: 'UG', Ukraine: 'UA', Ungarn: 'HU', Uruguay: 'UY', Usbekistan: 'UZ', Vanuatu: 'VU', Venezuela: 'VE',
  'Vereinigte Arabische Emirate': 'AE', 'Vereinigte Staaten von Amerika': 'US', Vietnam: 'VN',
  'Zentralafrikanische Republik': 'CF', Zypern: 'CY',
})

const ENTITIES: Readonly<Record<string, string>> = Object.freeze({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '\u2013', mdash: '\u2014',
  uuml: 'ü', Uuml: 'Ü', ouml: 'ö', Ouml: 'Ö',
  auml: 'ä', Auml: 'Ä', szlig: 'ß', eacute: 'é', Eacute: 'É', ocirc: 'ô', aacute: 'á', iacute: 'í',
})

export type AtVisaClass = 'free_movement' | 'third_country_exempt' | 'required' | 'biometric_ordinary' | 'unavailable'
export type AtIdentityCardClass = 'accepted' | 'not_accepted' | 'unavailable'
export type AtPassportRule = Readonly<{
  countryName: string
  citizenshipCountryCode: string | null
  visa: AtVisaClass
  identityCard: AtIdentityCardClass
  /** Free movement is never stored as a third-country 90/180 exemption. */
  stayFrame: 'free_movement_up_to_three_months' | 'matrix_regular_90_180_exemption' | 'not_published'
}>
export type AtDocumentIdentity = Readonly<{ ok: true; sha256: string; edition: string | null }>
  | Readonly<{ ok: false; reason: 'identity_mismatch' | 'invalid_response' | 'stale_edition_rejected' }>
export type AtOfficialRead = Readonly<{
  visa: AtDocumentIdentity
  shortStay: AtDocumentIdentity
  bern: AtDocumentIdentity
  rules: readonly AtPassportRule[]
  priorityFile: 'absent'
  publicationAuthority: 'none'
}>

function decode(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16)
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10)
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity
    }
    return ENTITIES[body] ?? entity
  })
}
function textOf(fragment: string): string {
  return decode(fragment.replace(/<sup[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}
function plain(document: string): string {
  return textOf(document.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '))
}
function sha256Bytes(bytes: Uint8Array): string { return createHash('sha256').update(bytes).digest('hex') }
function originalBytes(value: unknown, maximum: number): Uint8Array | null {
  if (typeof value === 'string') {
    if (value.length < 1 || value.length > maximum || value.includes('\0')) return null
    const bytes = new TextEncoder().encode(value)
    return bytes.byteLength <= maximum ? bytes : null
  }
  if (value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= maximum) return value
  return null
}
function decoded(bytes: Uint8Array): string | null {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { return null }
}

export function inspectAtVisaMatrixIdentity(value: unknown): AtDocumentIdentity {
  const bytes = originalBytes(value, 600_000)
  const body = bytes && decoded(bytes)
  if (!bytes || body === null || body.includes('\0')) return Object.freeze({ ok: false, reason: 'invalid_response' })
  const stale = body.includes('15.7.2026') || body.includes('15.07.2026')
  if (stale || body.split(AT_VISA_MATRIX_EDITION_TEXT).length !== 2) {
    return Object.freeze({ ok: false, reason: 'stale_edition_rejected' })
  }
  const sha256 = sha256Bytes(bytes)
  if (sha256 !== AT_VISA_MATRIX_SHA256
    || !body.includes('<html xmlns="http://www.w3.org/1999/xhtml" lang="de">')
    || !body.includes('Visapflichten und Visabefreiungen f&uuml;r die Einreise in die EU+&Ouml;sterreich')
    || !body.includes('<title') || !plain(body).includes('Visumpflichtige Länder')) {
    return Object.freeze({ ok: false, reason: 'identity_mismatch' })
  }
  return Object.freeze({ ok: true, sha256, edition: AT_VISA_MATRIX_EDITION })
}
export function inspectAtShortStayIdentity(value: unknown): AtDocumentIdentity {
  const bytes = originalBytes(value, 200_000)
  const body = bytes && decoded(bytes)
  if (!bytes || body === null || body.includes('\0')) return Object.freeze({ ok: false, reason: 'invalid_response' })
  if (/Stand\s*:/.test(body) || body.includes('15.7.2026') || body.includes('6.11.2026')) {
    return Object.freeze({ ok: false, reason: 'stale_edition_rejected' })
  }
  const sha256 = sha256Bytes(bytes)
  const prose = plain(body)
  const required = [
    'EU-, EWR- und Schweizer Staatsangehörige sind freizügigkeitsberechtigt und benötigen für die Einreise nach Österreich kein Visum.',
    'gültigen Reisepass oder Personalausweis vorlegen.',
    'Einhaltung der 90/180-Tage-Regel – kommen nicht zur Anwendung.',
    'Drittstaatsangehörige dürfen sich grundsätzlich bis zu 90 Tage innerhalb eines Zeitraums von 180 Tagen im Schengen-Raum aufhalten.',
  ]
  if (sha256 !== AT_SHORT_STAY_SHA256 || !body.includes('<html xmlns="http://www.w3.org/1999/xhtml" lang="de">')
    || required.some(sentence => !prose.includes(sentence))) {
    return Object.freeze({ ok: false, reason: 'identity_mismatch' })
  }
  return Object.freeze({ ok: true, sha256, edition: null })
}
export function inspectAtBernIdentity(value: unknown): AtDocumentIdentity {
  const bytes = originalBytes(value, 250_000)
  const body = bytes && decoded(bytes)
  if (!bytes || body === null || body.includes('\0')) return Object.freeze({ ok: false, reason: 'invalid_response' })
  const sha256 = sha256Bytes(bytes)
  if (sha256 !== AT_BERN_SHA256) return Object.freeze({ ok: false, reason: 'identity_mismatch' })
  const canonicals = [...body.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/g)].map(match => match[1])
  const prose = plain(body)
  const swissPassport = 'Schweizer Staatsangehörige können mit ihrem gültigen Personalausweis oder Reisepass in Österreich einreisen.'
  const swissVisa = 'Staatsangehörige von EU/ EWR -Staaten und der Schweiz brauchen zur Einreise nach Österreich kein Visum.'
  const residence = 'die sonst ein Visum für die Einreise nach Österreich benötigen würden'
  const permit = 'Gültige Schweizer Aufenthaltsbewilligung B, C oder L'
  if (canonicals.length !== 2 || canonicals.some(href => href !== AT_BERN_CANONICAL_URL)
    || !body.includes('<html dir="ltr" lang="de-AT">')
    || !prose.includes(swissPassport) || !prose.includes(swissVisa) || !prose.includes(residence) || !prose.includes(permit)
    || prose.indexOf(residence) < prose.indexOf(swissPassport)) {
    return Object.freeze({ ok: false, reason: 'identity_mismatch' })
  }
  return Object.freeze({ ok: true, sha256, edition: null })
}

type MatrixRow = Readonly<{
  name: string
  obligation: string
  exemption: string
  national: string
  bilateral: string
  bilateralChange: string
  transit: string
  identityCard: string
}>

function specialPassportOnly(value: string): boolean {
  if (value === 'Nein') return true
  const lower = value.toLowerCase()
  if (/gewöhn|alle kategor|alle p[aä]ss|reisep[aä]ss|laissez|aufenthaltstitel|\bab \d|fluglizenz|crew/.test(lower)) return false
  if (!/diplomatenpass|dienstpass|spezialpass/.test(lower)) return false
  return /^Ja[:,] (nur )?(biometrische )?(Diplomatenpass|Dienstpass|Spezialpass)( \+ (Diplomatenpass|Dienstpass|Spezialpass))*[: ]/.test(value)
}
function bilateralLeavesOrdinaryRequired(value: string): boolean {
  if (value === 'Nein') return true
  const lower = value.toLowerCase()
  if (/gewöhn|alle kategor|reisep[aä]ss/.test(lower) || !lower.includes('diplomaten')) return false
  return /diplomaten|dienstp[aä]ss|spezialpass/.test(lower)
}
function exemptionLeavesOrdinaryRequired(value: string): boolean {
  return value === 'Nein' || value === 'Ja, nur Diplomatenpässe' || value === 'Ja, nur biometrische Diplomatenpässe'
}

/** Pure row decision. A missing ISO code, a mixed cell, or a special-passport
 * condition that is not exactly ordinary stays unavailable. */
function classifyAtMatrixRow(row: MatrixRow): AtPassportRule {
  const code = NAMES[row.name] ?? null
  const unavailable = (visa: AtVisaClass = 'unavailable'): AtPassportRule => Object.freeze({
    countryName: row.name, citizenshipCountryCode: code, visa, identityCard: 'unavailable' as const, stayFrame: 'not_published' as const,
  })
  if (!code) return unavailable()
  const idCard: AtIdentityCardClass = row.identityCard === 'Ja' ? 'accepted' : row.identityCard === 'Nein' ? 'not_accepted' : 'unavailable'
  const freeCells = [row.obligation, row.exemption, row.national, row.bilateral, row.transit].every(value => value === 'EU-Freizügigkeit')
    && row.bilateralChange === '--'
  if (FREE_MOVEMENT.has(code)) {
    if (!freeCells) return unavailable()
    return Object.freeze({
      countryName: row.name, citizenshipCountryCode: code, visa: 'free_movement',
      identityCard: row.identityCard === 'Ja' ? 'accepted' : 'unavailable',
      stayFrame: 'free_movement_up_to_three_months',
    })
  }
  if (freeCells) return unavailable()
  const plainTransit = row.transit === 'Ja' || row.transit === 'Nein'
  const plainId = row.identityCard === 'Ja' || row.identityCard === 'Nein'
  if (BIOMETRIC_EXEMPTIONS.has(row.exemption) && row.national === 'Nein' && row.bilateralChange === '--'
    && (row.obligation === 'Ja' || row.obligation === 'Nein') && plainTransit && plainId
    && (row.bilateral === 'Nein' || row.bilateral === 'Nicht anwendbar aufgrund EU-Visaerleichterungsabkommen')) {
    return Object.freeze({
      countryName: row.name, citizenshipCountryCode: code, visa: 'biometric_ordinary', identityCard: idCard,
      stayFrame: 'not_published',
    })
  }
  if (row.obligation === 'Nein' && row.exemption === 'Ja' && row.national === 'Nein' && row.bilateral === 'Nein'
    && row.bilateralChange === '--' && plainTransit && plainId) {
    return Object.freeze({
      countryName: row.name, citizenshipCountryCode: code, visa: 'third_country_exempt', identityCard: idCard,
      stayFrame: 'matrix_regular_90_180_exemption',
    })
  }
  if (row.obligation === 'Ja' && exemptionLeavesOrdinaryRequired(row.exemption) && specialPassportOnly(row.national)
    && bilateralLeavesOrdinaryRequired(row.bilateral) && row.bilateralChange === '--' && plainTransit) {
    return Object.freeze({
      countryName: row.name, citizenshipCountryCode: code, visa: 'required',
      identityCard: plainId ? idCard : 'unavailable', stayFrame: 'not_published',
    })
  }
  return unavailable()
}

function matrixRows(body: string): readonly MatrixRow[] | null {
  const parts = body.split(/<details>\s*<summary(?:\s+class="sum_letter")?>/)
  const rows: MatrixRow[] = []
  const seen = new Set<string>()
  for (const part of parts.slice(1)) {
    const nameEnd = part.indexOf('</summary>')
    if (nameEnd < 0) return null
    const after = part.slice(nameEnd + '</summary>'.length)
    if (!after.trimStart().startsWith('<dl>')) continue
    const dlEnd = after.indexOf('</dl>')
    if (dlEnd < 0) return null
    const pairs = [...after.slice(0, dlEnd).matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)]
      .map(match => [textOf(match[1] ?? ''), textOf(match[2] ?? '')] as const)
    const labels = pairs.map(pair => pair[0])
    if (pairs.length !== 8 || seen.has(textOf(part.slice(0, nameEnd)))
      || !labels[0]?.startsWith('EU-Visumpflicht') || !labels[1]?.startsWith('EU-Visumbefreiung')
      || !labels[2]?.startsWith('Nationale Visumbefreiung') || !labels[3]?.includes('Stammabkommen')
      || !labels[4]?.includes('Änderung') || !labels[5]?.startsWith('Flughafentransitvisumpflicht')
      || !labels[6]?.startsWith('Einreise mit Personalausweis') || !labels[7]?.startsWith('zusätzlich gültige Reisedokumente')) return null
    const name = textOf(part.slice(0, nameEnd))
    seen.add(name)
    rows.push(Object.freeze({
      name, obligation: pairs[0]?.[1] ?? '', exemption: pairs[1]?.[1] ?? '', national: pairs[2]?.[1] ?? '',
      bilateral: pairs[3]?.[1] ?? '', bilateralChange: pairs[4]?.[1] ?? '', transit: pairs[5]?.[1] ?? '',
      identityCard: pairs[6]?.[1] ?? '',
    }))
  }
  return rows.length === 210 && seen.size === 210 ? Object.freeze(rows) : null
}

export function readAtOfficialOriginals(input: Readonly<{ visa: unknown; shortStay: unknown; bern: unknown }>): AtOfficialRead {
  const visa = inspectAtVisaMatrixIdentity(input.visa)
  const shortStay = inspectAtShortStayIdentity(input.shortStay)
  const bern = inspectAtBernIdentity(input.bern)
  const visaBytes = originalBytes(input.visa, 600_000)
  const visaText = visaBytes && decoded(visaBytes)
  const rows = visa.ok && visaText ? matrixRows(visaText) : null
  const base = rows?.map(classifyAtMatrixRow) ?? []
  const rules = base.map(rule => {
    if (!shortStay.ok) return Object.freeze({ ...rule, visa: 'unavailable' as const, identityCard: 'unavailable' as const, stayFrame: 'not_published' as const })
    if (rule.citizenshipCountryCode === 'CH' && (!bern.ok || rule.visa !== 'free_movement')) {
      return Object.freeze({ ...rule, visa: 'unavailable' as const, identityCard: 'unavailable' as const, stayFrame: 'not_published' as const })
    }
    return rule
  })
  return Object.freeze({ visa, shortStay, bern, rules: Object.freeze(rules), priorityFile: 'absent', publicationAuthority: 'none' })
}

export function atPrioritySlotReport(read: AtOfficialRead): readonly Readonly<{
  citizenshipCountryCode: string
  rank: 'prefix' | 'required_member_position_unknown'
  visa: AtVisaClass
  identityCard: AtIdentityCardClass
  topics: ReadonlyArray<Readonly<{ topic: V3CustomerInformationTopic; status: 'clear' | 'unavailable'; reason: string }>>
}>[] {
  const byCode = new Map(read.rules.filter(rule => rule.citizenshipCountryCode).map(rule => [rule.citizenshipCountryCode, rule]))
  return AT_PRIORITY_KNOWN_CODES.map(code => {
    const rule = byCode.get(code)
    const visaClear = rule !== undefined && rule.visa !== 'unavailable'
    const idClear = rule !== undefined && rule.identityCard !== 'unavailable' && visaClear
    return Object.freeze({
      citizenshipCountryCode: code,
      rank: code === 'CH' ? 'required_member_position_unknown' as const : 'prefix' as const,
      visa: rule?.visa ?? 'unavailable',
      identityCard: visaClear ? (rule?.identityCard ?? 'unavailable') : 'unavailable',
      topics: Object.freeze(V3_CUSTOMER_INFORMATION_TOPICS.map(topic => Object.freeze({
        topic: topic.id,
        status: (topic.id === 'visa' && visaClear) || (topic.id === 'identity_document' && idClear) ? 'clear' as const : 'unavailable' as const,
        reason: topic.id === 'visa' && visaClear ? rule!.visa
          : topic.id === 'identity_document' && idClear ? rule!.identityCard
          : 'method_not_qualified',
      }))),
    })
  })
}
