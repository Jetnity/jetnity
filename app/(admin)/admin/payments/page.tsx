export const dynamic = 'force-dynamic'
export const revalidate = 0

import { requireAdminPage } from '@/lib/auth/admin-guard'
import PaymentsCenter from '@/components/admin/payments/PaymentsCenter'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function PaymentsPage() {
  await requireAdminPage({ surface: 'payments' })
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <Seitenkopf kicker="Administration" titel={ADMIN_EHRLICHE_TEXTE.zahlungenTitel}>
        <p>Lokale Einträge, Transaktionen und Erstattungsnotizen.</p>
      </Seitenkopf>
      <PaymentsCenter />
    </section>
  )
}
