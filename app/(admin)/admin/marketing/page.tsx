// app/(admin)/admin/marketing/page.tsx
export const dynamic = 'force-dynamic'
import { requireAdmin } from '@/lib/auth/requireAdmin'
export default async function MarketingPage() {
  await requireAdmin()
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Marketing</h1>
      <p className="text-sm text-muted-foreground">Kampagnen & Budgets – folgt.</p>
    </div>
  )
}
