import { cityPhoto } from '@/lib/travel-images/city-photo'
import { cityPhotoQuery } from '@/lib/travel-images/query'

export async function GET(request: Request) {
  const params = cityPhotoQuery(new URL(request.url).searchParams)
  if (!params) return Response.json({ photo: null }, { status: 400 })
  const photo = await cityPhoto(params.place, params.country)
  return Response.json({ photo }, { headers: { 'Cache-Control': photo ? 'public, max-age=3600, s-maxage=86400' : 'public, max-age=30, s-maxage=60' } })
}