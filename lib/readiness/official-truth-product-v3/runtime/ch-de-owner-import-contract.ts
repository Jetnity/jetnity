// Fixed manual trigger and minimal display result. No source or method authority.
import { z } from 'zod'

export const CH_DE_OWNER_IMPORT_PATH = '/api/internal/readiness/ch-de-owner-import'
export const CH_DE_OWNER_IMPORT_BODY = '{"schema":1}'
export const CH_DE_OWNER_IMPORT_REQUEST_BYTES = 256
export const CH_DE_OWNER_IMPORT_RESPONSE_BYTES = 1024

const requestSchema = z.object({ schema: z.literal(2), mode: z.enum(['start', 'resume']),
  operationId: z.string().regex(/^op3_[a-f0-9]{32}$/), leaseId: z.string().regex(/^lease3_[a-f0-9]{32}$/),
}).strict()
export type ChDeOwnerImportRequest = Readonly<z.infer<typeof requestSchema>>

/** Identifiers are the original request, never an execution token or authority.
 * Canonical bytes also reject duplicate members and unknown request controls. */
export function readChDeOwnerImportRequest(text: string): ChDeOwnerImportRequest | null {
  try {
    if (new TextEncoder().encode(text).byteLength > CH_DE_OWNER_IMPORT_REQUEST_BYTES) return null
    const parsed = requestSchema.safeParse(JSON.parse(text))
    if (!parsed.success) return null
    const request = Object.freeze({ schema: 2 as const, mode: parsed.data.mode,
      operationId: parsed.data.operationId, leaseId: parsed.data.leaseId })
    return JSON.stringify(request) === text ? request : null
  } catch { return null }
}

const outcomeSchema = z.object({
  schema: z.literal(1),
  status: z.enum(['queued', 'published', 'complete', 'exhausted', 'busy', 'not_approved', 'unavailable', 'access_required', 'request_refused', 'unresolved']),
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
    case 'queued': return 'Die neue Quellenanforderung wurde gespeichert. Der Quellenimport wird mit derselben ursprünglichen Anfrage fortgesetzt.'
    case 'published': return `${outcome.published} Veröffentlichung${outcome.published === 1 ? '' : 'en'} bestätigt. Prüfe jetzt die Visumauskunft in der Vorschau; dieser Lauf ersetzt nicht deren Prüfung.`
    case 'complete': return 'Der Lauf ist abgeschlossen. Er hat keine Veröffentlichung bestätigt. Prüfe den aktuellen Stand der Visumauskunft in der Vorschau.'
    case 'exhausted': return 'Die Versuche dieses Quellenlaufs sind ausgeschöpft und abgeschlossen. Es wurde kein weiterer Quellenversuch begonnen. Ein neuer Lauf benötigt eine neue reguläre Anforderung.'
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
      if (['published', 'complete', 'exhausted'].includes(outcome.status) && response.status !== 200) return unknown
      return outcome
    } catch { return unknown }
    finally { clearTimeout(timer); signal.removeEventListener('abort', stop); controller.abort() }
  } })
}

const LEGACY_REQUEST_KEY = 'jetnity.dev.ch-de-import.request.v2'
const PENDING_REQUEST_KEY = 'jetnity.dev.ch-de-import.request.v3'
type RequestStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type PendingRequest = Readonly<{ schema: 1; request: ChDeOwnerImportRequest; phase: 'enqueue' | 'work' }>

function readPendingRequest(text: string): PendingRequest | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const row = parsed as Record<string, unknown>
    if (row.schema !== 1 || (row.phase !== 'enqueue' && row.phase !== 'work')) return null
    const request = readChDeOwnerImportRequest(JSON.stringify(row.request))
    if (!request || request.mode !== 'start') return null
    const value: PendingRequest = Object.freeze({ schema: 1, request, phase: row.phase })
    return JSON.stringify(value) === text ? value : null
  } catch { return null }
}

/** Keeps request identity, never credentials or source/worker authority. Every
 * continuation is another explicit click and uses the actual original IDs.
 * No request is sent during construction, restore, render, or an effect. */
