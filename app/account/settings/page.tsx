import type { Metadata } from 'next'
import EinstellungenInhalt from '@/components/account/ui-einstellungen-1/EinstellungenInhalt'
import { loeschUmgebungErlaubt } from '@/lib/account/kontoloeschung-vertrag'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'
import { uiEinstellungenNeuLaden, uiEinstellungenSpeichern } from '@/lib/account/ui-einstellungen-1/aktionen'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Einstellungen / Settings',
  description: 'Jetnity Kontoeinstellungen / Account settings.',
  robots: { index: false, follow: false },
}

export default async function AccountEinstellungenSeite() {
  const initial = await uiEinstellungenFuerSeite()
  const loeschungAngeboten = loeschUmgebungErlaubt(process.env.NEXT_PUBLIC_SUPABASE_URL)
  return <main><EinstellungenInhalt initial={initial} bereich="konto" loeschungAngeboten={loeschungAngeboten} speichern={uiEinstellungenSpeichern} neuLaden={uiEinstellungenNeuLaden} /></main>
}
