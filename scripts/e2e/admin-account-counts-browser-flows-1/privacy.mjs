#!/usr/bin/env node
// Evidence and context must never carry fixture secrets, QR, JWT or traces.

import { SECRET_FIELD_NAMES } from './constants.mjs'

const JWT_LIKE = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/
const OTPAUTH = /otpauth:\/\//i
const HAR_OR_TRACE = /\.(har|zip)$|storageState|playwright\/trace|trace\.zip/i

export function looksSecretBearing(value, seen = new Set()) {
  if (value == null) return false
  if (typeof value === 'string') {
    if (JWT_LIKE.test(value) || OTPAUTH.test(value) || HAR_OR_TRACE.test(value)) return true
    return false
  }
  if (typeof value !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) return value.some((item) => looksSecretBearing(item, seen))
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_FIELD_NAMES.includes(key)) return true
    if (looksSecretBearing(item, seen)) return true
  }
  return false
}

export function assertSanitized(payload, label = 'evidence') {
  if (looksSecretBearing(payload)) {
    throw new Error(`${label} refused: secret-bearing or trace/HAR/storageState material`)
  }
  return payload
}

export function relativeEvidencePath(path, evidenceDir) {
  if (path == null) return null
  const text = String(path)
  if (text.startsWith(evidenceDir)) {
    return text.slice(evidenceDir.length).replace(/^\/+/, '')
  }
  return text
}
