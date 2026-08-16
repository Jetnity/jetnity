// app/(admin)/admin/page.tsx
export const dynamic = 'force-dynamic'

import AdminStatsStrip from '@/components/admin/home/AdminStatsStrip'
import AdminTimeSeries from '@/components/admin/home/AdminTimeSeries'
import AdminSetupGuide from '@/components/admin/home/AdminSetupGuide'
import AdminHealthCards from '@/components/admin/home/AdminHealthCards'

export default async function AdminHomePage() {
  return (
    <>
      <div className="grid gap-6">
        <div className="space-y-6">
          <section className="bg-card rounded-2xl border border-border p-5">
            <AdminStatsStrip />
          </section>

          <section className="bg-card rounded-2xl border border-border p-5">
            <AdminTimeSeries />
          </section>

          <section className="bg-card rounded-2xl border border-border p-5">
            <AdminSetupGuide />
          </section>

          <section className="bg-card rounded-2xl border border-border p-5">
            <AdminHealthCards />
          </section>
        </div>
      </div>
    </>
  )
}
