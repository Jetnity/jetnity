import 'server-only'

import { connection } from 'next/server'
import { isAdminHostedRuntimeEnabled } from '@/lib/admin/hosted-runtime-activation'
import { readCmsPublished } from '@/lib/admin/content/cms-editor-2/server'
import { ENTDECKEN_ZIELE } from './explorer-1/katalog'
import { cmsPublishedInspiration, type PublicInspiration } from './cms-public'

export async function publicInspiration(): Promise<PublicInspiration> {
  if (!isAdminHostedRuntimeEnabled()) return { status: 'static', ziele: ENTDECKEN_ZIELE }
  // Keep the active Dev CMS outside prerendering; a missing installation must
  // not become a cached publication state. A disabled deployment uses the static catalogue.
  await connection()
  return cmsPublishedInspiration(await readCmsPublished(AbortSignal.timeout(8_000)))
}
