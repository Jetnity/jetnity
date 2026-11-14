// Fixed Dev-only status read. No scheduler, notification delivery or DB mutation.
// API contract: https://supabase.com/docs/reference/api/v1-read-only-query
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

const DEV_REF = 'yfvbxvijcorffwxbxahl'
const ENDPOINT = `https://api.supabase.com/v1/projects/${DEV_REF}/database/query/read-only`
const QUERY = 'SELECT official_v3_guard_private.alarm_status_v1() AS guard_status'
const LIMIT_BYTES = 8192
const TIMEOUT_MS = 10000
const WS = '[ \\t\\r\\n]*'
const STATUS = '(current|unchecked|clock|incident|stale|unavailable)'
// Accept exactly one result row with exactly the two fields from the fixed SQL
// function, in either JSON-object key order. Duplicate/escaped keys, extra rows
// or fields and free-form strings cannot silently become a healthy response.
const STATUS_ROW = new RegExp(`^${WS}\\[${WS}\\{${WS}"guard_status"${WS}:${WS}\\{${WS}(?:`
  + `"schema"${WS}:${WS}1${WS},${WS}"status"${WS}:${WS}"${STATUS}"`
  + `|"status"${WS}:${WS}"${STATUS}"${WS},${WS}"schema"${WS}:${WS}1`
  + `)${WS}\\}${WS}\\}${WS}\\]${WS}$`)
const report = (code) => Object.freeze({ schema: 1, status: code === 'current' ? 'current' : 'alarm', code })

/** The CLI supplies its own environment and native fetch. Injection is only a
 * test seam; neither a URL nor SQL nor a role can be passed through this API. */
export async function checkDevGuardAlarm({ env = process.env, fetchImpl = globalThis.fetch, signal } = {}) {
  let token
  try {
    const ref = env.SUPABASE_PROJECT_REF
    token = env.SUPABASE_ACCESS_TOKEN
    if (!ref || !token) return report('configuration_missing')
    if (ref !== DEV_REF) return report('target_refused')
    if (typeof token !== 'string' || !/^[\x21-\x7e]{1,4096}$/.test(token)) return report('credentials_invalid')
    if (typeof fetchImpl !== 'function') return report('transport_unavailable')
  } catch { return report('configuration_invalid') }
  if (signal?.aborted) return report('aborted')

  const started = performance.now(), controller = new AbortController()
  let timedOut = false, externallyAborted = false, reader = null, bodyDone = false
  let cancellation = null, cleanupFailed = false, code = 'network_failed'
  function cancelBody() {
    if (reader && !bodyDone && cancellation === null) {
      try {
        cancellation = Promise.resolve(reader.cancel()).catch(() => { cleanupFailed = true })
      } catch { cleanupFailed = true }
    }
  }
  const abort = () => { externallyAborted = true; controller.abort() }
  controller.signal.addEventListener('abort', cancelBody)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, TIMEOUT_MS)
  const stopped = () => controller.signal.aborted || performance.now() - started >= TIMEOUT_MS
  try {
    if (!stopped()) {
      const response = await fetchImpl(ENDPOINT, {
        method: 'POST', redirect: 'error', cache: 'no-store', signal: controller.signal,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: QUERY }),
      })
      reader = response.body?.getReader() ?? null
      if (stopped()) code = 'timeout'
      else if (response.redirected || response.status >= 300 && response.status < 400) code = 'redirect_refused'
      else if (response.status === 401 || response.status === 403) code = 'access_denied'
      else if (response.status === 429) code = 'rate_limited'
      else if (response.status !== 201) code = 'http_failure'
      else if (!reader || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')) code = 'response_invalid'
      else {
        const length = response.headers.get('content-length')
        // Native fetch exposes decoded bytes while Content-Length may still
        // describe the compressed wire representation. The decoded byte cap
        // applies in every case; equality is meaningful only for identity.
        const encoding = response.headers.get('content-encoding')
        const identityEncoded = encoding === null || encoding.trim() === '' || encoding.trim().toLowerCase() === 'identity'
        if (length !== null && (!/^(0|[1-9][0-9]{0,15})$/.test(length) || Number(length) > LIMIT_BYTES)) {
          code = 'response_too_large'
        } else {
          const chunks = []
          let bytes = 0
          code = 'response_invalid'
          while (!stopped()) {
            const part = await reader.read()
            if (stopped()) break
            if (part.done) { bodyDone = true; break }
            if (!(part.value instanceof Uint8Array)) break
            bytes += part.value.byteLength
            if (bytes > LIMIT_BYTES) { code = 'response_too_large'; break }
            chunks.push(part.value)
          }
          if (bodyDone && !stopped() && (!identityEncoded || length === null || Number(length) === bytes)) {
            try {
              const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes))
              const matched = STATUS_ROW.exec(text), status = matched?.[1] ?? matched?.[2]
              if (status) code = status === 'current' ? 'current' : `guard_${status}`
            } catch { code = 'response_invalid' }
          }
        }
      }
    }
  } catch { code = 'network_failed' }
  finally {
    // Abort and join the owned body cancellation before producing any result.
    // No timeout race detaches a still-running fetch/read promise.
    controller.abort()
    cancelBody()
    if (cancellation) await cancellation
    try { reader?.releaseLock() } catch { cleanupFailed = true }
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', cancelBody)
  }
  if (timedOut || performance.now() - started >= TIMEOUT_MS) return report('timeout')
  if (externallyAborted) return report('aborted')
  if (cleanupFailed) return report('cleanup_failed')
  return report(code)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // A fixed checker has no command-line URL, SQL, role, budget or target flags.
  const result = process.argv.length === 2
    ? await checkDevGuardAlarm().catch(() => report('internal_failure')) : report('arguments_refused')
  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = result.status === 'current' ? 0 : 1
}
