// app/(admin)/admin/analytics/page.tsx
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export default async function AnalyticsPage() {
  await requireAdmin()
  return (
    <div className="grid gap-6">
      <section className="space-y-4">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Berichte & Charts (bald).</p>
      </section>
    </div>
  )
}
 