import 'server-only'
import { providerOpsBegrenztLesen } from '@/lib/provider-ops/anfrage'
import { parseTimetable } from './parser'
import { ortSchluessel, timetableAnfrageSchema, type TimetableAnfrage, type TimetableAntwort } from './schema'

const MAX_BYTES = 256 * 1024
const MAX_CACHE = 64
const TTL_MS = 60 * 60 * 1000
const TIMEOUT_MS = 8000

export function timetableQuelle(request: TimetableAnfrage): string {
  timetableAnfrageSchema.parse(request)
  const from = encodeURIComponent(ortSchluessel(request.from, request.country))
  const to = encodeURIComponent(ortSchluessel(request.to, request.country))
  // This URL shape and each parameter come from the official PHP v2.0 reference.
  return `https://12go.asia/de/timetable/${request.country}/${from}/${to}?embedded&css=yes&z=17323861&noreturn&lang=de&currency=CHF`
}

export function timetableAktiv(env: NodeJS.ProcessEnv): boolean {
  // Preview-only first slice. No env value can activate Production in this version.
  return env.VERCEL_ENV !== 'production' && env.TWELVE_GO_TIMETABLE_ENABLED === 'true'
}

/** Public, non-personal route cache. Bounded and process-local, not a global production quota. */
export function createTimetableService(fetcher: typeof fetch = fetch, now: () => number = Date.now) {
  const cache = new Map<string, { expires: number; data: TimetableAntwort }>()
  const running = new Map<string, Promise<TimetableAntwort>>()
  let windowStart = 0, started = 0

  async function load(request: TimetableAnfrage, source: string): Promise<TimetableAntwort> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const response = await fetcher(source, {
        method: 'GET', redirect: 'error', cache: 'no-store', signal: controller.signal,
        headers: { Accept: 'text/html' },
      })
      if (!response.ok || response.redirected || !response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
        await response.body?.cancel()
        throw new Error('Timetable unavailable')
      }
      if (Number(response.headers.get('content-length')) > MAX_BYTES) {
        await response.body?.cancel()
        throw new Error('Timetable too large')
      }
      const body = await providerOpsBegrenztLesen(response.body, MAX_BYTES, 'Timetable too large')
      if (!body.ok) throw new Error('Timetable too large')
      const data = parseTimetable(body.text, request, new Date(now()).toISOString())
      for (const [key, entry] of cache) if (entry.expires <= now()) cache.delete(key)
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!)
      cache.set(source, { expires: now() + (data.status === 'ready' ? TTL_MS : 5 * 60 * 1000), data })
      return data
    } finally { clearTimeout(timeout) }
  }

  return async (request: TimetableAnfrage): Promise<TimetableAntwort> => {
    const source = timetableQuelle(request)
    const cached = cache.get(source)
    if (cached && cached.expires > now()) return cached.data
    const existing = running.get(source)
    if (existing) return existing
    if (now() - windowStart >= 10 * 60 * 1000) { windowStart = now(); started = 0 }
    if (running.size >= 4 || started >= 60) throw new Error('Timetable capacity reached')
    started += 1
    const pending = load(request, source).finally(() => running.delete(source))
    running.set(source, pending)
    return pending
  }
}

export const loadTimetable = createTimetableService()
