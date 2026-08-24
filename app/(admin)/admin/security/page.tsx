export const dynamic = 'force-dynamic'
export const revalidate = 0

import SecurityWidget from '@/components/admin/security/SecurityWidget'
import { ADMIN_EHRLICHE_TEXTE } from '@/lib/admin/ehrliche-zustaende'

export default async function SecurityPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          {ADMIN_EHRLICHE_TEXTE.securityTitel}
        </h2>
        <p className="text-sm text-muted-foreground">{ADMIN_EHRLICHE_TEXTE.securityHinweis}</p>
      </header>

      <SecurityWidget />
    </section>
  )
}
