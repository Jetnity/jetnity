// app/unauthorized/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldX, TriangleAlert } from 'lucide-react'

import { signOutAction } from '@/app/auth/sign-out'
import GlobalesAbmeldenForm from '@/components/auth/GlobalesAbmeldenForm'
import { Statuskarte, statusAktionHaupt, statusAktionNeben } from '@/components/ui/statuskarte'
import PublicChrome from '@/components/workspace/PublicChrome'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { NICHT_INDEXIEREN } from '@/lib/seo/index-grenze'

export const metadata: Metadata = {
  robots: NICHT_INDEXIEREN,
}

/**
 * Die Seite unterscheidet zwei Fälle, weil sie sich für die Besucherin
 * unterschiedlich anfühlen: Eine fehlende Berechtigung bleibt bestehen, ein
 * Ausfall der Prüfung ist vorübergehend. Vorher stand in beiden Fällen, dem
 * Konto fehle die Berechtigung – bei einem Ausfall war das schlicht falsch.
 */
type SearchParams = { grund?: string }

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams?: PageRequestParam<SearchParams>
}) {
  const params = await leseOptionalRequestParam(searchParams)
  const pruefungFehlgeschlagen = params?.grund === 'lookup-failed'

  return (
    <PublicChrome>
      <main className="min-h-[70dvh] px-4 py-14 sm:px-6 sm:py-20">
        <Statuskarte
          symbol={pruefungFehlgeschlagen ? TriangleAlert : ShieldX}
          ton={pruefungFehlgeschlagen ? 'fehler' : 'ruhig'}
          kicker="Administration"
          titel={pruefungFehlgeschlagen ? 'Prüfung nicht möglich' : 'Kein Zugriff'}
          aktionen={
            <>
              <Link className={statusAktionHaupt} href="/">
                Zur Startseite
              </Link>
              <GlobalesAbmeldenForm action={signOutAction}>
                <button type="submit" className={`${statusAktionNeben} w-full`}>
                  Abmelden
                </button>
              </GlobalesAbmeldenForm>
            </>
          }
        >
          <p>
            {pruefungFehlgeschlagen
              ? 'Deine Berechtigung konnte gerade nicht geprüft werden. Bitte versuche es in einigen Minuten erneut.'
              : 'Dieses Konto hat keinen Zugang zur Administration. Bitte wende dich an eine Person mit Inhaber- oder Administrationsrolle.'}
          </p>
        </Statuskarte>
      </main>
    </PublicChrome>
  )
}
