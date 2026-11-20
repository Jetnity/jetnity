export const dynamic = 'force-dynamic'
export const revalidate = 0

import SecurityWidget from '@/components/admin/security/SecurityWidget'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function SecurityPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <Seitenkopf kicker="Administration" titel={ADMIN_EHRLICHE_TEXTE.securityTitel}>
        <p>Aufgezeichnete Ereignisse und lokale Blocklisteneinträge.</p>
      </Seitenkopf>

      <SecurityWidget />
    </section>
  )
}
