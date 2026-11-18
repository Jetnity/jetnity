// Public presentation of individually verified Austrian Dev visa replies.
// This module never writes, verifies raw HTML, chooses an issuer, or approves a
// method. Only exact positive replies from the protected source/MA1/BG1 RPC
// can produce positive text; every other passport remains unavailable.
import { z } from 'zod'
import { COUNTRY_UI_LOCALE, landAnzeigeText, landName } from '@/lib/country/darstellung'
import type { V3VisitorInput } from '../official-truth-product-v3/contract'
import type { V3VisitorView, V3VisitorViewResult } from '../official-truth-product-v3/visitor/presentation'

const BMI_ENTRY = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/start.html'
const BMI_VISA = 'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html'
const BERN = 'https://www.bmeia.gv.at/oeb-bern/reise-nach-oesterreich/einreise-und-aufenthalt/wie-stelle-ich-einen-antrag/'
const sourceUrl = z.enum([BMI_ENTRY, BMI_VISA, BERN])
const utcInstant = z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  .refine(value => Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value)
const acceptedVisa = z.object({
  status: z.literal('accepted'),
  citizenshipCountryCode: z.string().regex(/^[A-Z]{2}$/),
  destinationCountryCode: z.literal('AT'),
  documentType: z.literal('passport'),
  visaEffect: z.literal('not_required'),
  visaMode: z.literal('visa_exempt'),
  ruleVersion: z.number().int().min(1).max(2_147_483_646),
  sourceCheckedAt: utcInstant,
  verifiedAt: utcInstant,
  expiresAt: utcInstant,
  sourceUrls: z.array(sourceUrl).min(1).max(3).refine(urls => new Set(urls).size === urls.length),
}).strict()
const unavailable: V3VisitorViewResult = Object.freeze({
  status: 'unavailable', title: 'Derzeit nicht verfügbar',
  message: 'Für diese Staatsangehörigkeit liegt derzeit keine bestätigte amtliche Visumauskunft vor.',
})
export type AtVisaReadback = Readonly<{ country: string; data: unknown }>

function formattedUtc(iso: string): string {
  const [date, clock] = iso.split('T')
  const [year, month, day] = date!.split('-')
  return `${day}.${month}.${year}, ${clock!.slice(0, 5)} UTC`
}

/** Reproves *presentation* freshness after the protected RPC's own authority
 * checks. A mismatched passport/source/clock never inherits another result. */
function perPassport(country: string, raw: unknown, now: number): V3VisitorViewResult {
  const parsed = acceptedVisa.safeParse(raw)
  if (!parsed.success || parsed.data.citizenshipCountryCode !== country) return unavailable
  const fact = parsed.data
  const source = Date.parse(fact.sourceCheckedAt), verified = Date.parse(fact.verifiedAt)
  const expiry = Date.parse(fact.expiresAt)
  // Browser-held responses cannot outlive the stricter 70-minute source-watch
  // admission limit of the protected SQL visitor, even if the one-hour fact
  // lease continues. The 24-hour original-custody age is NOT this limit.
  const sourceDeadline = source + 70 * 60_000
  const safeExpiry = Math.min(expiry, sourceDeadline)
  if (source > verified || verified > now || safeExpiry <= now
    || source > now || now - source >= 70 * 60_000
    || expiry <= verified || expiry - verified > 3_600_000) return unavailable
  // CH uses the exact three-source Austrian receipt. Future passports must
  // instead have the Austrian BMI visa primary, never a Swiss-only Bern source
  // carried over to another nationality.
  if (country === 'CH'
      ? fact.sourceUrls.length !== 3 || fact.sourceUrls[0] !== BMI_ENTRY
        || fact.sourceUrls[1] !== BMI_VISA || fact.sourceUrls[2] !== BERN
      : !fact.sourceUrls.includes(BMI_VISA) || fact.sourceUrls.includes(BERN)) return unavailable

  const isSwiss = country === 'CH'
  const nationality = landName(country, COUNTRY_UI_LOCALE) || landAnzeigeText(country)
  const officialText = isSwiss
    ? 'Schweizer Staatsangehörige benötigen für die direkte Einreise nach Österreich mit gültigem Schweizer Reisepass kein Visum.'
    : `Für Reisende mit Staatsangehörigkeit ${nationality} und gültigem nationalem Reisepass ist nach der bestätigten amtlichen Regel bei direkter Einreise nach Österreich kein Visum erforderlich.`
  const href = isSwiss ? BERN : BMI_VISA
  return {
    status: 'accepted', informationTopic: 'visa', title: 'Visum',
    visaAssessment: { effect: 'not_required', mode: 'visa_exempt' },
    conditions: [`Staatsangehörigkeit: ${nationality}`, 'Gültiger nationaler Reisepass',
      'Direkte Einreise nach Österreich; andere Themen sind gesondert zu prüfen'],
    statements: [{ text: officialText, when: null, href }],
    source: { label: isSwiss ? 'Österreichische Botschaft Bern' : 'Österreichisches Bundesministerium für Inneres', href },
    checkedAtText: `Stand vom ${formattedUtc(fact.sourceCheckedAt)}`,
    validityText: `Bestätigte Regel, zuletzt geprüft ${formattedUtc(fact.verifiedAt)}; keine allgemeine Einreisegarantie`,
    ruleVersion: fact.ruleVersion, expiresAt: new Date(safeExpiry).toISOString(),
  }
}

/** The UI is generic for all 50 passport priorities (at most five per query);
 * one independently validated authority response must match EACH selected
 * country. No Swiss shortcut and no positive fallback or source-derived guess. */
export function presentAtVisaReadbacks(input: V3VisitorInput,
  readbacks: readonly AtVisaReadback[], currentTime: Date): V3VisitorView {
  const generatedAt = currentTime.toISOString(), now = currentTime.getTime()
  return {
    input, generatedAt, synthetic: false,
    cells: input.citizenshipCountryCodes.map(country => {
      const matching = readbacks.filter(entry => entry.country === country)
      return { country, label: landAnzeigeText(country),
        results: [matching.length === 1 ? perPassport(country, matching[0]!.data, now) : unavailable],
      }
    }),
  }
}
