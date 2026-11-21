import 'server-only'

import { connection } from 'next/server'
import { isAdminHostedRuntimeEnabled } from '@/lib/admin/hosted-runtime-activation'
import { readCmsPublished } from '@/lib/admin/content/cms-editor-2/server'
import { ENTDECKEN_ZIELE } from './explorer-1/katalog'
import { cmsPublishedInspiration, type PublicInspiration } from './cms-public'
import { supplementInspirationCatalog } from './catalog-supplement'
import { isCmsPreviewReadEnabled } from './cms-preview-read'

export async function publicInspiration(): Promise<PublicInspiration> {
  if (!isAdminHostedRuntimeEnabled() && !isCmsPreviewReadEnabled()) return { status: 'static', ziele: ENTDECKEN_ZIELE }
  // Keep the active Dev CMS outside prerendering; a missing installation must
  // not become a cached publication state. A disabled deployment uses the static catalogue.
  await connection()
  const published = cmsPublishedInspiration(await readCmsPublished(AbortSignal.timeout(8_000)))
  if (published.status === 'unavailable') return { status: 'fallback', ziele: ENTDECKEN_ZIELE }
  const ziele = supplementInspirationCatalog(published.ziele, ENTDECKEN_ZIELE)
  return { status: ziele.length > published.ziele.length ? 'supplemented' : 'published', ziele }
}
