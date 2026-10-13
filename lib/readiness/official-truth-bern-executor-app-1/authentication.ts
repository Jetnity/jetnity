import 'server-only'
import { generateKeyPairSync, sign, verify, type KeyObject } from 'node:crypto'
import { APP_API as API, APP_POLICY as P, AppBlocked, blocked, demand, obj, owner, permissions, repository, same,
  timestamp, validatePins, type AppCheckout, type AppPins, type AppReceipts, type AppResult } from './policy'
import { verifyAppEvidence } from './evidence'
import { validateAppRequest, type AppHttpRequest, type AppHttpResponse, type AppWire } from '../../../scripts/official-truth-bern-executor-app-1/github'

function jwt(key: KeyObject, pins: AppPins, now: number): string {
  demand(key.type === 'private' && key.asymmetricKeyType === 'rsa'
    && (key.asymmetricKeyDetails?.modulusLength ?? 0) >= 2048, 'signer_invalid')
  const head = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: pins.clientId, iat: Math.floor(now / 1000) - 60,
    exp: Math.floor(now / 1000) + 300 })).toString('base64url')
  const input = head + '.' + payload
  return input + '.' + sign('RSA-SHA256', Buffer.from(input), key).toString('base64url')
}
function app(value: unknown, pins: AppPins) {
  const a = obj(value)
  demand(a.id === pins.appId && a.slug === pins.slug && a.client_id === pins.clientId
    && a.html_url === 'https://github.com/apps/' + pins.slug && same(a.events, []), 'app_mismatch')
  owner(a.owner); permissions(a.permissions)
}
function installation(value: unknown, pins: AppPins) {
  const i = obj(value)
  demand(i.id === pins.installationId && i.app_id === pins.appId && i.app_slug === pins.slug
    && i.target_id === P.ownerId && i.target_type === 'User' && i.repository_selection === 'selected'
    && i.suspended_at === null && i.suspended_by === null && same(i.events, [])
    && i.access_tokens_url === 'https://api.github.com/app/installations/' + pins.installationId + '/access_tokens'
    && i.repositories_url === 'https://api.github.com/installation/repositories', 'installation_mismatch')
  owner(i.account); permissions(i.permissions)
}
function repositories(value: unknown) {
  const r = obj(value)
  demand(r.total_count === 1 && Array.isArray(r.repositories) && r.repositories.length === 1, 'repository_inventory_mismatch')
  repository(r.repositories[0])
}

// Private: no public supplied-bearer, injected signer or live dependency seam.
// The only caller today is the strictly synthetic harness below.
async function protocol(pins: AppPins, checkout: AppCheckout, receipts: AppReceipts, key: KeyObject,
  wire: AppWire, now: number): Promise<AppResult> {
  const controller = new AbortController()
  const lifetime = setTimeout(() => controller.abort(), 60_000)
  const started = performance.now()
  let assertion = '', token = ''
  try {
    validatePins(pins)
    assertion = jwt(key, pins, now)
    const call = async (request: AppHttpRequest, credential: string) => {
      demand(!controller.signal.aborted && performance.now() - started < 60_000, 'session_expired')
      validateAppRequest(request, pins)
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        const response = await Promise.race([wire(request, credential, controller.signal),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => { controller.abort(); reject(new AppBlocked('github_unverifiable')) }, 5000)
          })])
        const expectedStatus = request.path === API + '/git/ref/' + P.consumedRef.slice(5) ? 404 : request.method === 'POST' ? 201 : 200
        demand(!controller.signal.aborted && response.status === expectedStatus
          && response.link === undefined, 'github_unverifiable')
        return response.body
      } finally { clearTimeout(timer) }
    }
    const appGet = (path: string) => call({ method: 'GET', path }, assertion)
    const authenticate = async () => {
      const a = await appGet('/app'); app(a, pins)
      const installations = await appGet('/app/installations?per_page=100&page=1')
      demand(Array.isArray(installations) && installations.length === 1, 'installation_inventory_mismatch')
      installation(installations[0], pins)
      const i = await appGet('/app/installations/' + pins.installationId); installation(i, pins)
      const r = await appGet(API + '/installation'); installation(r, pins)
      demand(same(i, installations[0]) && same(i, r), 'installation_changed')
      return { a, i }
    }
    const before = await authenticate()
    const issued = obj(await call({ method: 'POST', path: '/app/installations/' + pins.installationId + '/access_tokens',
      body: { repository_ids: [P.repositoryId], permissions: P.permissions } }, assertion))
    // Accept credentials only from this authenticated exchange. Format rejects
    // header injection; it is deliberately NOT evidence of credential identity.
    demand(typeof issued.token === 'string' && /^[A-Za-z0-9_-]{20,255}$/.test(issued.token), 'exchange_invalid')
    token = issued.token
    permissions(issued.permissions)
    demand(issued.repository_selection === 'selected', 'exchange_scope_invalid')
    const expires = timestamp(issued.expires_at)
    demand(expires > now + 60_000 && expires <= now + 3_600_000, 'exchange_expiry_invalid')
    if (Object.hasOwn(issued, 'repositories')) {
      demand(Array.isArray(issued.repositories) && issued.repositories.length === 1, 'exchange_scope_invalid')
      repository(issued.repositories[0])
    }
    const read = async (path: string) => {
      demand(now + (performance.now() - started) < expires - 5000, 'session_expired')
      return call({ method: 'GET', path }, token)
    }
    repositories(await read('/installation/repositories?per_page=100&page=1'))
    repository(await read(API))
    demand(obj(await read(API + '/git/ref/' + P.consumedRef.slice(5))).message === 'Not Found', 'attempt_unavailable')
    const evidence = await verifyAppEvidence(read, pins, checkout, receipts, now)
    demand(same(before, await authenticate()), 'installation_changed')
    repositories(await read('/installation/repositories?per_page=100&page=1'))
    demand(evidence === await verifyAppEvidence(read, pins, checkout, receipts, now + Math.floor(performance.now() - started)),
      'evidence_changed')
    demand(obj(await read(API + '/git/ref/' + P.consumedRef.slice(5))).message === 'Not Found', 'attempt_unavailable')
    return Object.freeze({ status: 'SYNTHETIC_PREFLIGHT_PASS', reason: 'offline_protocol_only',
      liveAuthenticated: false, executionCapability: false, attemptConsumed: false })
  } catch (e) { return blocked(e instanceof AppBlocked ? e.reason : 'github_unverifiable') }
  finally {
    controller.abort(); clearTimeout(lifetime); assertion = ''; token = ''
    // JS strings / OpenSSL key allocations cannot promise secure memory erasure.
    // The later real signer must be a short-lived separately controlled process.
  }
}

