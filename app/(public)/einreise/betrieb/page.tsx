import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { selectedGuardEnvironment } from '@/lib/readiness/official-truth-product-v3/runtime/guard-target'
import ProductionGuardRecoveryPanel from '@/components/readiness/ProductionGuardRecoveryPanel'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Einreiseauskunft: Schutzprüfung', robots: { index: false, follow: false } }

export default async function ProductionGuardRecoveryPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-guard', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const selected = selectedGuardEnvironment() === 'Production'
  return <main className="mx-auto max-w-2xl space-y-6 px-5 pb-14 pt-6 text-foreground sm:px-8 sm:pb-20 sm:pt-10">
    <Seitenkopf kicker="Amtliche Quellen" titel="Production: Schutzprüfung und Wiederaufnahme">
      <p>Einreiseauskunft CH→DE auf jetnity.com.</p>
    </Seitenkopf>
    {selected ? <ProductionGuardRecoveryPanel /> : <p role="status">Die Production-Wiederaufnahme ist hier nicht verfügbar.</p>}
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/official-truth/method">Methode und vollständiges Quellenpaket prüfen</Link></p>
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/official-truth/at-source-v3">CH→AT Quellen V3: geschützte Owner-Entscheidung (nur nach Stufe 1)</Link></p>
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/admin/official-truth/import">Zum normalen Quellenlauf</Link></p>
    <p><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/einreise">Zur Besucheransicht</Link></p>
  </main>
}
