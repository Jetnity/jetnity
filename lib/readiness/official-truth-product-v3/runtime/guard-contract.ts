import { z } from 'zod'

export const DEV_GUARD_PATH = '/api/internal/readiness/ch-de-owner-guard'
export const DEV_GUARD_STORAGE = 'jetnity.dev.guard.operation.v1'
export const DEV_GUARD_REQUEST_BYTES = 512
export const DEV_GUARD_RESPONSE_BYTES = 4096
const selection = z.string().regex(/^[a-f0-9]{64}$/)
const operationId = z.string().regex(/^op3_[a-f0-9]{32}$/)
const action = z.enum(['retire_unknown', 'resume'])
const time = z.string().min(20).max(40).refine(value => Number.isFinite(Date.parse(value)))
const counter = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const requestSchema = z.discriminatedUnion('intent', [
  z.object({ schema: z.literal(1), intent: z.literal('review') }).strict(),
  z.object({ schema: z.literal(1), intent: z.literal('mutate'), action, operationId, selection }).strict(),
  z.object({ schema: z.literal(1), intent: z.literal('confirm'), action, operationId, selection }).strict(),
])
const reviewSchema = z.object({ schema: z.literal(1), status: z.literal('reviewed'),
  retirement: z.union([
    z.object({ status: z.enum(['closed', 'unavailable']) }).strict(),
    z.object({ status: z.literal('reviewable'), selection, attempt: z.literal(1), originals: z.literal(2),
      qualifications: z.literal(1), acceptedVersions: z.literal(0), leaseEndedAt: time }).strict(),
  ]),
  incident: z.object({ status: z.enum(['clear', 'blocked']), selection, generation: counter,
    methodEpoch: counter.nullable(), proofFinished: time.nullable(), validUntil: time.nullable(), canResume: z.boolean() }).strict(),
}).strict().refine(value => value.incident.status === 'blocked' || !value.incident.canResume)
const receiptSchema = z.object({ schema: z.literal(1), status: z.literal('recorded'), action, operationId, selection,
  result: z.enum(['unknown_retired', 'resumed']), recordedAt: time,
  generation: counter.optional(),
}).strict().refine(value => value.action === 'resume'
  ? value.result === 'resumed' && value.generation !== undefined
  : value.result === 'unknown_retired' && value.generation === undefined)
export type DevGuardRequest = z.infer<typeof requestSchema>
export type DevGuardReview = z.infer<typeof reviewSchema>
export type DevGuardOperation = Extract<DevGuardRequest, { intent: 'mutate' }>
export type DevGuardResult = DevGuardReview | Readonly<{ schema: 1; status: 'recorded' | 'confirmed' | 'absent';
  action: DevGuardOperation['action']; operationId: string; selection: string; recordedAt: string | null }>

export function readDevGuardRequest(value: unknown): DevGuardRequest | null {
  try { const parsed = requestSchema.safeParse(value); return parsed.success ? Object.freeze(parsed.data) : null } catch { return null }
}
export function readDevGuardReview(value: unknown): DevGuardReview | null {
  try { const parsed = reviewSchema.safeParse(value); return parsed.success ? Object.freeze(parsed.data) : null } catch { return null }
}
export function devGuardReceipt(value: unknown, request: Exclude<DevGuardRequest, { intent: 'review' }>): DevGuardResult | null {
  try {
    if (request.intent === 'confirm' && z.object({ schema: z.literal(1), status: z.literal('absent') }).strict().safeParse(value).success) {
      return { schema: 1, status: 'absent', action: request.action, operationId: request.operationId, selection: request.selection, recordedAt: null }
    }
    const parsed = receiptSchema.safeParse(value)
    if (!parsed.success || parsed.data.action !== request.action || parsed.data.operationId !== request.operationId
      || parsed.data.selection !== request.selection) return null
    return { schema: 1, status: request.intent === 'confirm' ? 'confirmed' : 'recorded', action: request.action,
      operationId: request.operationId, selection: request.selection, recordedAt: parsed.data.recordedAt }
  } catch { return null }
}
export function readDevGuardResult(value: unknown, request: DevGuardRequest): DevGuardResult | null {
  if (request.intent === 'review') return readDevGuardReview(value)
  try {
    const parsed = z.object({ schema: z.literal(1), status: z.enum(['recorded', 'confirmed', 'absent']),
      action, operationId, selection, recordedAt: time.nullable() }).strict().safeParse(value)
    if (!parsed.success || parsed.data.action !== request.action || parsed.data.operationId !== request.operationId
      || parsed.data.selection !== request.selection || (parsed.data.status === 'absent') !== (parsed.data.recordedAt === null)
      || (request.intent === 'mutate') !== (parsed.data.status === 'recorded')) return null
    return Object.freeze(parsed.data)
  } catch { return null }
}

/** The only reader for this small request/reply. Cancellation remains joined. */
export async function readDevGuardText(body: ReadableStream<Uint8Array> | null, signal: AbortSignal, maximum: number): Promise<string | null> {
  if (!body || signal.aborted) { await body?.cancel().catch(() => undefined); return null }
  const reader = body.getReader(), chunks: Uint8Array[] = []
  let bytes = 0, complete = false, expired = false, cancellation: Promise<void> | null = null
  const deadline = performance.now() + 5000
  const stop = () => { expired = true; cancellation ??= reader.cancel().catch(() => undefined) }
  signal.addEventListener('abort', stop, { once: true })
  const timer = setTimeout(stop, 5000)
  try {
    for (;;) {
      const part = await reader.read()
      if (expired || signal.aborted || performance.now() >= deadline) return null
      if (part.done) { complete = true; break }
      bytes += part.value.byteLength
      if (bytes > maximum) return null
      chunks.push(part.value)
    }
    const buffer = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length }
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer)
  } catch { return null }
  finally {
    clearTimeout(timer); signal.removeEventListener('abort', stop)
    if (!complete && !cancellation) cancellation = reader.cancel().catch(() => undefined)
    if (cancellation) await cancellation
    reader.releaseLock()
  }
}
