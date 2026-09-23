#!/usr/bin/env node
// Evidence and returned gates must never carry fixture secrets, QR, JWT or traces.

import { SECRET_FIELD_NAMES } from './constants.mjs'

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/
const OTPAUTH = /otpauth:\/\//i
const HAR_OR_TRACE = /\.(har|zip)$|storageState|playwright\/trace|trace\.zip/i
const FILL_OR_TYPE = /(?:fill|type|pressSequentially)\(\s*(["'])(?:\\.|(?!\1).)*\1/g

export function collectRunSecrets(context, store = {}) {
  const secrets = []
  for (const actor of Object.values(context?.accounts ?? {})) {
    if (typeof actor?.password === 'string') secrets.push(actor.password)
    if (typeof actor?.email === 'string') secrets.push(actor.email)
  }
  if (typeof context?.localApi?.anonKey === 'string') secrets.push(context.localApi.anonKey)
  if (typeof store.totpSecret === 'string') secrets.push(store.totpSecret)
  if (typeof store.accessToken === 'string') secrets.push(store.accessToken)
  return secrets.filter((value) => typeof value === 'string' && value.length >= 4)
}

export function redactFreeForm(text, secrets = []) {
  let out = String(text ?? '')
  for (const secret of secrets) {
    if (typeof secret === 'string' && secret.length >= 4 && out.includes(secret)) {
      out = out.split(secret).join('[redacted]')
    }
  }
  out = out.replace(FILL_OR_TYPE, (match, quote) => {
    const fn = match.startsWith('press') ? 'pressSequentially' : match.startsWith('type') ? 'type' : 'fill'
    return `${fn}(${quote}[redacted]${quote})`
  })
  out = out.replace(JWT_LIKE, '[redacted-jwt]')
  out = out.replace(OTPAUTH, '[redacted-otpauth]')
  return out
}

export function looksSecretBearing(value, secrets = [], seen = new Set()) {
  if (value == null) return false
  if (typeof value === 'string') {
    if (JWT_LIKE.test(value) || OTPAUTH.test(value) || HAR_OR_TRACE.test(value)) return true
    if (secrets.some((secret) => secret && value.includes(secret))) return true
    if (/(?:fill|type|pressSequentially)\(\s*["'](?!\[redacted\])[^"']{4,}["']/.test(value)) return true
    return false
  }
  if (typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.some((item) => looksSecretBearing(item, secrets, seen))
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_FIELD_NAMES.includes(key)) return true
    if (looksSecretBearing(item, secrets, seen)) return true
  }
  return false
}

export function safeFailureMessage(error, secrets = []) {
  const raw = error instanceof Error
    ? error.message
    : (error && typeof error === 'object' && typeof error.message === 'string')
      ? error.message
      : String(error ?? 'scenario failed')
  const redacted = redactFreeForm(raw, secrets).replace(/\s+/g, ' ').trim()
  const bounded = redacted.slice(0, 160)
  if (!bounded || looksSecretBearing(bounded, secrets)) {
    return 'scenario failed; details redacted'
  }
  return bounded
}

export function assertSanitized(payload, label = 'evidence', secrets = []) {
  if (looksSecretBearing(payload, secrets)) {
    throw new Error(`${label} refused: secret-bearing or trace/HAR/storageState material`)
  }
  return payload
}

export function sanitizeGate(gate, secrets = []) {
  return {
    id: gate.id,
    result: gate.result,
    evidence: gate.evidence ?? null,
    notes: gate.notes == null ? null : safeFailureMessage({ message: String(gate.notes) }, secrets),
  }
}

export function sanitizeReturnedGates(gates, secrets = []) {
  return gates.map((gate) => sanitizeGate(gate, secrets))
}

export function relativeEvidencePath(path, evidenceDir) {
  if (path == null) return null
  const text = String(path)
  if (text.startsWith(evidenceDir)) {
    return text.slice(evidenceDir.length).replace(/^\/+/, '')
  }
  return text
}
