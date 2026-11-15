export const dynamic = 'force-dynamic'

import MarketingLinks from '@/components/admin/marketing/MarketingLinks'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'

export default async function MarketingPage() {
  const initial = await uiEinstellungenFuerSeite()
  return <MarketingLinks sprache={initial.status === 'bereit' ? initial.sprache : 'de'} />
}
