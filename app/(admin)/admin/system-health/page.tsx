export const dynamic = 'force-dynamic'

import IndexingStatus from '@/components/admin/system-health/IndexingStatus'
import SystemHealthBoard from '@/components/admin/system-health/SystemHealthBoard'
import { ladeSeoStatusFuerSeite } from '@/lib/admin/seo-status-server'
import { ladeSystemHealthFuerSeite } from '@/lib/admin/system-health/runtime'
import { requireAdminPage } from '@/lib/auth/admin-guard'

export default async function SystemHealthPage() {
  await requireAdminPage({ surface: 'system-health', capability: 'betrieb-lesen' })
  const bericht = await ladeSystemHealthFuerSeite()
  const indexierung = ladeSeoStatusFuerSeite()

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">System Health</h2>
        <p className="text-sm text-muted-foreground">
          Read-only. Ein Dienst ist nur gesund, wenn eine reale, frische Quelle das trägt. Fehlt die
          Quelle, bleibt der Zustand unbekannt oder nicht konfiguriert.
        </p>
      </header>
      <SystemHealthBoard anfang={bericht} />
      <IndexingStatus stand={indexierung} />
    </section>
  )
}
