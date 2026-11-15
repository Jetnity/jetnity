// The general release stays closed. The separately approved branch pilot has an exact origin and expiry.
export const TRIP_MAP_PILOT_RELEASED = false

// This same source lock also hides the guest-facing map CTA. An eventual
// preview pilot requires a separate review of client host/environment gating;
// unlocking the server response alone must never expose a broken public CTA.
export function tripMapEntryVisible(mapsActive: boolean, routeHidden: boolean): boolean {
  return TRIP_MAP_PILOT_RELEASED && mapsActive && !routeHidden
}

export type MapEnvironment = {
  [name: string]: string | undefined
  VERCEL_ENV?: string
  VERCEL_GIT_COMMIT_REF?: string
  JETNITY_MAPS_ENABLED?: string
  JETNITY_MAPS_ALLOWED_ORIGIN?: string
  JETNITY_MAPS_PILOT_EXPIRES_AT?: string
  GOOGLE_MAPS_BROWSER_KEY?: string
  GOOGLE_MAPS_MAP_ID?: string
}

export const APP_MAP_ORIGIN = 'https://jetnity-app-git-feat-private-travel-ux-3aad50-jetnity-e1b93c82.vercel.app'

export function isAppMapPreview(env: MapEnvironment) {
  return env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'feat/private-travel-ux-20261113'
}

export function mapPilotConfig(env: MapEnvironment, origin: string, now = Date.now(), released = isAppMapPreview(env) && origin === APP_MAP_ORIGIN) {
  if (!released || env.VERCEL_ENV !== 'preview' || env.JETNITY_MAPS_ENABLED !== 'true') return null
  let url: URL
  try { url = new URL(origin) } catch { return null }
  const expiresAt = Date.parse(env.JETNITY_MAPS_PILOT_EXPIRES_AT ?? '')
  if (url.origin !== origin || url.protocol !== 'https:' || !url.hostname.endsWith('.vercel.app')
    || env.JETNITY_MAPS_ALLOWED_ORIGIN !== origin || !Number.isFinite(expiresAt)
    || expiresAt <= now || expiresAt - now > 60 * 60 * 1000) return null
  const key = env.GOOGLE_MAPS_BROWSER_KEY
  const mapId = env.GOOGLE_MAPS_MAP_ID
  if (!key || !/^[A-Za-z0-9_-]{20,100}$/.test(key) || !mapId || !/^[a-fA-F0-9]{8,64}$/.test(mapId)) return null
  return { key, mapId, origin, expiresAt }
}
