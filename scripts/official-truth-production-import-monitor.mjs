// Independent read-only Production observer. No import HMAC, user cookie,
// service-role token, SQL, scheduler mutation or notification transport.
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

const REF = 'qscbgcdmivbbnzrcyegn'
const ARMED = `production:${REF}:enabled-v1`
const STATUS_URL = `https://${REF}.supabase.co/rest/v1/rpc/jetnity_production_import_status_v1`
const VISITOR_URL = 'https://jetnity.com/api/readiness/ch-de-visa'
const VISITOR_INPUT = '{"destinationCountryCode":"DE","citizenshipCountryCodes":["CH"]}'
const TIMEOUT_MS = 10000
const report = (status, code, schedule = 'not_checked', visitor = 'not_checked') =>
  Object.freeze({ schema: 1, status, code, schedule, visitor })

async function readBounded(url, body, headers, limit, fetchImpl, signal) {
  const controller = new AbortController(), started = performance.now()
  let reader = null, bodyDone = false, cancellation = null, cleanupFailed = false, timedOut = false
  let code = 'network_failed', text = null
  const cancel = () => {
    if (reader && !bodyDone && !cancellation) {
      try { cancellation = Promise.resolve(reader.cancel()).catch(() => { cleanupFailed = true }) }
      catch { cleanupFailed = true }
    }
  }
  const abort = () => controller.abort()
  controller.signal.addEventListener('abort', cancel)
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) abort()
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, TIMEOUT_MS)
  const stopped = () => controller.signal.aborted || performance.now() - started >= TIMEOUT_MS
  try {
    if (!stopped()) {
      const response = await fetchImpl(url, { method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store',
        headers, body, signal: controller.signal })
      reader = response.body?.getReader() ?? null
      if (stopped()) code = 'timeout'
      else if (response.redirected || response.status >= 300 && response.status < 400) code = 'redirect_refused'
      else if (response.status === 401 || response.status === 403) code = 'access_denied'
      else if (response.status === 429) code = 'rate_limited'
      else if (response.status !== 200) code = 'http_failure'
      else if (!reader || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(response.headers.get('content-type') ?? '')) code = 'response_invalid'
      else {
        const length = response.headers.get('content-length'), encoding = response.headers.get('content-encoding')
        const identity = encoding === null || encoding.trim() === '' || encoding.trim().toLowerCase() === 'identity'
        if (length !== null && (!/^(0|[1-9][0-9]{0,15})$/.test(length) || Number(length) > limit)) code = 'response_too_large'
        else {
          const chunks = []; let bytes = 0
          code = 'response_invalid'
          while (!stopped()) {
            const part = await reader.read()
            if (stopped()) break
            if (part.done) { bodyDone = true; break }
            if (!(part.value instanceof Uint8Array)) break
            bytes += part.value.byteLength
            if (bytes > limit) { code = 'response_too_large'; break }
            chunks.push(part.value)
          }
          if (bodyDone && !stopped() && (!identity || length === null || Number(length) === bytes)) {
            try { text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes)); code = 'read' }
            catch { code = 'response_invalid' }
          }
        }
      }
    }
  } catch { code = 'network_failed' }
  finally {
    // Join cancellation and every admitted fetch/read; no timeout race detaches I/O.
    controller.abort(); cancel()
    if (cancellation) await cancellation
    try { reader?.releaseLock() } catch { cleanupFailed = true }
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    controller.signal.removeEventListener('abort', cancel)
  }
  if (signal?.aborted) return { code: 'aborted', text: null }
  if (timedOut || performance.now() - started >= TIMEOUT_MS) return { code: 'timeout', text: null }
  if (cleanupFailed) return { code: 'cleanup_failed', text: null }
  return { code, text }
}

