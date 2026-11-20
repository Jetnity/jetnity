export const dynamic = 'force-dynamic'

import MarketingLinks from '@/components/admin/marketing/MarketingLinks'
import CampaignDrafts from '@/components/admin/marketing/CampaignDrafts'
import { isAdminHostedRuntimeEnabled } from '@/lib/admin/hosted-runtime-activation'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'
import { Seitenkopf } from '@/components/ui/seitenkopf'

export default async function MarketingPage() {
  const initial = await uiEinstellungenFuerSeite()
  const sprache = initial.status === 'bereit' ? initial.sprache : 'de'
  return <div className="mx-auto min-w-0 max-w-7xl space-y-8">
    <Seitenkopf kicker="Administration" titel="Marketing" />
    <CampaignDrafts sprache={sprache} enabled={isAdminHostedRuntimeEnabled()} />
    <MarketingLinks sprache={sprache} headingLevel={2} />
  </div>
}
