export const dynamic = 'force-dynamic'

import IndexingStatus from '@/components/admin/system-health/IndexingStatus'
import SystemHealthBoard from '@/components/admin/system-health/SystemHealthBoard'
import { ladeSeoStatusFuerSeite } from '@/lib/admin/seo-status-server'
import { ladeSystemHealthFuerSeite } from '@/lib/admin/system-health/runtime'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function SystemHealthPage() {
  await requireAdminPage({ surface: 'system-health', capability: 'betrieb-lesen' })
  const bericht = await ladeSystemHealthFuerSeite()
  const indexierung = ladeSeoStatusFuerSeite()

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <Seitenkopf kicker="Administration" titel="System Health">
        <p>Erreichbarkeit und Plattformstatus auf Basis der verfügbaren Nachweise.</p>
      </Seitenkopf>
      <SystemHealthBoard anfang={bericht} />
      <IndexingStatus stand={indexierung} />
    </section>
  )
}