function exact(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key))
}
function isPublicProductionKey(key, now) {
  if (typeof key !== 'string' || key.length > 4096) return false
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true
  // Classify only the public legacy anon format. This does not verify its
  // signature or authenticate it: the fixed Supabase HTTPS endpoint must do so.
  try {
    const parts = key.split('.')
    if (parts.length !== 3) return false
    const limits = [512, 2048, 32]
    const bytes = parts.map((part, index) => {
      if (!/^[A-Za-z0-9_-]+$/.test(part)) throw Error('invalid key encoding')
      const value = Buffer.from(part, 'base64url')
      if (value.length > limits[index] || value.toString('base64url') !== part) throw Error('invalid key encoding')
      return value
    })
    if (bytes[2].length !== 32) return false
    const [header, payload] = bytes.slice(0, 2).map(value => {
      const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(value)
      const parsed = JSON.parse(text)
      // Reject duplicate/escaped fields, number aliases, whitespace and BOMs.
      if (JSON.stringify(parsed) !== text) throw Error('noncanonical key metadata')
      return parsed
    })
    const seconds = Math.floor(now / 1000)
    return exact(header, ['alg', 'typ']) && header.alg === 'HS256' && header.typ === 'JWT'
      && exact(payload, ['iss', 'ref', 'role', 'iat', 'exp'])
      && payload.iss === 'supabase' && payload.ref === REF && payload.role === 'anon'
      && Number.isSafeInteger(payload.iat) && payload.iat > 0 && payload.iat <= seconds
      && Number.isSafeInteger(payload.exp) && payload.exp > seconds && payload.exp > payload.iat
  } catch { return false }
}
function readSchedule(text, now) {
  // Only these three literal keys and scalar tokens, exactly once each. This
  // rejects duplicate/escaped fields and number aliases before JSON parsing.
  const ws = '[ \\t\\r\\n]*'
  const member = `(?:"schema"${ws}:${ws}1|"status"${ws}:${ws}"(?:current|unavailable)"|"nextDueAt"${ws}:${ws}(?:[1-9][0-9]{12}|null))`
  if (!new RegExp(`^${ws}\\{${ws}${member}${ws},${ws}${member}${ws},${ws}${member}${ws}\\}${ws}$`).test(text)) return { code: 'response_invalid' }
  const value = JSON.parse(text)
  if (!exact(value, ['schema', 'status', 'nextDueAt'])) return { code: 'response_invalid' }
  if (value.status !== 'current') return { code: value.nextDueAt === null ? 'schedule_unavailable' : 'response_invalid' }
  if (!Number.isSafeInteger(value.nextDueAt) || value.nextDueAt < now - 600000 || value.nextDueAt > now + 2400000) return { code: 'schedule_due_invalid' }
  return { code: 'current', nextDueAt: value.nextDueAt }
}
const textBound = (value, limit) => typeof value === 'string' && value.length > 0 && value.length <= limit
const officialHref = value => value === 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
  || value === 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474'
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null
}
function readVisitor(text, now) {
  let value
  try { value = JSON.parse(text) } catch { return { code: 'response_invalid' } }
  if (!exact(value, ['input', 'generatedAt', 'synthetic', 'cells']) || value.synthetic !== false
    || !exact(value.input, ['destinationCountryCode', 'citizenshipCountryCodes']) || value.input.destinationCountryCode !== 'DE'
    || JSON.stringify(value.input.citizenshipCountryCodes) !== '["CH"]' || !Array.isArray(value.cells) || value.cells.length !== 1) return { code: 'response_invalid' }
  const cell = value.cells[0], generated = instant(value.generatedAt)
  if (!exact(cell, ['country', 'label', 'results']) || cell.country !== 'CH' || !textBound(cell.label, 200)
    || !Array.isArray(cell.results) || cell.results.length !== 1 || generated === null) return { code: 'response_invalid' }
  if (generated > now + 5000 || generated < now - 30000) return { code: 'visitor_observation_stale' }
  const result = cell.results[0]
  if (result?.status !== 'accepted') return { code: 'visitor_unavailable' }
  if (!exact(result, ['status', 'title', 'conditions', 'statements', 'source', 'checkedAtText', 'validityText', 'ruleVersion', 'expiresAt'])
    || !textBound(result.title, 200) || !textBound(result.checkedAtText, 200) || !textBound(result.validityText, 500)
    || !Number.isInteger(result.ruleVersion) || result.ruleVersion < 1 || result.ruleVersion > 2147483647
    || !Array.isArray(result.conditions) || result.conditions.length < 1 || result.conditions.length > 32 || !result.conditions.every(item => textBound(item, 2000))
    || !Array.isArray(result.statements) || result.statements.length < 1 || result.statements.length > 16
    || !result.statements.every(item => exact(item, ['text', 'when', 'href']) && textBound(item.text, 2000)
      && (item.when === null || textBound(item.when, 2000)) && (item.href === null || officialHref(item.href)))
    || !exact(result.source, ['label', 'href']) || !textBound(result.source.label, 200) || !officialHref(result.source.href)) return { code: 'response_invalid' }
  const expires = instant(result.expiresAt)
  if (expires === null) return { code: 'response_invalid' }
  if (expires <= now || expires <= generated) return { code: 'visitor_expired' }
  if (expires - now < 900000) return { code: 'visitor_expiring' }
  return { code: 'current', expiresAt: expires }
}

/** Injection is only a local test seam. No endpoint, role, input, time budget,
 * threshold or target can be selected with CLI flags or environment overrides. */
export async function checkProductionImport({ env = process.env, fetchImpl = globalThis.fetch, signal } = {}) {
  let key
  try {
    if (env.JETNITY_PRODUCTION_IMPORT_MONITOR !== ARMED) return report('unarmed', 'monitor_not_armed')
    if (env.SUPABASE_PROJECT_REF !== REF) return report('alarm', 'target_refused')
    key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!isPublicProductionKey(key, Date.now())) return report('alarm', 'credentials_invalid')
    if (typeof fetchImpl !== 'function') return report('alarm', 'transport_unavailable')
  } catch { return report('alarm', 'configuration_invalid') }
  if (signal?.aborted) return report('alarm', 'aborted')
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' }
  // Independent observations are both collected, including when the first one
  // fails. A healthy BG1 alone cannot conceal a stopped import or stale display.
  const observations = await Promise.all([
    readBounded(STATUS_URL, '{}', { ...headers, apikey: key }, 8192, fetchImpl, signal),
    readBounded(VISITOR_URL, VISITOR_INPUT, headers, 65536, fetchImpl, signal),
  ])
  const now = Date.now()
  const schedule = observations[0].code === 'read' ? readSchedule(observations[0].text, now) : observations[0]
  const visitor = observations[1].code === 'read' ? readVisitor(observations[1].text, now) : observations[1]
  if (schedule.code === 'current' && visitor.code === 'current' && schedule.nextDueAt >= visitor.expiresAt) return report('alarm', 'observation_failed', 'renewal_after_expiry', visitor.code)
  if (schedule.code !== 'current' || visitor.code !== 'current') return report('alarm', 'observation_failed', schedule.code, visitor.code)
  return report('current', 'current', 'current', 'current')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = process.argv.length === 2
    ? await checkProductionImport().catch(() => report('alarm', 'internal_failure')) : report('alarm', 'arguments_refused')
  process.stdout.write(`${JSON.stringify(result)}\n`)
  process.exitCode = result.status === 'current' ? 0 : result.status === 'unarmed' ? 2 : 1
}
