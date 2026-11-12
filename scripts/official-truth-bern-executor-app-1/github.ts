import 'server-only'
import https from 'node:https'
import { checkServerIdentity } from 'node:tls'
import { APP_API as API, APP_POLICY as P, AppBlocked, demand, same, validatePins, type AppPins } from '../../lib/readiness/official-truth-bern-executor-app-1/policy'

export type AppHttpRequest = Readonly<{ method: 'GET' | 'POST'; path: string; body?: unknown }>
export type AppHttpResponse = Readonly<{ status: number; body: unknown; link?: string }>
export type AppWire = (request: AppHttpRequest, authorization: string, signal: AbortSignal) => Promise<AppHttpResponse>
const MAX_BYTES = 262144

/** Resource/header safety only, never token identity or authority. Keep the
 * exchange and transport on this same bound; do not interpret opaque contents. */
export function headerSafeAppCredential(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 4096
    && /^[\x21-\x7e]+$/.test(value)
}

export type AppSyntheticCredentialCase = 'short' | 'stateless520' | 'stateless1200'
  | 'opaque_min' | 'opaque_punctuation' | 'opaque_limit' | 'empty' | 'too_long'
  | 'crlf' | 'lf' | 'nul' | 'tab' | 'space' | 'del' | 'non_ascii' | 'non_string'

/** Closed, internally built noncredentials. No caller-supplied bearer seam. */
export function syntheticAppCredentialForTests(kind: AppSyntheticCredentialCase = 'short'): unknown {
  demand(process.env.NODE_TEST_CONTEXT !== undefined, 'offline_only')
  if (kind === 'stateless520' || kind === 'stateless1200') {
    // Deliberately foreign claims and no valid issuer signature: contents must
    // not influence authority. Only the authenticated exchange establishes it.
    const head = Buffer.from('{"alg":"none"}').toString('base64url')
    const body = Buffer.from('{"app_id":7,"permissions":{"administration":"write"}}').toString('base64url')
    const prefix = 'ghs_90001_' + head + '.' + body + '.'
    return prefix + 'x'.repeat((kind === 'stateless520' ? 520 : 1200) - prefix.length)
  }
  const cases = { short: 'synthetic-installation-only-not-a-real-credential', opaque_min: 'x',
    opaque_punctuation: 'synthetic!opaque~value+/=:,', opaque_limit: 'x'.repeat(4096),
    empty: '', too_long: 'x'.repeat(4097), crlf: 'synthetic\r\nInjected: value', lf: 'synthetic\n',
    nul: 'synthetic\0value', tab: 'synthetic\tvalue', space: 'synthetic value', del: 'synthetic\x7f',
    non_ascii: 'syntheticé', non_string: 12345 }
  demand(Object.hasOwn(cases, kind), 'simulation_invalid')
  return cases[kind]
}

export function validateAppRequest(r: AppHttpRequest, pins: AppPins) {
  validatePins(pins)
  demand(same(Object.keys(r).sort(), r.body === undefined ? ['method', 'path'] : ['body', 'method', 'path']), 'request_not_allowed')
  if (r.method === 'POST') {
    demand(r.path === '/app/installations/' + pins.installationId + '/access_tokens'
      && same(r.body, { repository_ids: [P.repositoryId], permissions: P.permissions }), 'request_not_allowed')
    return
  }
  demand(r.method === 'GET' && r.body === undefined && [
    '/app', '/app/installations?per_page=100&page=1', '/app/installations/' + pins.installationId,
    '/installation/repositories?per_page=100&page=1', API, API + '/installation',
    API + '/git/ref/' + P.consumedRef.slice(5),
    API + '/git/ref/heads/main', API + '/pulls/937', API + '/pulls/937/reviews?per_page=100&page=1',
    API + '/issues/934/comments?per_page=100&page=1', API + '/issues/936/comments?per_page=100&page=1',
    API + '/rulesets?includes_parents=true&per_page=100&page=1',
    API + '/rulesets/24998411', API + '/rulesets/21875372',
  ].some(path => path === r.path) || (r.method === 'GET' && r.body === undefined
    && /^\/repos\/Jetnity\/jetnity\/(?:issues\/comments\/[1-9][0-9]{0,15}|git\/commits\/[a-f0-9]{40})$/.test(r.path)), 'request_not_allowed')
}

function parseJson(text: string): unknown {
  const result: unknown = JSON.parse(text)
  // JSON.parse alone silently accepts duplicate security fields. Walk the
  // already syntax-validated text, comparing DECODED keys within each object.
  let at = 0, values = 0
  const space = () => { while (/\s/.test(text[at] ?? '') && at < text.length) at++ }
  const string = () => {
    const start = at++
    while (at < text.length) {
      if (text[at] === '\\') { at += 2; continue }
      if (text[at++] === '"') return JSON.parse(text.slice(start, at)) as string
    }
    throw new AppBlocked('github_unverifiable')
  }
  const walk = (depth: number) => {
    demand(depth <= 64 && ++values <= 16384, 'github_unverifiable'); space()
    if (text[at] === '"') { string(); return }
    if (text[at] === '{') {
      at++; space(); const keys = new Set<string>()
      if (text[at] === '}') { at++; return }
      for (;;) {
        space(); const key = string()
        demand(!keys.has(key), 'github_unverifiable'); keys.add(key)
        space(); at++; walk(depth + 1); space()
        if (text[at++] === '}') return
      }
    }
    if (text[at] === '[') {
      at++; space(); if (text[at] === ']') { at++; return }
      for (;;) { walk(depth + 1); space(); if (text[at++] === ']') return }
    }
    while (at < text.length && !/[\s,}\]]/.test(text[at]!)) at++
  }
  walk(0); space(); demand(at === text.length, 'github_unverifiable')
  return result
}

