#!/usr/bin/env node
// Same-session HTTP against the local wrapper. Isolated from G11 observer marks.

import { WRAPPER_RPC } from './constants.mjs'
import { isNumericLoopbackOrigin, rejectUnsafeRedirect, sameExactOrigin } from './contract.mjs'
import { isPermittedSuccessShape, parseAdminAccountCountsPayload } from './payload.mjs'

export const WRAPPER_HTTP_PATH = `/rest/v1/rpc/${WRAPPER_RPC}`

// Selected source-contract kinds. These are not a measured local-gateway result.
// anonymous/no-EXECUTE: public apikey, no bearer → privilege/EXECUTE denial.
// invalidJwt: Authorization present but not a valid current JWT → PGRST301.
// forbidden: identified caller without the required grant/status.
export const DENIED_CALLER = Object.freeze({
  anonymous: Object.freeze({
    statuses: Object.freeze([401, 403]),
    codes: Object.freeze(['42501', '42503']),
    note: 'no-EXECUTE / privilege denial for apikey-only anonymous role',
  }),
  invalidJwt: Object.freeze({
    statuses: Object.freeze([401]),
    codes: Object.freeze(['PGRST301']),
    note: 'invalid or expired JWT, not an anonymous apikey-only call',
  }),
  forbidden: Object.freeze({
    statuses: Object.freeze([401, 403]),
    codes: Object.freeze(['42501', '42503']),
    note: 'identified caller denied by grant or status',
  }),
})

export const SYNTHETIC_INVALID_JWT = 'not-a-jwt.invalid-session.token'

export function machineCode(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null
  const code = json.code
  return typeof code === 'string' && code.trim() ? code.trim() : null
}

export function isUnavailableWrapperResponse({ status, json }) {
  return status === 404 && machineCode(json) === 'PGRST202'
}

export function isDeniedCallerResponse(result, kind) {
  const spec = DENIED_CALLER[kind]
  if (!spec) return false
  if (typeof result?.status !== 'number') return false
  if (result.status >= 500) return false
  if (isUnavailableWrapperResponse(result)) return false
  if (!spec.statuses.includes(result.status)) return false
  const code = machineCode(result.json)
  if (!code) return false
  return spec.codes.includes(code)
}

export function permittedPayloadKeys() {
  return [
    'present_registered_accounts',
    'created_in_prior_30_days',
    'measured_at',
    'window_start',
    'definition_version',
  ]
}

export async function callLocalWrapper({
  localApi,
  accessToken = null,
  signal,
  fetchImpl = fetch,
}) {
  if (!isNumericLoopbackOrigin(localApi?.origin)) {
    throw new Error('direct wrapper call refuses a non-loopback or remote URL')
  }
  const url = new URL(WRAPPER_HTTP_PATH, localApi.origin)
  if (!sameExactOrigin(url, localApi.origin)) {
    throw new Error('direct wrapper call refuses a foreign origin')
  }
  const headers = {
    apikey: localApi.anonKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (accessToken != null && accessToken !== '') {
    headers.Authorization = `Bearer ${accessToken}`
  }
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: '{}',
    redirect: 'manual',
    signal,
  })
  const location = response.headers?.get?.('location')
  if (response.status >= 300 && response.status < 400) {
    rejectUnsafeRedirect(location, Boolean(accessToken), localApi.origin)
  }
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return { status: response.status, json, text, url: String(url) }
}

export function assertPermittedWrapper(result, { expected } = {}) {
  if (result.status !== 200) {
    throw new Error('permitted wrapper did not return HTTP 200')
  }
  const parsed = parseAdminAccountCountsPayload(result.json)
  if (!parsed.ok) {
    throw new Error('permitted wrapper failed the accepted count/time contract')
  }
  if (expected) {
    if (parsed.measures.presentRegisteredAccounts !== String(expected.present)) {
      throw new Error('permitted wrapper present count != independent expected')
    }
    if (parsed.measures.createdInPrior30Days !== String(expected.recent)) {
      throw new Error('permitted wrapper recent count != independent expected')
    }
  }
  return parsed.measures
}

export function assertDeniedWrapper(result, kind) {
  const parsed = parseAdminAccountCountsPayload(result.json)
  if (result.status === 200 && parsed.ok) {
    throw new Error('denied caller received a success count row')
  }
  if (isUnavailableWrapperResponse(result)) {
    throw new Error('missing wrapper is not an authorization denial')
  }
  if (result.status >= 500) {
    throw new Error('server failure is not a caller-status denial')
  }
  if (!isDeniedCallerResponse(result, kind)) {
    throw new Error(`denied ${kind} semantics missing`)
  }
  return result
}

export { isPermittedSuccessShape, parseAdminAccountCountsPayload }
