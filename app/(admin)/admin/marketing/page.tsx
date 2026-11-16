export const dynamic = 'force-dynamic'

import MarketingLinks from '@/components/admin/marketing/MarketingLinks'
import CampaignDrafts from '@/components/admin/marketing/CampaignDrafts'
import { isAdminHostedRuntimeEnabled } from '@/lib/admin/hosted-runtime-activation'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'

export default async function MarketingPage() {
  const initial = await uiEinstellungenFuerSeite()
  const sprache = initial.status === 'bereit' ? initial.sprache : 'de'
  return <div className="min-w-0 space-y-8">
    <h1 className="text-3xl font-semibold">Marketing</h1>
    <CampaignDrafts sprache={sprache} enabled={isAdminHostedRuntimeEnabled()} />
    <MarketingLinks sprache={sprache} headingLevel={2} />
  </div>
}
