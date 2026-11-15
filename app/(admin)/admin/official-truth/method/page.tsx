import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getHumanRelease } from '@/lib/readiness/official-truth-product-v3/method/human-release'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import MethodAuthorityPanel from './MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function HumanMethodPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const release = getHumanRelease()
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Amtliche Visumquelle: Methode freigeben</h1>
        <p>Hier prüfst und bestätigst du die ausgewählte Methode für Schweizer Pässe und Deutschland {release?.targetUrl === HUMAN_METHOD_PRODUCTION_URL ? 'auf jetnity.com' : 'in der Entwicklungsumgebung'}.</p>
      </header>
      <MethodAuthorityPanel key={release?.selectionId ?? 'unselected'} release={release} />
    </section>
  )
}
