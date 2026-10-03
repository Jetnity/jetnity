export const dynamic = 'force-dynamic'

import AdminAccountCounts from '@/components/admin/home/AdminAccountCounts'
import AdminStatsStrip from '@/components/admin/home/AdminStatsStrip'
import AdminTimeSeries from '@/components/admin/home/AdminTimeSeries'
import AdminLagehinweise from '@/components/admin/home/AdminLagehinweise'
import AdminModellnutzungHinweis from '@/components/admin/home/AdminModellnutzungHinweis'
import AdminNaechsteSchritte from '@/components/admin/home/AdminNaechsteSchritte'
import AdminHealthCards from '@/components/admin/home/AdminHealthCards'
import { isAdminAccountCountsRuntimeEnabled } from '@/lib/admin/account-counts-delivery/activation'

export default async function AdminHomePage() {
  const accountCountsLocal = isAdminAccountCountsRuntimeEnabled()

  return (
    <div className="grid min-w-0 gap-5">
      <section aria-labelledby="admin-operative-lage" className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Jetnity · Betrieb im Überblick</p>
            <h2 id="admin-operative-lage" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Operative Lage</h2>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Read-only · Momentaufnahme</span>
        </div>
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
