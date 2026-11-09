import { streckenkatalog } from '@/lib/providers/omio/daten-server'
import { angebote } from '@/lib/providers/omio/katalog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const id = /^\d{1,14}$/
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams
  const von = query.get('von'),
    nach = query.get('nach')
  const register = Array.from(query).length === 0
  if (
    !register &&
    (!von || !nach || von === nach || !id.test(von) || !id.test(nach) || Array.from(query).length !== 2)
  ) {
    return Response.json(
      { message: 'Ungültige Strecke.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  try {
    const katalog = await streckenkatalog()
    const data = register
      ? { date: katalog.date, publisher: katalog.publisher, places: katalog.places }
      : {
          date: katalog.date,
          options: angebote(katalog, von!, nach!),
        }
    return Response.json(data, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=900', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch {
    return Response.json(
      { message: 'Der Omio-Katalog ist gerade nicht verfügbar.' },
      { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '30' } },
    )
  }
}