/** Fixed authority and headers. No arbitrary URL, proxy, redirects, owner-token
 * fallback, ref writer, rules write, or source transport exists in this module. */
function transport(pins: AppPins, request: typeof https.request): AppWire {
  return async (input, authorization, signal) => {
    validateAppRequest(input, pins)
    demand(!signal.aborted && headerSafeAppCredential(authorization), 'github_unverifiable')
    demand(!['NODE_OPTIONS', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE', 'SSL_CERT_DIR', 'NODE_TLS_REJECT_UNAUTHORIZED',
      'HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'https_proxy', 'http_proxy', 'all_proxy'].some(k => process.env[k]), 'unsafe_environment')
    return new Promise((resolve, reject) => {
      let settled = false
      let req: ReturnType<typeof https.request> | undefined
      let response: import('node:http').IncomingMessage | undefined
      const chunks: Buffer[] = []
      const finish = (result?: AppHttpResponse) => {
        if (settled) return
        settled = true; clearTimeout(timer); signal.removeEventListener('abort', abort)
        chunks.forEach(b => b.fill(0)); chunks.length = 0
        if (result) resolve(result)
        else { reject(new AppBlocked('github_unverifiable')); response?.destroy(); req?.destroy() }
      }
      const abort = () => finish()
      signal.addEventListener('abort', abort, { once: true })
      const timer = setTimeout(abort, 5000)
      try {
        const body = input.body === undefined ? undefined : JSON.stringify(input.body)
        req = request({ hostname: 'api.github.com', port: 443, protocol: 'https:', path: input.path,
          method: input.method, servername: 'api.github.com', rejectUnauthorized: true, checkServerIdentity,
          agent: false, minVersion: 'TLSv1.2', maxHeaderSize: 16384,
          headers: { Authorization: 'Bearer ' + authorization, Accept: 'application/vnd.github+json',
            'Accept-Encoding': 'identity', 'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'jetnity-bern-executor-app-1-preflight',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }) },
        }, res => {
          response = res
          if (settled) { res.destroy(); return }
          const length = res.headers['content-length']
          const status = res.statusCode
          const duplicate = ['content-length', 'content-type', 'content-encoding', 'transfer-encoding', 'link']
            .some(h => res.rawHeaders.filter((v, i) => i % 2 === 0 && v.toLowerCase() === h).length > 1)
          const expectedStatus = input.path === API + '/git/ref/' + P.consumedRef.slice(5) ? 404 : input.method === 'POST' ? 201 : 200
          if (duplicate || status !== expectedStatus
            || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(res.headers['content-type'] ?? ''))
            || (res.headers['content-encoding'] !== undefined && res.headers['content-encoding'] !== 'identity')
            || (res.headers['transfer-encoding'] !== undefined && res.headers['transfer-encoding'] !== 'chunked')
            || (length !== undefined && res.headers['transfer-encoding'] !== undefined)
            || res.headers.link !== undefined
            || (length !== undefined && (!/^(0|[1-9][0-9]*)$/.test(length) || Number(length) > MAX_BYTES))) {
            finish(); return
          }
          let size = 0
          res.on('data', (chunk: Buffer) => {
            if (settled) return
            size += chunk.byteLength
            if (size > MAX_BYTES) { finish(); return }
            chunks.push(Buffer.from(chunk))
          })
          res.on('error', abort); res.on('aborted', abort)
          res.on('end', () => {
            if (settled) return
            if (!res.complete || size === 0 || (length !== undefined && size !== Number(length))) { finish(); return }
            const bytes = Buffer.concat(chunks)
            try {
              demand(!(bytes[0] === 239 && bytes[1] === 187 && bytes[2] === 191), 'github_unverifiable')
              const value = parseJson(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
              finish({ status, body: value })
            } catch { finish() } finally { bytes.fill(0) }
          })
        })
        req.on('error', abort)
        req.end(body)
      } catch { finish() }
    })
  }
}

/** Deliberate hard gate: even direct imports cannot mint a live credential.
 * TL must accept custody/code and sequence a reviewed activation before this
 * function can return a real transport. No environment toggle exists. */
export function liveAppTransport(): AppWire {
  throw new AppBlocked('custody_and_code_not_accepted')
}

/** Offline harness only. Always supplies a noncredential and requires a mock
 * request implementation; it cannot import a key or inject a live bearer. */
export function exerciseAppTransportForTests(pins: AppPins, request: typeof https.request,
  input: AppHttpRequest, signal: AbortSignal, credentialCase: AppSyntheticCredentialCase = 'short'): Promise<AppHttpResponse> {
  demand(process.env.NODE_TEST_CONTEXT !== undefined && request !== https.request, 'offline_only')
  return transport(pins, request)(input, syntheticAppCredentialForTests(credentialCase) as string, signal)
}
