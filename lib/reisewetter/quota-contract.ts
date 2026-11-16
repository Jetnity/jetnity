export type WeatherQuota = { allowed: true; retryAfterSec: 0 } | { allowed: false; retryAfterSec: number }

/** A missing, malformed or ambiguous acknowledgement never grants capacity. */
export function readWeatherQuota(value: unknown): WeatherQuota | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join(',') !== 'allowed,retryAfterSec,schema'
    || record.schema !== 1 || typeof record.allowed !== 'boolean'
    || !Number.isSafeInteger(record.retryAfterSec)) return null
  const retry = record.retryAfterSec as number
  if (record.allowed) return retry === 0 ? { allowed: true, retryAfterSec: 0 } : null
  return retry >= 1 && retry <= 86400 ? { allowed: false, retryAfterSec: retry } : null
}

/** UI opt-in marker is not authentication; the ordinary session and DB quota are separate gates. */
export function weatherConsentPresent(headers: Headers): boolean {
  return headers.get('x-jetnity-weather-consent') === 'v1'
    && headers.get('sec-fetch-site') === 'same-origin'
}