export type AppSimulation = Readonly<{ pins: AppPins; checkout: AppCheckout; receipts: AppReceipts; now: number;
  respond: (request: AppHttpRequest, signal: AbortSignal) => Promise<AppHttpResponse>;
  wrongSigningKey?: boolean }>

/** Every credential is generated inside this offline harness and is never
 * registered with GitHub. No secret, bearer, signer or production transport
 * parameter exists. Mocks are explicitly NOT authenticated live access. */
export async function simulateAppPreflightForTests(input: AppSimulation): Promise<AppResult> {
  if (process.env.NODE_TEST_CONTEXT === undefined) return blocked('offline_only')
  let key: KeyObject | undefined
  try {
    demand(Object.keys(input).every(k => ['pins', 'checkout', 'receipts', 'now', 'respond', 'wrongSigningKey'].includes(k)), 'supplied_credentials_forbidden')
    const pair = generateKeyPairSync('rsa', { modulusLength: 2048 })
    key = input.wrongSigningKey ? generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey : pair.privateKey
    const syntheticToken = 'synthetic-installation-only-not-a-real-credential'
    let exchanged = false
    const wire: AppWire = async (request, credential, signal) => {
      const appEndpoint = request.path === '/app' || request.path.startsWith('/app/') || request.path === API + '/installation'
      if (appEndpoint) {
        const parts = credential.split('.')
        demand(parts.length === 3 && verify('RSA-SHA256', Buffer.from(parts.slice(0, 2).join('.')),
          pair.publicKey, Buffer.from(parts[2]!, 'base64url')), 'app_authentication_failed')
        demand(same(JSON.parse(Buffer.from(parts[0]!, 'base64url').toString()), { alg: 'RS256', typ: 'JWT' })
          && same(JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()), { iss: input.pins.clientId,
            iat: Math.floor(input.now / 1000) - 60, exp: Math.floor(input.now / 1000) + 300 }), 'app_authentication_failed')
      } else demand(exchanged && credential === syntheticToken, 'installation_authentication_failed')
      const response = await input.respond(structuredClone(request), signal)
      if (request.method === 'POST' && response.status === 201) {
        demand(obj(response.body).token === syntheticToken, 'supplied_credentials_forbidden')
        exchanged = true
      }
      // Detach fixtures; no mutable truth or credential object leaves the seam.
      return structuredClone(response)
    }
    return await protocol(input.pins, input.checkout, input.receipts, key, wire, input.now)
  } catch { return blocked('simulation_invalid') }
  finally { key = undefined }
}
