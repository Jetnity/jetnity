// lib/server/providers/core/parse.ts
//
// Safe outbound-response body parsing with a hard size cap.
// Invalid JSON is malformed_response, never a raw parse exception.

import {
  PROVIDER_TRANSPORT_BOUNDS,
  type ProviderHttpResponse,
  type ProviderParseStrategy,
} from '@/lib/server/providers/core/domain'

export type ProviderParsedBody =
  | { ok: true; value: unknown }
  | { ok: false; kind: 'malformed_response'; message: string }

function contentLengthBytes(response: ProviderHttpResponse): number | null {
  const raw = response.headers.get('content-length')
  if (raw == null) return null
  const value = raw.trim()
  if (!/^\d+$/.test(value)) return null
  const bytes = Number(value)
  return Number.isFinite(bytes) ? bytes : null
}

export function validateMaxBodyBytes(maxBodyBytes: number | undefined): number | null {
  const value = maxBodyBytes ?? PROVIDER_TRANSPORT_BOUNDS.defaultMaxBodyBytes
  if (!Number.isInteger(value) || value < 1 || value > PROVIDER_TRANSPORT_BOUNDS.maxBodyBytes) {
    return null
  }
  return value
}

export async function parseProviderResponseBody(
  response: ProviderHttpResponse,
  strategy: ProviderParseStrategy,
  maxBodyBytes: number,
): Promise<ProviderParsedBody> {
  if (strategy === 'none') return { ok: true, value: null }

  const announced = contentLengthBytes(response)
  if (announced != null && announced > maxBodyBytes) {
    return { ok: false, kind: 'malformed_response', message: 'Provider response exceeded the body size limit.' }
  }

  let text: string
  try {
    text = await response.text()
  } catch {
    return { ok: false, kind: 'malformed_response', message: 'Provider response body could not be read.' }
  }

  const bytes = new TextEncoder().encode(text).byteLength
  if (bytes > maxBodyBytes) {
    return { ok: false, kind: 'malformed_response', message: 'Provider response exceeded the body size limit.' }
  }

  if (strategy === 'text') return { ok: true, value: text }

  if (text.trim() === '') {
    return { ok: false, kind: 'malformed_response', message: 'Provider JSON response was empty.' }
  }

  const contentType = response.headers.get('content-type')
  if (contentType) {
    const typ = contentType.split(';')[0]?.trim().toLowerCase()
    if (typ && typ !== 'application/json' && !typ.endsWith('+json')) {
      return { ok: false, kind: 'malformed_response', message: 'Provider response was not JSON.' }
    }
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, kind: 'malformed_response', message: 'Provider response was not valid JSON.' }
  }
}

export function classifyProviderHttpStatus(
  status: number,
): 'success' | 'authentication' | 'authorization' | 'invalid_request' | 'rate_limited' | 'provider_4xx' | 'provider_5xx' | 'malformed_response' {
  if (!Number.isInteger(status) || status < 100 || status > 599) return 'malformed_response'
  if (status >= 200 && status <= 299) return 'success'
  if (status === 400) return 'invalid_request'
  if (status === 401) return 'authentication'
  if (status === 403) return 'authorization'
  if (status === 429) return 'rate_limited'
  if (status >= 400 && status <= 499) return 'provider_4xx'
  if (status >= 500 && status <= 599) return 'provider_5xx'
  return 'malformed_response'
}
