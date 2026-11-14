import 'server-only'
import type { ChDeTickReport } from './ch-de-tick'
import {
  CH_DE_OWNER_IMPORT_BODY, CH_DE_OWNER_IMPORT_REQUEST_BYTES,
  readChDeOwnerImportRequest, type ChDeOwnerImportOutcome, type ChDeOwnerImportRequest,
} from './ch-de-owner-import-contract'

/** pg_net serializes its JSONB input in this exact second encoding. Both forms
 * retain duplicate-member evidence; JSON.parse alone is deliberately not used. */
export function readChDeDevRefreshRequest(text: string): ChDeOwnerImportRequest | null {
  const canonical = readChDeOwnerImportRequest(text)
  if (canonical) return canonical
  if (new TextEncoder().encode(text).byteLength > CH_DE_OWNER_IMPORT_REQUEST_BYTES) return null
  const pg = /^\{"mode": "(start|resume)", "schema": 2, "leaseId": "(lease3_[a-f0-9]{32})", "operationId": "(op3_[a-f0-9]{32})"\}$/.exec(text)
  return pg ? readChDeOwnerImportRequest(JSON.stringify({ schema: 2, mode: pg[1], operationId: pg[3], leaseId: pg[2] })) : null
}

/** Bound bytes, time and actual cancellation before any effect or auth I/O. */
export async function readChDeImportBody(request: Request, scheduler = false): Promise<Readonly<{ schema: 1 }> | ChDeOwnerImportRequest | null> {
  const declared = request.headers.get('content-length')
  if (declared !== null && (!/^(0|[1-9][0-9]{0,4})$/.test(declared)
    || Number(declared) > CH_DE_OWNER_IMPORT_REQUEST_BYTES)) return null
  if (!request.body || request.signal.aborted) return null
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  const deadline = performance.now() + 5_000
  let bytes = 0, complete = false, expired = false, cancellation: Promise<void> | null = null
  const stop = () => { expired = true; cancellation ??= reader.cancel().catch(() => undefined) }
  const timer = setTimeout(stop, 5_000)
  request.signal.addEventListener('abort', stop, { once: true })
  if (request.signal.aborted) stop()
  try {
    for (;;) {
      if (expired || request.signal.aborted || performance.now() >= deadline) return null
      const part = await reader.read()
      if (expired || request.signal.aborted || performance.now() >= deadline) return null
      if (part.done) { complete = true; break }
      bytes += part.value.byteLength
      if (bytes > CH_DE_OWNER_IMPORT_REQUEST_BYTES) return null
      chunks.push(part.value)
    }
    if (declared !== null && Number(declared) !== bytes) return null
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength }
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(body)
    return scheduler ? readChDeDevRefreshRequest(text)
      : text === CH_DE_OWNER_IMPORT_BODY ? Object.freeze({ schema: 1 as const }) : readChDeOwnerImportRequest(text)
  } catch { return null }
  finally {
    clearTimeout(timer); request.signal.removeEventListener('abort', stop)
    if (!complete && !cancellation) cancellation = reader.cancel().catch(() => undefined)
    if (cancellation) await cancellation
    reader.releaseLock()
  }
}

export function chDeTickOutcome(report: ChDeTickReport, expectedCalls: 1 | 3): ChDeOwnerImportOutcome {
  const outcome = (status: ChDeOwnerImportOutcome['status'], published = 0): ChDeOwnerImportOutcome => ({ schema: 1, status, published })
  const published = Number.isSafeInteger(report.counts.published) && report.counts.published >= 0 && report.counts.published <= 32
    ? report.counts.published : null
  if (published === null || report.schema !== 1 || report.budgetMilliseconds !== 30000
    || report.calls.started !== report.calls.settled) return outcome('unresolved')
  if (report.status === 'stopped' && report.calls.started === expectedCalls && report.stages.research === 'exhausted'
    && published === 0 && report.counts.deferred === 1 && report.counts.unconfirmed === 0
    && report.counts.unavailable === 0 && report.counts.invalid === 0
    && report.elapsedMilliseconds >= 0 && report.elapsedMilliseconds <= 30000) return outcome('exhausted')
  if (report.status === 'complete' && report.calls.started === expectedCalls && report.elapsedMilliseconds <= 30000
    && report.elapsedMilliseconds >= 0 && report.counts.unconfirmed === 0 && report.counts.unavailable === 0
    && report.counts.invalid === 0 && report.counts.deferred === 0) return outcome(published > 0 ? 'published' : 'complete', published)
  if (published === 0 && report.calls.started === 0) {
    if (report.status === 'busy') return outcome('busy')
    if (report.status === 'unavailable') return outcome('unavailable')
  }
  return outcome('unresolved', published)
}

export function chDeImportHttpStatus(status: ChDeOwnerImportOutcome['status']): number {
  if (['queued', 'published', 'complete', 'exhausted'].includes(status)) return 200
  if (status === 'busy' || status === 'not_approved') return 409
  if (status === 'request_refused') return 400
  if (status === 'access_required') return 403
  return 503
}
