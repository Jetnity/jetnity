// lib/next/request-api.ts
//
// Next 14 liefert `params` und Page-`searchParams` synchron. Next 15 macht
// dieselben Werte zu Promises und warnt bei Sync-Zugriff; Next 16 entfernt den
// Shim. `await` ist auf einem Nicht-Promise gültig, deshalb kann Slice 1 die
// Caller bereits auf der bestehenden Runtime vorbereiten, ohne das Framework
// zu heben.
//
// Request-URL-Nutzung (`new URL(req.url).searchParams`) ist ein anderes API
// und gehört nicht hierher.

export type RequestParam<T> = T | Promise<T>

export async function leseRequestParam<T>(wert: RequestParam<T>): Promise<T> {
  return await wert
}

export async function leseOptionalRequestParam<T>(
  wert: RequestParam<T> | undefined,
): Promise<T | undefined> {
  if (wert === undefined) return undefined
  return await wert
}
