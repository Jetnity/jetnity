import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getAtHumanRelease } from '@/lib/readiness/official-truth-at-method-v1/at-human-release'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import MethodAuthorityPanel from '../method/MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function AustriaMethodPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const release = getAtHumanRelease()
  const chOnly = release?.scope.citizenship === 'CH'
  return <section className="mx-auto max-w-3xl space-y-6 px-4 py-6">
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold">Österreich · amtliche V3-Visummethode</h1>
      <p>{release?.targetUrl === HUMAN_METHOD_PRODUCTION_URL
        ? 'Nur nach gesonderter Production-Installation und expliziter Inhaberfreigabe mit Zwei-Faktor-Prüfung.'
        : 'Nur Development. Eine spätere Production-Freigabe ist davon unabhängig.'}
        {' '}{chOnly
          ? 'Ausschliesslich CH→AT: gültiger gewöhnlicher Schweizer Reisepass, direkte Einreise und Visumfreiheit. Die BMEIA-Rohfassung bleibt changed; eine Methodenfreigabe allein veröffentlicht keine neue Regel.'
          : 'Die 50 Pässe sind keine 50 automatisch bestätigten Visaentscheidungen. Jede Passregel benötigt eigene amtliche Qualifikation und aktuelle Source-, MA1- und BG1-Nachweise.'}</p>
    </header>
    <MethodAuthorityPanel key={release?.selectionId ?? 'at-unselected'} release={release} />
  </section>
}
