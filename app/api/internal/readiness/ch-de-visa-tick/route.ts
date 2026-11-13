import { timingSafeEqual } from 'node:crypto'
import { runOfficialTruthV3ChDeTick } from '@/lib/readiness/official-truth-product-v3/runtime/ch-de-tick'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// New business work is refused at the shared 30-second cap; remaining hosting time
// permits actual cancellation/drain, never a longer work or freshness budget.
export const maxDuration = 60
const HEADERS = { 'Cache-Control': 'private, no-store', Vary: 'Authorization', 'X-Content-Type-Options': 'nosniff' }
function refusal(status: number, result: 'unauthorized' | 'unavailable' | 'request_refused') {
  return Response.json({ schema: 1, status: result }, { status, headers: HEADERS })
}

/** Fixed scheduler ingress only. A credential cannot select or approve a method.
 * Deployment schedule/secret provisioning is separate; neither is set here. */
export async function GET(request: Request): Promise<Response> {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret || !/^[A-Za-z0-9_-]{32,256}$/.test(secret)) return refusal(503, 'unavailable')
    const authorization = request.headers.get('authorization')
    const expected = Buffer.from('Bearer ' + secret, 'utf8')
    if (!authorization || authorization.length !== expected.length) return refusal(401, 'unauthorized')
    const supplied = Buffer.from(authorization, 'utf8')
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return refusal(401, 'unauthorized')
    if (request.method !== 'GET' || new URL(request.url).search !== '' || request.body !== null
      || request.headers.has('transfer-encoding')
      || (request.headers.get('content-length') !== null && request.headers.get('content-length') !== '0')) {
      return refusal(400, 'request_refused')
    }
    const report = await runOfficialTruthV3ChDeTick(request.signal)
    return Response.json(report, { status: report.status === 'complete' || report.status === 'busy' ? 200 : 503, headers: HEADERS })
  } catch { return refusal(503, 'unavailable') }
}
