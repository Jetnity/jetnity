import 'server-only'
import { createHash } from 'node:crypto'
import { providerOpsBegrenztLesen, providerOpsContentLengthUeberschritten, providerOpsInhaltstypOk, providerOpsRateKennungAus } from '@/lib/provider-ops/anfrage'
import { timetableAnfrageSchema, type TimetableAnfrage, type TimetableAntwort } from './schema'

// Bounded transient abuse protection. No IP/raw request logging or persistence.
export function createTimetableHandler(load: (request: TimetableAnfrage) => Promise<TimetableAntwort>, active: () => boolean, now: () => number = Date.now) {
  const visitors = new Map<string, number[]>()
  function answer(status: number, body: unknown) {
    return Response.json(body, { status, headers: { 'cache-control': 'private, no-store', ...(status === 429 ? { 'retry-after': '600' } : {}) } })
  }
  return async (req: Request): Promise<Response> => {
    if (!active()) return answer(503, { message: 'Die zusätzlichen 12Go-Streckeninformationen sind noch nicht freigeschaltet.' })
    const origin = req.headers.get('origin')
    if ((origin && origin !== new URL(req.url).origin) || req.headers.get('sec-fetch-site') === 'cross-site') {
      return answer(403, { message: 'Diese Anfrage wird nicht unterstützt.' })
    }
    if (!providerOpsInhaltstypOk(req.headers.get('content-type'))) return answer(415, { message: 'Die Anfrage erwartet JSON.' })
    if (providerOpsContentLengthUeberschritten(req.headers.get('content-length'), 1024)) return answer(413, { message: 'Die Anfrage ist zu gross.' })
    const timestamp = now()
    for (const [key, times] of visitors) if (times.at(-1)! <= timestamp - 24 * 60 * 60 * 1000) visitors.delete(key)
    const key = createHash('sha256').update(providerOpsRateKennungAus(req.headers)).digest('hex')
    if (!visitors.has(key) && visitors.size >= 256) return answer(429, { message: 'Bitte versuche es später erneut.' })
    const times = (visitors.get(key) ?? []).filter((t) => t > timestamp - 24 * 60 * 60 * 1000)
    if (times.length >= 48 || times.filter((t) => t > timestamp - 10 * 60 * 1000).length >= 12) {
      return answer(429, { message: 'Du hast gerade viele Strecken geöffnet. Bitte versuche es später erneut.' })
    }
    visitors.set(key, [...times, timestamp])
    try {
      const body = await providerOpsBegrenztLesen(req.body, 1024, 'Die Anfrage ist zu gross.')
      if (!body.ok) return answer(413, { message: body.message })
      let input: unknown
      try { input = JSON.parse(body.text) } catch { return answer(400, { message: 'Die Anfrage ist nicht lesbar.' }) }
      const request = timetableAnfrageSchema.safeParse(input)
      if (!request.success) return answer(400, { message: 'Für diese Strecke fehlen eindeutig zugeordnete Orte oder ein unterstütztes Land.' })
      return answer(200, await load(request.data))
    } catch {
      return answer(503, { message: '12Go-Streckeninformationen konnten gerade nicht geladen werden. Bitte versuche es erneut oder suche direkt bei 12Go.' })
    }
  }
}
