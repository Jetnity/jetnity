// app/(admin)/admin/page.tsx
export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import AdminCommandPalette from '@/components/admin/AdminCommandPalette'
import CopilotDockPanel from '@/components/admin/CopilotDockPanel'
import AdminStatsStrip from '@/components/admin/home/AdminStatsStrip'
import AdminTimeSeries from '@/components/admin/home/AdminTimeSeries'
import AdminSetupGuide from '@/components/admin/home/AdminSetupGuide'
import AdminHealthCards from '@/components/admin/home/AdminHealthCards'

export default async function AdminHomePage() {
  await requireAdmin()

  return (
    <>
      <AdminCommandPalette />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Hauptspalte */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Rechte Spalte: CoPilot fest integriert */}
        <aside className="lg:col-span-1">
          <CopilotDockPanel />
        </aside>
      </div>
    </>
  )
}
