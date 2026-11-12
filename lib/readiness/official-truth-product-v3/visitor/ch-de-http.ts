// Public display transport only. This decoder creates no source or method proof.
import { z } from 'zod'
import { providerOpsBegrenztLesen, providerOpsContentLengthUeberschritten,
  providerOpsInhaltstypOk, providerOpsKoerperLesen } from '@/lib/provider-ops/anfrage'
import type { V3VisitorInput } from '../contract'
import type { V3VisitorLoad } from './controller'
import type { V3VisitorView } from './presentation'

export const CH_DE_VISA_HTTP_PATH = '/api/readiness/ch-de-visa'
const citizenshipCountryCodes = ['CH']
Object.freeze(citizenshipCountryCodes)
export const CH_DE_VISA_INPUT: V3VisitorInput = Object.freeze({
  destinationCountryCode: 'DE', citizenshipCountryCodes,
})
const MAX_RESPONSE_BYTES = 65_536
const inputSchema = z.object({ destinationCountryCode: z.literal('DE'),
  citizenshipCountryCodes: z.tuple([z.literal('CH')]) }).strict()
const text = (maximum: number) => z.string().min(1).max(maximum)
const instant = z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/).refine(value =>
  Number.isFinite(Date.parse(value)) && new Date(Date.parse(value)).toISOString() === value)
const officialHref = z.enum([
  'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820',
  'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474',
])
const accepted = z.object({ status: z.literal('accepted'), title: text(200),
  conditions: z.array(text(2000)).min(1).max(32),
  statements: z.array(z.object({ text: text(2000), when: text(2000).nullable(), href: officialHref.nullable() }).strict()).min(1).max(16),
  source: z.object({ label: text(200), href: officialHref }).strict(),
  checkedAtText: text(200), validityText: text(500), ruleVersion: z.number().int().min(1).max(2_147_483_647), expiresAt: instant,
}).strict()
const negative = z.object({ status: z.enum(['pending', 'conflict', 'unavailable', 'error']),
  title: text(200), message: text(2000) }).strict()
const viewSchema = z.object({ input: inputSchema, generatedAt: instant, synthetic: z.literal(false),
  cells: z.tuple([z.object({ country: z.literal('CH'), label: text(200),
    results: z.array(z.union([accepted, negative])).length(1) }).strict()]),
}).strict().refine(view => view.cells.every(cell => cell.results.every(result =>
  result.status !== 'accepted' || Date.parse(result.expiresAt) > Date.parse(view.generatedAt))))

export function readChDeVisaInput(value: unknown): V3VisitorInput | null {
  const result = inputSchema.safeParse(value)
  return result.success ? result.data : null
}
export function readChDeVisaView(value: unknown): V3VisitorView | null {
  const result = viewSchema.safeParse(value)
  return result.success ? result.data : null
}

/** The existing controller owns abort, request order, polling and expiry. */
export const loadChDeVisa: V3VisitorLoad = async (input, signal) => {
  const unavailable = { daten: null, fehler: { meldung: 'Die Visumauskunft konnte nicht geladen werden. Bitte erneut versuchen.', wiederholbar: true } }
  if (signal.aborted || !readChDeVisaInput(input)) return unavailable
  try {
    const response = await fetch(CH_DE_VISA_HTTP_PATH, { method: 'POST', signal,
      credentials: 'omit', cache: 'no-store', redirect: 'error',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(CH_DE_VISA_INPUT) })
    if (signal.aborted || !response.ok || !providerOpsInhaltstypOk(response.headers.get('content-type'))
      || providerOpsContentLengthUeberschritten(response.headers.get('content-length'), MAX_RESPONSE_BYTES)) {
      await response.body?.cancel()
      return unavailable
    }
    const bounded = await providerOpsBegrenztLesen(response.body, MAX_RESPONSE_BYTES, 'Antwort zu gross')
    if (!bounded.ok || signal.aborted) return unavailable
    const parsed = providerOpsKoerperLesen(bounded.text, 'Antwort nicht lesbar')
    const view = parsed.ok ? readChDeVisaView(parsed.wert) : null
    return view ? { daten: view, fehler: null } : unavailable
  } catch { return unavailable }
}
