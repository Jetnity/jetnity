import { redirect } from 'next/navigation'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { getAtHumanRelease } from '@/lib/readiness/official-truth-at-method-v1/at-human-release'
import { HUMAN_METHOD_PRODUCTION_URL } from '@/lib/readiness/official-truth-product-v3/method/human-contract'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import MethodAuthorityPanel from '../method/MethodAuthorityPanel'

export const dynamic = 'force-dynamic'

export default async function AustriaMethodPage() {
  const gate = await requireAdminPage({ surface: 'official-truth-method', capability: 'official-truth-freigeben' })
  if (gate.role !== 'owner' || gate.grant !== 'role') redirect('/unauthorized?grund=owner_required')
  const release = getAtHumanRelease()
  return <section className="mx-auto max-w-2xl space-y-6">
    <Seitenkopf kicker="Amtliche Quellen" titel="Österreich · amtliche V3-Visummethode">
      <p>{release?.targetUrl === HUMAN_METHOD_PRODUCTION_URL
        ? 'Nur nach gesonderter Production-Installation und expliziter Inhaberfreigabe mit Zwei-Faktor-Prüfung.'
        : 'Nur Development. Eine spätere Production-Freigabe ist davon unabhängig.'}
        {' '}{release?.scope.citizenship === 'CH'
          ? 'Nur der gültige gewöhnliche Schweizer Reisepass bei direkter Einreise nach Österreich ist umfasst. Die übrigen 49 Pässe und alle anderen Themen bleiben gesperrt.'
          : 'Die 50 Pässe sind keine 50 automatisch bestätigten Visaentscheidungen. Jede Passregel benötigt eigene amtliche Qualifikation und aktuelle Source-, MA1- und BG1-Nachweise.'}</p>
    </Seitenkopf>
    <MethodAuthorityPanel key={release?.selectionId ?? 'at-unselected'} release={release} />
  </section>
}
