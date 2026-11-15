export const dynamic = 'force-dynamic'

import EinstellungenInhalt from '@/components/account/ui-einstellungen-1/EinstellungenInhalt'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'
import { uiEinstellungenNeuLaden, uiEinstellungenSpeichern } from '@/lib/account/ui-einstellungen-1/aktionen'

export default async function SettingsPage() {
  const initial = await uiEinstellungenFuerSeite()
  return <EinstellungenInhalt initial={initial} bereich="admin" speichern={uiEinstellungenSpeichern} neuLaden={uiEinstellungenNeuLaden} />
}
