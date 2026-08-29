// lib/server/providers/core/headers.ts
//
// Credentials may be passed to the injected HTTP client, never into errors,
// observer events, returned metadata, or snapshots.

import { PROVIDER_TRANSPORT_BOUNDS } from '@/lib/server/providers/core/domain'
import type { ProviderHeaderInput } from '@/lib/server/providers/core/domain'

export const DEFAULT_SENSITIVE_HEADER_NAMES = [
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'auth-token',
  'x-access-token',
  'access-token',
  'x-session-token',
  'session-token',
  'x-csrf-token',
] as const

export type ProviderBuiltHeaders = {
  outbound: Record<string, string>
  sentHeaderNames: string[]
}

export type ProviderHeaderBuildResult =
  | { ok: true; headers: ProviderBuiltHeaders }
  | { ok: false; reason: 'invalid_request' }

function normalizeHeaderName(name: string): string {
  return name.trim().toLowerCase()
}

export function isSensitiveHeaderName(
  name: string,
  additionalSensitiveHeaderNames: readonly string[] = [],
): boolean {
  const normalized = normalizeHeaderName(name)
  if (!normalized) return false
  if ((DEFAULT_SENSITIVE_HEADER_NAMES as readonly string[]).includes(normalized)) return true
  return additionalSensitiveHeaderNames.some((extra) => normalizeHeaderName(extra) === normalized)
}

export function redactHeaderName(name: string): string {
  const normalized = normalizeHeaderName(name)
  return normalized.length > 0 ? normalized : 'unknown-header'
}

function validHeaderName(name: string): boolean {
  const trimmed = name.trim()
  if (!trimmed) return false
  if (trimmed.length > PROVIDER_TRANSPORT_BOUNDS.maxHeaderNameLength) return false
  return /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(trimmed)
}

export function buildProviderRequestHeaders(
  input: ProviderHeaderInput = {},
): ProviderHeaderBuildResult {
  const additional = input.additionalSensitiveHeaderNames ?? []
  const outbound: Record<string, string> = {}
  const names: string[] = []

  const apply = (source: Record<string, string> | undefined) => {
    if (!source) return true
    for (const [rawName, value] of Object.entries(source)) {
      if (!validHeaderName(rawName) || typeof value !== 'string') return false
      const name = redactHeaderName(rawName)
      outbound[name] = value
      if (!names.includes(name)) names.push(name)
    }
    return true
  }

  if (!apply(input.publicHeaders)) return { ok: false, reason: 'invalid_request' }
  if (!apply(input.secretHeaders)) return { ok: false, reason: 'invalid_request' }

  for (const extra of additional) {
    if (typeof extra !== 'string' || !validHeaderName(extra)) {
      return { ok: false, reason: 'invalid_request' }
    }
  }

  return { ok: true, headers: { outbound, sentHeaderNames: names } }
}

export function headerNamesAreSecretSafe(
  payload: unknown,
  secrets: readonly string[],
): boolean {
  const serialized = JSON.stringify(payload)
  if (serialized == null) return true
  return secrets.every((secret) => secret === '' || !serialized.includes(secret))
}
