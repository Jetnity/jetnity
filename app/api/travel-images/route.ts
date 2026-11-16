import { cityPhoto } from '@/lib/travel-images/city-photo'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  if ([...params.keys()].some(k => k !== 'place' && k !== 'country') || params.getAll('place').length !== 1 || params.getAll('country').length !== 1) return Response.json({ photo: null }, { status: 400 })
  const photo = await cityPhoto(params.get('place') ?? '', params.get('country') ?? '')
  return Response.json({ photo }, { headers: { 'Cache-Control': photo ? 'public, max-age=3600, s-maxage=86400' : 'public, max-age=60, s-maxage=300' } })
}
