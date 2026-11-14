import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import DevOwnerImportPanel from './DevOwnerImportPanel'

export const dynamic = 'force-dynamic'

export default async function DevOwnerImportPage() {
  const release = getHumanRelease()
  const selected = release?.targetUrl === HUMAN_METHOD_DEV_URL && getServerSupabaseUrl() === HUMAN_METHOD_DEV_URL
  if (selected) {
    const gate = await requireAdminPage({ surface: 'official-truth-import', capability: 'official-truth-freigeben' })
    if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  }
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Amtliche Visumquelle: Dev-Import</h1>
        <p>Ein manueller Quellenlauf für Schweizer Reisepässe bei direkter Einreise nach Deutschland.</p>
      </header>
      {selected ? <DevOwnerImportPanel /> : <p role="status">Der manuelle Quellenimport ist für diese Umgebung nicht verfügbar.</p>}
      <p><Link className="underline" href="/admin/official-truth/method">Zur ausgewählten Methode und ihrem Freigabeverlauf</Link></p>
    </section>
  )
}
