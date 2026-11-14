// Fixed manual trigger and minimal display result. No source or method authority.
import { z } from 'zod'

export const CH_DE_OWNER_IMPORT_PATH = '/api/internal/readiness/ch-de-owner-import'
export const CH_DE_OWNER_IMPORT_BODY = '{"schema":1}'
export const CH_DE_OWNER_IMPORT_REQUEST_BYTES = 64
export const CH_DE_OWNER_IMPORT_RESPONSE_BYTES = 1024

const outcomeSchema = z.object({
  schema: z.literal(1),
  status: z.enum(['published', 'complete', 'busy', 'not_approved', 'unavailable', 'access_required', 'request_refused', 'unresolved']),
  published: z.number().int().min(0).max(32),
}).strict().refine(value => value.status === 'published' ? value.published > 0
  : value.status === 'unresolved' || value.published === 0)
export type ChDeOwnerImportOutcome = z.infer<typeof outcomeSchema>

export function readChDeOwnerImportOutcome(value: unknown): ChDeOwnerImportOutcome | null {
  try {
    const result = outcomeSchema.safeParse(value)
    return result.success ? Object.freeze(result.data) : null
  } catch { return null }
}

export function chDeOwnerImportMessage(outcome: ChDeOwnerImportOutcome): string {
  switch (outcome.status) {
    case 'published': return `${outcome.published} Veröffentlichung${outcome.published === 1 ? '' : 'en'} bestätigt. Prüfe jetzt die Visumauskunft in der Vorschau; dieser Lauf ersetzt nicht deren Prüfung.`
    case 'complete': return 'Der Lauf ist abgeschlossen. Er hat keine Veröffentlichung bestätigt. Prüfe den aktuellen Stand der Visumauskunft in der Vorschau.'
    case 'busy': return 'Ein Quellenlauf ist bereits aktiv. Dieser Klick startet keinen weiteren Lauf. Prüfe nach dessen Abschluss die Visumauskunft.'
    case 'not_approved': return 'Die ausgewählte Methode ist aktuell nicht freigegeben. Der Quellenimport wurde nicht gestartet.'
    case 'unavailable': return 'Der Quellenimport konnte nicht gestartet werden. Bitte den Dev-Stand mit der technischen Leitung prüfen.'
    case 'access_required': return 'Dein aktueller Owner-Zugang mit Zwei-Faktor-Prüfung wurde nicht bestätigt. Der Quellenimport wurde nicht gestartet.'
    case 'request_refused': return 'Die Anfrage wurde abgelehnt. Der Quellenimport wurde nicht gestartet.'
    case 'unresolved': return 'Der Ausgang ist offen. Ein Abbruch oder eine verlorene Antwort beweist keine Rücknahme. Prüfe den gespeicherten Quellen- und Ergebnisstand mit der technischen Leitung, bevor du einen neuen Lauf startest.'
  }
}

async function responseBody(response: Response, signal: AbortSignal): Promise<unknown> {
  const declared = response.headers.get('content-length')
  if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')
    || (declared !== null && (!/^(0|[1-9][0-9]{0,4})$/.test(declared) || Number(declared) > CH_DE_OWNER_IMPORT_RESPONSE_BYTES))
    || !response.body || signal.aborted) {
    await response.body?.cancel().catch(() => undefined)
    return null
  }
  const reader = response.body.getReader(), chunks: Uint8Array[] = []
  let bytes = 0, complete = false, cancellation: Promise<void> | null = null
  const stop = () => { cancellation ??= reader.cancel().catch(() => undefined) }
  signal.addEventListener('abort', stop, { once: true })
  if (signal.aborted) stop()
  try {
    for (;;) {
      const part = await reader.read()
      if (signal.aborted) return null
      if (part.done) { complete = true; break }
      bytes += part.value.byteLength
      if (bytes > CH_DE_OWNER_IMPORT_RESPONSE_BYTES) return null
      chunks.push(part.value)
    }
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body))
  } finally {
    signal.removeEventListener('abort', stop)
    if (!complete && !cancellation) stop()
    if (cancellation) await cancellation
    reader.releaseLock()
  }
}

/** Constructing this one-shot caller does no work. Only an explicit start sends
 * one fixed POST; double clicks, remount effects and failed responses never retry. */
export function createChDeOwnerImportStarter() {
  let attempted = false
  return Object.freeze({ async start(signal: AbortSignal): Promise<ChDeOwnerImportOutcome | null> {
    if (attempted || signal.aborted) return null
    attempted = true
    const unknown: ChDeOwnerImportOutcome = { schema: 1, status: 'unresolved', published: 0 }
    const controller = new AbortController(), stop = () => controller.abort()
    signal.addEventListener('abort', stop, { once: true })
    if (signal.aborted) stop()
    // Browser waiting only: this does not extend the server's work budget or
    // establish rollback. Leave the full server work/drain time available.
    const timer = setTimeout(stop, 65_000)
    try {
      const response = await fetch(CH_DE_OWNER_IMPORT_PATH, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: CH_DE_OWNER_IMPORT_BODY,
      })
      if (response.status === 401 || response.status === 403) {
        await response.body?.cancel().catch(() => undefined)
        return controller.signal.aborted ? unknown : { schema: 1, status: 'access_required', published: 0 }
      }
      const outcome = readChDeOwnerImportOutcome(await responseBody(response, controller.signal))
      if (controller.signal.aborted || !outcome) return unknown
      if ((outcome.status === 'published' || outcome.status === 'complete') && response.status !== 200) return unknown
      return outcome
    } catch { return unknown }
    finally { clearTimeout(timer); signal.removeEventListener('abort', stop); controller.abort() }
  } })
}
