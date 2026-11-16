import { requireAdminApi } from '@/lib/auth/admin-guard'
import { adminWriteErlaubt } from '@/lib/auth/admin-write-gate'
import { draftHttpFailure } from '@/lib/admin/marketing/drafts/http'
import { marketingDraftRequest } from '@/lib/admin/marketing/drafts/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const gate = await requireAdminApi({ surface: 'api/marketing/drafts/apply', capability: 'inhalte-moderieren' })
    if (!gate.ok) return draftHttpFailure(gate.response.status === 401 ? 'unauthenticated' : gate.response.status === 503 ? 'unavailable' : 'forbidden')
    if (!adminWriteErlaubt({ grant: gate.grant }).erlaubt) return draftHttpFailure('forbidden')
    return marketingDraftRequest(request, 'apply', gate.user.id)
  } catch { return draftHttpFailure('unknown') }
}
