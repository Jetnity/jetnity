// Fixed Dev-only status read. No scheduler, notification delivery or DB mutation.
// Public-key contract: https://supabase.com/docs/guides/getting-started/api-keys
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

const DEV_REF = 'yfvbxvijcorffwxbxahl'
const ENDPOINT = `https://${DEV_REF}.supabase.co/rest/v1/rpc/official_v3_guard_alarm_status_v1`
const LIMIT_BYTES = 8192
const TIMEOUT_MS = 10000
const WS = '[ \\t\\r\\n]*'
const STATUS = '(current|unavailable)'
// Exact two-field public DTO, in either key order. No internal state, duplicate
// or escaped keys, extra fields, arrays or free-form provider errors accepted.
const STATUS_ROW = new RegExp(`^${WS}\\{${WS}(?:`
  + `"schema"${WS}:${WS}1${WS},${WS}"status"${WS}:${WS}"${STATUS}"`
  + `|"status"${WS}:${WS}"${STATUS}"${WS},${WS}"schema"${WS}:${WS}1`
  + `)${WS}\\}${WS}$`)
const report = (code) => Object.freeze({ schema: 1, status: code === 'current' ? 'current' : 'alarm', code })

/** The CLI supplies its own environment and native fetch. Injection is only a
 * test seam; neither a URL nor SQL nor a role can be passed through this API. */
export async function checkDevGuardAlarm({ env = process.env, fetchImpl = globalThis.fetch, signal } = {}) {
  let publicKey
  try {
    const ref = env.SUPABASE_PROJECT_REF
    publicKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!ref || !publicKey) return report('configuration_missing')
    if (ref !== DEV_REF) return report('target_refused')
    // Modern publishable keys only. Never parse/forward a legacy anon JWT,
    // user session, service-role/secret key or Management PAT.
    if (typeof publicKey !== 'string' || publicKey.length > 4096 || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) return report('credentials_invalid')
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
        method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit', signal: controller.signal,
        headers: { apikey: publicKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: '{}',
      })
      reader = response.body?.getReader() ?? null
      if (stopped()) code = 'timeout'
      else if (response.redirected || response.status >= 300 && response.status < 400) code = 'redirect_refused'
      else if (response.status === 401 || response.status === 403) code = 'access_denied'
      else if (response.status === 429) code = 'rate_limited'
      else if (response.status !== 200) code = 'http_failure'
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
