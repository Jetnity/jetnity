import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

import { Statuskarte, statusAktionHaupt } from '@/components/ui/statuskarte'

export const metadata: Metadata = {
  title: 'Konto gelöscht',
  description: 'Dieses Jetnity-Konto und die dazu gespeicherten Reisedaten wurden gelöscht.',
  robots: { index: false, follow: false },
}

export default function KontoGeloeschtSeite() {
  return (
    <main className="min-h-[70dvh] px-4 py-14 sm:px-6 sm:py-20">
      <Statuskarte
        symbol={CheckCircle2}
        kicker="Konto"
        titel="Konto gelöscht"
        aktionen={
          <Link href="/" className={statusAktionHaupt}>
            Zur Startseite
          </Link>
        }
      >
        <p>
          Dieses Jetnity-Konto wurde gelöscht. Die dazu gespeicherten Reisen, Reisenden und Besuche
          sind entfernt. Eine Wiederherstellung dieses Kontos ist nicht vorgesehen.
        </p>
      </Statuskarte>
    </main>
  )
}
