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

export const metadata: Metadata = {
  title: 'Bestätigte Buchungen',
  description: 'Reisebestandteile, die du in Jetnity ausdrücklich als gebucht bestätigt hast.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountBuchungenSeite({
  searchParams,
}: {
  searchParams?: PageRequestParam<BuchungenRohQuery>
}) {
  const roh = (await leseOptionalRequestParam(searchParams)) ?? {}
  const ergebnis = await buchungenFuerParameter(roh)
  const ansicht = buchungenAnsichtAus(ergebnis)

  return (
    <main className="min-w-0 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto min-w-0 max-w-3xl">
        <AccountBuchungen ansicht={ansicht} />
      </div>
    </main>
  )
}
