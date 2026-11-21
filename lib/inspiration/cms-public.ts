import { parseCmsPublished } from '@/lib/admin/content/cms-editor-2/responses'
import type { CmsPortResult } from '@/lib/admin/content/cms-editor-2/port'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { zielHref } from '@/lib/places/auswahl'
import type { EntdeckenZiel } from './explorer-1/katalog'

export type PublicInspiration = Readonly<{
  status: 'static' | 'published' | 'supplemented' | 'fallback' | 'unavailable'
  ziele: readonly EntdeckenZiel[]
}>

/** Decode only confirmed published revisions. Every mutable CMS field comes
 * from that revision, including the plan URL. The separate public selection
 * may subsequently add existing static catalogue entries, never CMS drafts. */
export function cmsPublishedInspiration(result: CmsPortResult): PublicInspiration {
  const published = result.ok ? parseCmsPublished(result.value) : null
  if (!published) return { status: 'unavailable', ziele: [] }
  const ziele: EntdeckenZiel[] = []
  for (const reference of INSPIRATION_ZIELE) {
    const item = published.items.find(row => row.entryId === reference.placeId)
    if (!item) continue
    ziele.push({ ...reference, idea: item.content.idea, beschreibung: item.content.beschreibung,
      themen: [...item.content.themen], href: zielHref({ id: reference.placeId, name: reference.name }, item.content.idea) })
  }
  return { status: 'published', ziele }
}
