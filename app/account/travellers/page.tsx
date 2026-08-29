// app/account/travellers/page.tsx
//
// AP-7-S3: echte Account-Registry-Fläche. Keine Trip-Materialisierung.

import type { Metadata } from 'next'

import AccountReisende from '@/components/account/AccountReisende'
import { registryLaden } from '@/lib/traveller/account-registry-daten'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reisende',
  description: 'Wiederverwendbare Reisendenangaben in deinem Jetnity-Konto.',
  robots: { index: false, follow: false },
}

export default async function AccountReisendeSeite() {
  const { zeilen, problem } = await registryLaden()

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <AccountReisende problem={problem} travellers={zeilen} />
      </div>
    </main>
  )
}
