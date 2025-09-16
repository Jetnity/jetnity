// app/(admin)/admin/payments/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdmin } from '@/lib/auth/requireAdmin'
import PaymentsCenter from '@/components/admin/payments/PaymentsCenter'

export default async function PaymentsPage() {
  const { user } = await requireAdmin()
  return (
    <main className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">Admin · {user.email ?? '—'}</p>
      </header>
      <PaymentsCenter />
    </main>
  )
}
