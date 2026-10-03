export const dynamic = 'force-dynamic'

import ProviderOpsBoard from '@/components/admin/provider-ops/ProviderOpsBoard'
import { ladeProviderOpsBoardFuerSeite } from '@/lib/admin/provider-ops-board/runtime'
import { requireAdminPage } from '@/lib/auth/admin-guard'

export default async function ProviderOpsPage() {
  await requireAdminPage({ surface: 'provider-ops', capability: 'betrieb-lesen' })
  const bericht = await ladeProviderOpsBoardFuerSeite()

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Provider & Kosten</h2>
        <p className="text-sm text-muted-foreground">
          Nutzungsprotokoll, Provider-Status und technische Grundlagen im Überblick.
        </p>
      </header>
      <ProviderOpsBoard anfang={bericht} />
    </section>
  )
}
