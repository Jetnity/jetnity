import { requireAdminApi } from '@/lib/auth/admin-guard'
import { draftHttpFailure } from '@/lib/admin/marketing/drafts/http'
import { marketingDraftRequest } from '@/lib/admin/marketing/drafts/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const gate = await requireAdminApi({ surface: 'api/marketing/drafts/read', capability: 'inhalte-moderieren' })
    if (!gate.ok) return draftHttpFailure(gate.response.status === 401 ? 'unauthenticated' : gate.response.status === 503 ? 'unavailable' : 'forbidden')
    if (gate.grant !== 'role') return draftHttpFailure('forbidden')
    return marketingDraftRequest(request, 'read', gate.user.id)
  } catch { return draftHttpFailure('unavailable') }
}