export function createChDeOwnerImportContinuation(options: Readonly<{
  storage?: () => RequestStorage; identifier?: () => string;
}> = {}) {
  let active = false, pending: PendingRequest | null = null, legacy = false, blocked = false, finished = false
  const listeners = new Set<() => void>()
  const notify = () => { for (const listener of listeners) listener() }
  const storage = () => options.storage ? options.storage() : window.sessionStorage
  const identifier = () => options.identifier ? options.identifier() : crypto.randomUUID().replaceAll('-', '')
  function restore(): boolean {
    if (finished || blocked) return false
    try {
      const text = storage().getItem(PENDING_REQUEST_KEY), old = storage().getItem(LEGACY_REQUEST_KEY)
      if (text !== null && old !== null) { blocked = true; return false }
      if (text === null && old === null) return pending !== null
      const original = old === null ? null : readChDeOwnerImportRequest(old)
      const found: PendingRequest | null = text !== null ? readPendingRequest(text)
        : original?.mode === 'start' ? Object.freeze({ schema: 1, request: original, phase: 'work' }) : null
      if (!found || (pending && (pending.request.operationId !== found.request.operationId || pending.request.leaseId !== found.request.leaseId
        || pending.phase === 'work' && found.phase !== 'work'))) {
        blocked = true; return false
      }
      pending = found; legacy = old !== null
      return true
    } catch { blocked = true; return false }
  }
  return Object.freeze({ restore,
    subscribe(listener: () => void) {
      listeners.add(listener)
      const changed = (event: StorageEvent) => { if (event.key === PENDING_REQUEST_KEY || event.key === LEGACY_REQUEST_KEY || event.key === null) listener() }
      if (typeof window !== 'undefined') window.addEventListener('storage', changed)
      return () => {
        listeners.delete(listener)
        if (typeof window !== 'undefined') window.removeEventListener('storage', changed)
      }
    },
    async start(signal: AbortSignal): Promise<ChDeOwnerImportOutcome | null> {
      if (active || finished || signal.aborted) return null
      active = true
      const unknown: ChDeOwnerImportOutcome = { schema: 1, status: 'unresolved', published: 0 }
      const controller = new AbortController(), stop = () => controller.abort()
      signal.addEventListener('abort', stop, { once: true })
      if (signal.aborted) stop()
      const timer = setTimeout(stop, 65_000)
      try {
        restore()
        if (blocked) return { schema: 1, status: 'unavailable', published: 0 }
        if (!pending) {
          const created = readChDeOwnerImportRequest(JSON.stringify({ schema: 2, mode: 'start',
            operationId: 'op3_' + identifier(), leaseId: 'lease3_' + identifier() }))
          if (!created) return { schema: 1, status: 'unavailable', published: 0 }
          // Persist before dispatch. If this fails, no request is sent.
          const retained: PendingRequest = Object.freeze({ schema: 1, request: created, phase: 'enqueue' })
          storage().setItem(PENDING_REQUEST_KEY, JSON.stringify(retained))
          pending = retained; legacy = false
          notify()
        }
        // At most enqueue then work in this explicit click. An unknown outcome
        // never retries or changes phase. Restore/render remain effect-free.
        for (let step = 0; step < 2; step++) {
          const phase = pending.phase
          const body = JSON.stringify({ ...pending.request, mode: phase === 'enqueue' ? 'start' : 'resume' })
          if (controller.signal.aborted) return unknown
          const response = await fetch(CH_DE_OWNER_IMPORT_PATH, {
            method: 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body,
          })
          if (response.status === 401 || response.status === 403) {
            await response.body?.cancel().catch(() => undefined)
            return controller.signal.aborted ? unknown : { schema: 1, status: 'access_required', published: 0 }
          }
          const outcome = readChDeOwnerImportOutcome(await responseBody(response, controller.signal))
          if (controller.signal.aborted || !outcome
            || (['queued', 'published', 'complete', 'exhausted'].includes(outcome.status) && response.status !== 200)) return unknown
          if (phase === 'enqueue') {
            if (outcome.status === 'exhausted') {
              try { storage().removeItem(PENDING_REQUEST_KEY) } catch { /* Exact original remains available for verification. */ }
              pending = null
              return outcome
            }
            if (outcome.status !== 'queued') return ['published', 'complete'].includes(outcome.status) ? unknown : outcome
            const retained: PendingRequest = Object.freeze({ ...pending, phase: 'work' })
            // If this durable transition fails, no worker is dispatched.
            storage().setItem(PENDING_REQUEST_KEY, JSON.stringify(retained))
            pending = retained; notify()
            continue
          }
          if (outcome.status === 'queued') return unknown
          if (outcome.status === 'published' || outcome.status === 'complete' || outcome.status === 'exhausted') {
            finished = outcome.status === 'published'
            try { storage().removeItem(legacy ? LEGACY_REQUEST_KEY : PENDING_REQUEST_KEY) } catch { /* Original remains safe to verify. */ }
            pending = null
          }
          return outcome
        }
        return unknown
      } catch { return unknown }
      finally { active = false; clearTimeout(timer); signal.removeEventListener('abort', stop); controller.abort(); notify() }
    },
  })
}
