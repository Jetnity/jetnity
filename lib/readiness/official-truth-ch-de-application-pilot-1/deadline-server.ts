import 'server-only'

/** Bounds the caller even when an upstream SDK promise does not settle. Work
 * must check this signal after every await and before its next side effect. */
export async function withinDeadline<T>(parent: AbortSignal, ms: number, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController()
  const abort = () => controller.abort()
  parent.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(abort, ms)
  if (parent.aborted) abort()
  let rejectAbort: () => void = () => undefined
  try {
    const interrupted = new Promise<never>((_, reject) => {
      rejectAbort = () => reject(new Error('pilot_request_interrupted'))
      controller.signal.addEventListener('abort', rejectAbort, { once: true })
      if (controller.signal.aborted) rejectAbort()
    })
    return await Promise.race([interrupted, work(controller.signal)])
  } finally {
    clearTimeout(timer)
    parent.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', rejectAbort)
    controller.abort()
  }
}
