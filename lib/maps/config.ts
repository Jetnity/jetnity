// The legacy map entry stays hidden. The shared itinerary map is enabled in the server layout.
export const TRIP_MAP_PILOT_RELEASED = false

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

export function tripServicesOrigin(env: MapEnvironment) {
  if (env.VERCEL_ENV === 'production' && env.VERCEL_GIT_COMMIT_REF === 'main') return 'https://jetnity.com'
  if (env.VERCEL_ENV === 'preview' && env.VERCEL_GIT_COMMIT_REF === 'feat/private-travel-ux-20261113') return APP_MAP_ORIGIN
  return null
}

export function mapPilotConfig(env: MapEnvironment, origin: string, now = Date.now()) {
  if (tripServicesOrigin(env) !== origin || env.JETNITY_MAPS_ALLOWED_ORIGIN !== origin || env.JETNITY_MAPS_ENABLED !== 'true') return null
  let expiresAt: number | null = null
  if (env.VERCEL_ENV === 'preview') {
    expiresAt = Date.parse(env.JETNITY_MAPS_PILOT_EXPIRES_AT ?? '')
    if (!Number.isFinite(expiresAt) || expiresAt <= now || expiresAt - now > 60 * 60 * 1000) return null
  }
  const key = env.GOOGLE_MAPS_BROWSER_KEY
  const mapId = env.GOOGLE_MAPS_MAP_ID
  if (!key || !/^[A-Za-z0-9_-]{20,100}$/.test(key) || !mapId || !/^[a-fA-F0-9]{8,64}$/.test(mapId)) return null
  return { key, mapId, origin, expiresAt }
}
