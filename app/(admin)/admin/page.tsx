export const dynamic = 'force-dynamic'

import AdminAccountCounts from '@/components/admin/home/AdminAccountCounts'
import AdminStatsStrip from '@/components/admin/home/AdminStatsStrip'
import AdminTimeSeries from '@/components/admin/home/AdminTimeSeries'
import AdminLagehinweise from '@/components/admin/home/AdminLagehinweise'
import AdminModellnutzungHinweis from '@/components/admin/home/AdminModellnutzungHinweis'
import AdminNaechsteSchritte from '@/components/admin/home/AdminNaechsteSchritte'
import AdminHealthCards from '@/components/admin/home/AdminHealthCards'
import { isAdminAccountCountsRuntimeEnabled } from '@/lib/admin/account-counts-delivery/activation'
import AdminSnapshotRefresh from '@/components/admin/AdminSnapshotRefresh'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function AdminHomePage() {
  const accountCountsLocal = isAdminAccountCountsRuntimeEnabled()

  return (
    <div className="mx-auto grid min-w-0 max-w-7xl gap-5">
      <Seitenkopf kicker="Administration" titel="Operative Lage">
        <p>Betrieb im Überblick. Nur lesend, als Momentaufnahme.</p>
      </Seitenkopf>
      <AdminSnapshotRefresh observedAt={new Date().toISOString()} />
      <section aria-labelledby="admin-gesamtbild" className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 id="admin-gesamtbild" className="sr-only">Gesamtbild</h2>
        <AdminLagehinweise />
        <div className="mt-5 grid min-w-0 gap-5 md:grid-cols-2">
          <AdminStatsStrip />
          <AdminHealthCards />
        </div>
      </section>

      {accountCountsLocal ? (
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <AdminAccountCounts />
        </section>
      ) : null}

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <AdminTimeSeries />
        </section>
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <AdminModellnutzungHinweis />
        </section>
      </div>

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <AdminNaechsteSchritte />
      </section>
    </div>
  )
}
