import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-guard'
import { ladeProviderOpsBoardFuerApi } from '@/lib/admin/provider-ops-board/runtime'

export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireAdminApi({
    surface: 'api/provider-ops',
    capability: 'betrieb-lesen',
  })
  if (!gate.ok) return gate.response

  const bericht = await ladeProviderOpsBoardFuerApi()
  const response = NextResponse.json(bericht)
  response.headers.set('Cache-Control', 'private, max-age=30')
  return response
}
