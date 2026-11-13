import { readinessBegrenztLesen, readinessContentLengthUeberschritten, readinessHttpHeader,
  readinessInhaltstypOk, readinessKoerperLesen } from '@/lib/readiness/anfrage'
import { readinessAnfrageErlaubt, readinessRateKennungAus } from '@/lib/readiness/rate-limit'
import { officialTruthV3ChDeRuntime } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-server'
import { CH_DE_VISA_INPUT, readChDeVisaInput, readChDeVisaView } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'
import { presentV3VisitorAnswer } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'
import { queryOfficialTruthVisitorV3 } from '@/lib/readiness/official-truth-product-v3/visitor/query'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10
const MAX_REQUEST_BYTES = 1024
const failed = 'Die Visumauskunft ist vorübergehend nicht verfügbar. Bitte erneut versuchen.'
function answer(status: number, value: unknown, headers: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { ...readinessHttpHeader(), ...headers } })
}

/** Public fixed input; the existing factory retains all authority and cache checks. */
export async function POST(request: Request): Promise<Response> {
  try {
    if (request.signal.aborted) return answer(503, { message: failed })
    const limit = await readinessAnfrageErlaubt(readinessRateKennungAus(request.headers))
    if (!limit.ok) return answer(429, { message: 'Zu viele Abfragen. Bitte später erneut versuchen.' },
      { 'retry-after': String(limit.retryAfterSec) })
    if (!readinessInhaltstypOk(request.headers.get('content-type'))) return answer(415, { message: 'Die Anfrage erwartet application/json.' })
    if (readinessContentLengthUeberschritten(request.headers.get('content-length'), MAX_REQUEST_BYTES)) {
      return answer(413, { message: 'Die Anfrage ist zu gross.' })
    }
    const bounded = await readinessBegrenztLesen(request.body, MAX_REQUEST_BYTES)
    if (!bounded.ok) return answer(bounded.status, { message: bounded.message })
    const parsed = readinessKoerperLesen(bounded.text)
    if (!parsed.ok || !readChDeVisaInput(parsed.wert)) return answer(400, {
      message: 'Diese Abfrage gilt für Schweizer Staatsangehörige mit Schweizer Reisepass bei direkter Einreise nach Deutschland.',
    })
    if (request.signal.aborted) return answer(503, { message: failed })
    const facade = officialTruthV3ChDeRuntime()
    // Await the original facade promise and every nested owned drain. This
    // route adds no worker, timer, detached task or alternative evidence path.
    const result = facade ? await facade.query(CH_DE_VISA_INPUT, request.signal)
      : await queryOfficialTruthVisitorV3(CH_DE_VISA_INPUT)
    if (!result.ok || request.signal.aborted) return answer(503, { message: failed })
    const view = readChDeVisaView(presentV3VisitorAnswer(result.answer))
    return view ? answer(200, view) : answer(503, { message: failed })
  } catch { return answer(503, { message: failed }) }
}
