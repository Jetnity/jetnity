// lib/server/providers/core/url.ts
//
// HTTPS-only request URLs. Credentials, query and fragment never enter
// sanitized transport metadata.

import type { ProviderTransportUrl } from '@/lib/server/providers/core/domain'

export type SanitizedTransportUrl =
  | { ok: true; href: string; url: ProviderTransportUrl }
  | { ok: false; reason: 'invalid_request' }

const ID_MUSTER = /^[A-Za-z0-9._-]+$/
const CORRELATION_MUSTER = /^[A-Za-z0-9._:-]+$/

export function sanitizeProviderTransportUrl(raw: string): SanitizedTransportUrl {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'invalid_request' }
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { ok: false, reason: 'invalid_request' }
  }
  if (parsed.protocol !== 'https:') return { ok: false, reason: 'invalid_request' }
  if (parsed.username || parsed.password) return { ok: false, reason: 'invalid_request' }
  if (!parsed.hostname) return { ok: false, reason: 'invalid_request' }
  return {
    ok: true,
    href: parsed.toString(),
    url: {
      origin: parsed.origin,
      path: parsed.pathname || '/',
    },
  }
}

export function validateBoundedId(value: string, maxLength: number): string | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength) return null
  return ID_MUSTER.test(trimmed) ? trimmed : null
}

export function validateCorrelationId(value: string | null | undefined, maxLength: number): string | null | undefined {
  if (value == null) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > maxLength) return undefined
  return CORRELATION_MUSTER.test(trimmed) ? trimmed : undefined
}

export function readSafeRequestId(raw: string | null): string | null {
  if (raw == null) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 128) return null
  return CORRELATION_MUSTER.test(trimmed) ? trimmed : null
}
