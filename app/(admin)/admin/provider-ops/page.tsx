export const dynamic = 'force-dynamic'

import ProviderOpsBoard from '@/components/admin/provider-ops/ProviderOpsBoard'
import { ladeProviderOpsBoardFuerSeite } from '@/lib/admin/provider-ops-board/runtime'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function ProviderOpsPage() {
  await requireAdminPage({ surface: 'provider-ops', capability: 'betrieb-lesen' })
  const bericht = await ladeProviderOpsBoardFuerSeite()

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <Seitenkopf kicker="Administration" titel="Provider & Kosten">
        <p>Nutzungsprotokoll, Provider-Status und technische Grundlagen im Überblick.</p>
      </Seitenkopf>
      <ProviderOpsBoard anfang={bericht} />
    </section>
  )
}
