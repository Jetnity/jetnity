import 'server-only'

import { connection } from 'next/server'
import { isAdminDevRuntimeEnabled } from '@/lib/admin/dev-runtime-activation'
import { readCmsPublished } from '@/lib/admin/content/cms-editor-2/server'
import { ENTDECKEN_ZIELE } from './explorer-1/katalog'
import { cmsPublishedInspiration, type PublicInspiration } from './cms-public'

export async function publicInspiration(): Promise<PublicInspiration> {
  if (!isAdminDevRuntimeEnabled()) return { status: 'static', ziele: ENTDECKEN_ZIELE }
  // Keep the active Dev CMS outside prerendering; a missing installation must
  // not become a cached publication state. Production takes the static branch.
  await connection()
  return cmsPublishedInspiration(await readCmsPublished(AbortSignal.timeout(8_000)))
}
