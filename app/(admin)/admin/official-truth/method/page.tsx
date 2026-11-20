import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import MethodAuthorityPanel from './MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function HumanMethodPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const release = getHumanRelease()
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <Seitenkopf kicker="Amtliche Quellen" titel="Amtliche Visumquelle: Methode freigeben">
        <p>Hier prüfst und bestätigst du die ausgewählte Methode für Schweizer Pässe und Deutschland {release?.targetUrl === HUMAN_METHOD_PRODUCTION_URL ? 'auf jetnity.com' : 'in der Entwicklungsumgebung'}.</p>
      </Seitenkopf>
      <MethodAuthorityPanel key={release?.selectionId ?? 'unselected'} release={release} />
    </section>
  )
}
