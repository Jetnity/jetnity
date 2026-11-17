import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getAtHumanRelease } from '@/lib/readiness/official-truth-at-method-v1/at-human-release'
import MethodAuthorityPanel from '../method/MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function AustriaMethodPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const release = getAtHumanRelease()
  return <section className="mx-auto max-w-3xl space-y-6 px-4 py-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold">Österreich · amtliche V3-Visummethode</h1>
      <p>Nur Development. Die 50 Pässe sind keine 50 automatisch bestätigten Visaentscheidungen.
        Die Freigabe bleibt gesperrt, solange der echte HRS2-/BG1-/Besucherweg nicht integriert ist.</p>
    </header>
    <MethodAuthorityPanel key={release?.selectionId ?? 'at-unselected'} release={release} />
  </section>
}
