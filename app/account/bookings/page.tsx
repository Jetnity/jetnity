// app/account/bookings/page.tsx
//
// Kontoweite, read-only Übersicht ausdrücklich bestätigter Buchungen.
// Geschützt über die bestehende Account-Shell und den `/account`-Proxy.
// Filter und Fortsetzung stehen in der Adresse. Kein Write-Pfad.

import type { Metadata } from 'next'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import { buchungenAnsichtAus, type BuchungenRohQuery } from '@/lib/account/buchungen-abfrage'
import { buchungenFuerParameter } from '@/lib/account/buchungen-daten'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { BUCHUNGEN_TEXTE } from '@/lib/localization/buchungen-texte'
import { kontoAnzeigesprache } from '@/lib/localization/konto-anzeigesprache'

export async function generateMetadata(): Promise<Metadata> {
  const texte = BUCHUNGEN_TEXTE[await kontoAnzeigesprache()]
  return {
    title: texte.seitenTitel,
    description: texte.metadatenBeschreibung,
    robots: { index: false, follow: false },
  }
}

export const dynamic = 'force-dynamic'

export default async function AccountBuchungenSeite({
  searchParams,
}: {
  searchParams?: PageRequestParam<BuchungenRohQuery>
}) {
  const roh = (await leseOptionalRequestParam(searchParams)) ?? {}
  const [ergebnis, sprache] = await Promise.all([
    buchungenFuerParameter(roh),
    kontoAnzeigesprache(),
  ])
  const ansicht = buchungenAnsichtAus(ergebnis)

  return (
    <main className="min-w-0 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto min-w-0 max-w-3xl">
        <AccountBuchungen ansicht={ansicht} sprache={sprache} />
      </div>
    </main>
  )
}
