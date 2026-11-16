export const dynamic = 'force-dynamic'

import ContentInventory from '@/components/admin/content/ContentInventory'
import { readContentInventory } from '@/lib/admin/content/inventory'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import type { PageRequestParam } from '@/lib/next/request-api'

export default async function ContentPage({ searchParams }: {
  searchParams?: PageRequestParam<Record<string, string | string[] | undefined>>
}) {
  await requireAdminPage({ surface: 'content', capability: 'inhalte-moderieren' })
  const inventory = readContentInventory((await searchParams) ?? {})
  return <ContentInventory inventory={inventory} observedAt={new Date().toISOString()} />
}
