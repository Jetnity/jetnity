export const dynamic = 'force-dynamic'

import CmsEditor from '@/components/admin/content/cms-editor-2/CmsEditor'
import { cmsReference } from '@/lib/admin/content/cms/contract'
import { cmsEditorRuntime } from '@/lib/admin/content/cms-editor-2/server'
import { parseCmsRecoveryMarker } from '@/lib/admin/content/cms-editor-2/request'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'

export default async function CmsEditorPage({ searchParams }: { searchParams: Promise<{
  entry?: string | string[]; cmsRequestId?: string | string[]; cmsExpectedVersion?: string | string[]
}> }) {
  await requireAdminPage({ surface: 'content', capability: 'inhalte-moderieren' })
  const [settings, query] = await Promise.all([uiEinstellungenFuerSeite(), searchParams])
  const selected = typeof query.entry === 'string' ? cmsReference(query.entry) : null
  const hasRecovery = query.cmsRequestId !== undefined || query.cmsExpectedVersion !== undefined
  const recovery = hasRecovery ? parseCmsRecoveryMarker({ requestId: query.cmsRequestId, entryId: query.entry, expectedVersion: query.cmsExpectedVersion }) : null
  return <CmsEditor key={selected?.entryId ?? INSPIRATION_ZIELE[0].placeId}
    sprache={settings.status === 'bereit' ? settings.sprache : 'de'}
    initialEntryId={selected?.entryId ?? INSPIRATION_ZIELE[0].placeId} recovery={recovery}
    runtime={hasRecovery && !recovery ? 'unavailable' : cmsEditorRuntime()} />
}
