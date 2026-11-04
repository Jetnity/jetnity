import { tripMapFrameResponse } from '@/lib/maps/frame'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return tripMapFrameResponse(request, {
    VERCEL_ENV: process.env.VERCEL_ENV,
    JETNITY_MAPS_ENABLED: process.env.JETNITY_MAPS_ENABLED,
    JETNITY_MAPS_ALLOWED_ORIGIN: process.env.JETNITY_MAPS_ALLOWED_ORIGIN,
    JETNITY_MAPS_PILOT_EXPIRES_AT: process.env.JETNITY_MAPS_PILOT_EXPIRES_AT,
    GOOGLE_MAPS_BROWSER_KEY: process.env.GOOGLE_MAPS_BROWSER_KEY,
    GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID,
  })
}
