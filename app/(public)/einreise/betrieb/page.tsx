import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { selectedGuardEnvironment } from '@/lib/readiness/official-truth-product-v3/runtime/guard-target'
import ProductionGuardRecoveryPanel from '@/components/readiness/ProductionGuardRecoveryPanel'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Einreiseauskunft: Schutzprüfung', robots: { index: false, follow: false } }

export default async function ProductionGuardRecoveryPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-guard', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const selected = selectedGuardEnvironment() === 'Production'
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">Production: Schutzprüfung und Wiederaufnahme</h1>
      <p>Einreiseauskunft CH→DE auf jetnity.com.</p></header>
    {selected ? <ProductionGuardRecoveryPanel /> : <p role="status">Die Production-Wiederaufnahme ist hier nicht verfügbar.</p>}
    <p><Link className="underline" href="/admin/official-truth/method">Methode und vollständiges Quellenpaket prüfen</Link></p>
    <p><Link className="underline" href="/admin/official-truth/import">Zum normalen Quellenlauf</Link></p>
    <p><Link className="underline" href="/einreise">Zur Besucheransicht</Link></p>
  </main>
}
