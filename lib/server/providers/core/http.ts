// lib/server/providers/core/http.ts
//
// Thin fetch adapter for a later production transport. Tests inject a fake.
// Cookies are never forwarded. Redirects are not followed.

import type { ProviderHttpClient } from '@/lib/server/providers/core/domain'

export function createFetchProviderHttpClient(
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): ProviderHttpClient {
  return async (request) => {
    const response = await fetchImpl(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: request.signal,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'manual',
    })
    return {
      status: response.status,
      headers: {
        get(name: string) {
          return response.headers.get(name)
        },
      },
      text: () => response.text(),
    }
  }
}
