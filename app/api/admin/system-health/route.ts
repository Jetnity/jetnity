import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { ladeSystemHealthFuerApi } from '@/lib/admin/system-health/runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdminApi({
    surface: 'api/system-health',
    capability: 'betrieb-lesen',
  })
  if (!gate.ok) return gate.response

  const bericht = await ladeSystemHealthFuerApi()
  const response = NextResponse.json(bericht)
  response.headers.set('Cache-Control', 'private, max-age=30')
  return response
}
