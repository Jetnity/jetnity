// app/account/bookings/page.tsx
//
// AP-10-S1: kontoweite, read-only Übersicht ausdrücklich bestätigter Buchungen.
// Geschützt über die bestehende Account-Shell und den `/account`-Proxy.
// Kein Write-Pfad, keine Preise, keine Provider-Bestätigung.

import type { Metadata } from 'next'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import { buchungenLaden } from '@/lib/account/buchungen-daten'

export const metadata: Metadata = {
  title: 'Bestätigte Buchungen',
  description: 'Reisebestandteile, die du in Jetnity ausdrücklich als gebucht bestätigt hast.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountBuchungenSeite() {
  const { zeilen, problem, abgeschnitten } = await buchungenLaden()

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <AccountBuchungen problem={problem} buchungen={zeilen} abgeschnitten={abgeschnitten} />
      </div>
    </main>
  )
}
