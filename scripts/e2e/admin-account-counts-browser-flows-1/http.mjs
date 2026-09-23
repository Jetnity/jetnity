#!/usr/bin/env node
// Same-session HTTP against the local wrapper. Isolated from G11 observer marks.

import { DEFINITION_VERSION, WRAPPER_RPC } from './constants.mjs'
import { isNumericLoopbackOrigin, rejectRemoteRedirect } from './contract.mjs'

export const WRAPPER_HTTP_PATH = `/rest/v1/rpc/${WRAPPER_RPC}`

export function permittedPayloadKeys() {
  return [
    'present_registered_accounts',
    'created_in_prior_30_days',
    'measured_at',
    'window_start',
    'definition_version',
  ]
}

export function isPermittedSuccessShape(payload) {
  const row = Array.isArray(payload) ? payload[0] : payload
  if (!row || typeof row !== 'object' || Array.isArray(row)) return false
  const keys = Object.keys(row)
  const expected = permittedPayloadKeys()
  if (keys.length !== expected.length) return false
  if (expected.some((key) => !keys.includes(key))) return false
  if (row.definition_version !== DEFINITION_VERSION) return false
  if (!/^\d+$/.test(String(row.present_registered_accounts))) return false
  if (!/^\d+$/.test(String(row.created_in_prior_30_days))) return false
  return true
}

export function isDeniedCallerResponse({ status, json }) {
  if (status === 401 || status === 403) return true
  const code = json?.code ?? json?.error ?? json?.message
  const text = String(code ?? '')
  return (
    text.includes('42501') ||
    text.includes('42503') ||
    text.includes('PGRST301') ||
    text.includes('PGRST302') ||
    text.includes('PGRST202')
  )
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
  const headers = {
    apikey: localApi.anonKey,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: '{}',
    redirect: 'manual',
    signal,
  })
  const location = response.headers?.get?.('location')
  if (response.status >= 300 && response.status < 400) {
    rejectRemoteRedirect(location, Boolean(accessToken))
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

export function assertPermittedWrapper(result) {
  if (result.status !== 200 || !isPermittedSuccessShape(result.json)) {
    throw new Error(`permitted wrapper shape missing (status ${result.status})`)
  }
  return result
}

export function assertDeniedWrapper(result) {
  if (isPermittedSuccessShape(result.json) && result.status === 200) {
    throw new Error('denied caller received a success count row')
  }
  if (!isDeniedCallerResponse(result)) {
    throw new Error(`denied caller semantics missing (status ${result.status})`)
  }
  return result
}
