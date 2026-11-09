import 'server-only'
import { z } from 'zod'
import { civilDateOrdinalLesen, schema2DatenPruefen, schema2Kanonisch } from '@/lib/readiness/regulierungs-anwendbarkeit'
import { sha256Hex } from '@/lib/readiness/digest'

export const timestamp = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    || civilDateOrdinalLesen(value.slice(0, 10)) === null) return false
  const ms = Date.parse(value)
  return Number.isFinite(ms) && new Date(ms).toISOString() === value
})
export const operationId = z.string().regex(/^op3_[a-f0-9]{32}$/)
export const jobId = z.string().regex(/^job3_[a-f0-9]{32}$/)
export const leaseId = z.string().regex(/^lease3_[a-f0-9]{32}$/)
export const jobKey = z.string().regex(/^research-job:v3:[a-f0-9]{64}$/)
export const discoveryJobKey = z.string().regex(/^combination-discovery-job:v3:[a-f0-9]{64}$/)
export const discoveryRef = z.string().regex(/^combination-discovery-result:v3:[a-f0-9]{64}$/)
export const decisionRef = z.string().regex(/^source-decision:v3:[a-f0-9]{64}$/)
export const versionRef = z.string().regex(/^rule-version:v3:[a-f0-9]{64}$/)
export const projectionRef = z.string().regex(/^rule-projection:v3:[a-f0-9]{64}$/)

export function readData<T>(value: unknown, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T | null {
  if (schema2DatenPruefen(value)) return null
  try {
    const parsed = schema.safeParse(JSON.parse(JSON.stringify(value)))
    return parsed.success ? parsed.data : null
  } catch { return null }
}

export function same(a: unknown, b: unknown): boolean { return schema2Kanonisch(a) === schema2Kanonisch(b) }
export function key(kind: string, value: unknown): string { return `${kind}:v3:${sha256Hex(schema2Kanonisch(value))}` }
export function readNow(clock: () => string): string | null {
  try { return readData(clock(), timestamp) } catch { return null }
}

export type BudgetResult<T> = { ok: true; value: T } | { ok: false }

/** Invocation-local timeout; no repeating timer or background scheduler. */
export function invocationBudget(milliseconds: number, parent?: AbortSignal) {
  const controller = new AbortController()
  const stop = () => controller.abort()
  const timer = setTimeout(stop, milliseconds)
  if (parent?.aborted) stop()
  else parent?.addEventListener('abort', stop, { once: true })
  return {
    signal: controller.signal,
    async call<T>(run: (signal: AbortSignal) => Promise<T>): Promise<BudgetResult<T>> {
      if (controller.signal.aborted) return { ok: false }
      let abort: (() => void) | undefined
      const interrupted = new Promise<BudgetResult<T>>((resolve) => {
        abort = () => resolve({ ok: false })
        controller.signal.addEventListener('abort', abort, { once: true })
      })
      try {
        const operation = Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new Error('aborted')
          return run(controller.signal)
        }).then<BudgetResult<T>, BudgetResult<T>>((value) => ({ ok: true, value }), () => ({ ok: false }))
        const result = await Promise.race([operation, interrupted])
        return controller.signal.aborted ? { ok: false } : result
      } finally { if (abort) controller.signal.removeEventListener('abort', abort) }
    },
    dispose() { clearTimeout(timer); parent?.removeEventListener('abort', stop); controller.abort() },
  }
}

export type InvocationBudget = ReturnType<typeof invocationBudget>
