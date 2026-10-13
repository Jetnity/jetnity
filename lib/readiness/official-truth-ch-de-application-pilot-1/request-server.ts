import 'server-only'
import { z } from 'zod'
import { createServerComponentClient } from '@/lib/supabase/server'
import { reiseLaden } from '@/lib/trips/daten'
import { readinessAnfrageErlaubt } from '@/lib/readiness/rate-limit'
import { readinessBegrenztLesen, readinessContentLengthUeberschritten, readinessInhaltstypOk } from '@/lib/readiness/anfrage'
import { withinDeadline } from './deadline-server'
import { declarationSchema } from './context'
import { saveDeclaration } from './database-server'
import { tripOfficialPilotPruefen } from '@/lib/readiness/trip-official-evaluations-server'

const identity = { tripId: z.string().uuid(), revision: z.number().int().positive().max(999_999_999) }
const requestSchema = z.discriminatedUnion('operation', [
  z.object({ operation: z.literal('save'), ...identity, mutationId: z.string().uuid(), declaration: declarationSchema }).strict(),
  z.object({ operation: z.literal('check'), ...identity }).strict(),
])
const unavailable = { message: 'Die Reise ist mit dieser Anmeldung nicht verfügbar.' }
export async function applicationPilotRequest(req: Request): Promise<{ status: number; body: unknown }> {
  try { return await withinDeadline(req.signal, 17_000, signal => handleRequest(req, signal)) }
  catch { return { status: 503, body: { message: 'Die Anfrage konnte nicht rechtzeitig abgeschlossen werden.' } } }
}
async function handleRequest(req: Request, signal: AbortSignal): Promise<{ status: number; body: unknown }> {
  const answer = (status: number, body: unknown) => ({ status, body })
  // Origin is mandatory on this browser-only mutation endpoint; no forwarded
  // host/header supplies an authority or pilot selector.
  if (req.headers.get('origin')!==new URL(req.url).origin
    || (req.headers.get('sec-fetch-site') && req.headers.get('sec-fetch-site')!=='same-origin')) return answer(403,unavailable)
  if (!readinessInhaltstypOk(req.headers.get('content-type'))) return answer(415,{ message: 'JSON erwartet.' })
  if (readinessContentLengthUeberschritten(req.headers.get('content-length'),8192)) return answer(413,{ message: 'Anfrage zu gross.' })
  const text = await readinessBegrenztLesen(req.body?.pipeThrough(new TransformStream(), { signal }) ?? null,8192)
  if (!text.ok) return answer(text.status,{ message: text.message })
  let input: unknown
  try { input=JSON.parse(text.text) } catch { return answer(400,{ message: 'Ungültige Anfrage.' }) }
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return answer(400,{ message: 'Ungültige Anfrage.' })
  signal.throwIfAborted()
  const db = await createServerComponentClient()
  signal.throwIfAborted()
  const auth = await db.auth.getUser()
  signal.throwIfAborted()
  if (auth.error || !auth.data.user) return answer(401,unavailable)
  const limit = await readinessAnfrageErlaubt(`ch-de-pilot:${auth.data.user.id}`)
  if (!limit.ok) return answer(429,{ message: 'Zu viele Anfragen. Bitte später erneut versuchen.' })
  signal.throwIfAborted()
  const request = parsed.data
  const read = await reiseLaden(request.tripId)
  signal.throwIfAborted()
  if (read.problem) return answer(503,{ message: 'Die Reise kann gerade nicht gelesen werden.' })
  const trip = read.zeilen[0]
  if (!trip) return answer(404,unavailable)
  if (trip.revision!==request.revision) return answer(409,{ message: 'Die Reise hat sich geändert. Bitte neu laden.' })
  if (request.operation==='save') {
    const saved = await saveDeclaration(trip,request.declaration,request.mutationId)
    return saved ? answer(200,{ trip: saved }) : answer(409,{ message: 'Das Speichern konnte nicht bestätigt werden. Bitte neu laden und Angaben prüfen.' })
  }
  return answer(200,await tripOfficialPilotPruefen(trip,signal))
}
