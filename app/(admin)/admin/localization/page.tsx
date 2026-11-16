export const dynamic = 'force-dynamic'

import Sprachkatalog from '@/components/admin/localization/Sprachkatalog'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'

export default async function LocalizationPage() {
  const initial = await uiEinstellungenFuerSeite()
  return <Sprachkatalog sprache={initial.status === 'bereit' ? initial.sprache : 'de'} />
}
