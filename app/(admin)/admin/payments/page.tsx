export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminPage } from '@/lib/auth/admin-guard'
import PaymentsCenter from '@/components/admin/payments/PaymentsCenter'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'

export default async function PaymentsPage() {
  await requireAdminPage({ surface: 'payments' })
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {ADMIN_EHRLICHE_TEXTE.zahlungenTitel}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Lokale Einträge, Transaktionen und Erstattungsnotizen.</p>
      </header>
      <PaymentsCenter />
    </section>
  )
}
