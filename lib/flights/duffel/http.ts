// lib/flights/duffel/http.ts
//
// Der eine fetch-Weg zu Duffel. Tests setzen ihn ein.

export type SucheHttp = {
  post(
    url: string,
    init: { headers: Record<string, string>; body: string; signal?: AbortSignal },
  ): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>
}

export const fetchAlsHttp: SucheHttp = {
  async post(url, init) {
    const antwort = await fetch(url, {
      method: 'POST',
      headers: init.headers,
      body: init.body,
      signal: init.signal,
      cache: 'no-store',
    })
    return {
      ok: antwort.ok,
      status: antwort.status,
      json: () => antwort.json() as Promise<unknown>,
    }
  },
}
