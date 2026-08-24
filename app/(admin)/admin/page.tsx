export const dynamic = 'force-dynamic'

import AdminStatsStrip from '@/components/admin/home/AdminStatsStrip'
import AdminTimeSeries from '@/components/admin/home/AdminTimeSeries'
import AdminNaechsteSchritte from '@/components/admin/home/AdminNaechsteSchritte'
import AdminHealthCards from '@/components/admin/home/AdminHealthCards'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'

export default async function AdminHomePage() {
  return (
    <div className="grid gap-6">
      <section className="bg-card rounded-2xl border border-border p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Steuerzentrale
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Operative Lage</h2>
        <p className="mt-2 text-sm text-muted-foreground">{ADMIN_EHRLICHE_TEXTE.steuerzentraleLage}</p>
      </section>

      <section className="bg-card rounded-2xl border border-border p-5">
        <AdminStatsStrip />
      </section>

      <section className="bg-card rounded-2xl border border-border p-5">
        <AdminTimeSeries />
      </section>

      <section className="bg-card rounded-2xl border border-border p-5">
        <AdminNaechsteSchritte />
      </section>

      <section className="bg-card rounded-2xl border border-border p-5">
        <AdminHealthCards />
      </section>
    </div>
  )
}
