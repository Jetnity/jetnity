// app/unauthorized/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { signOutAction } from '@/app/auth/sign-out'
import { leseOptionalRequestParam } from '@/lib/next/request-api'
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
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  const params = await leseOptionalRequestParam(searchParams)
  const pruefungFehlgeschlagen = params?.grund === 'lookup-failed'

  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-bold">
        {pruefungFehlgeschlagen ? 'Prüfung nicht möglich' : 'Kein Zugriff'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {pruefungFehlgeschlagen
          ? 'Deine Berechtigung konnte gerade nicht geprüft werden. Bitte versuche es in einigen Minuten erneut.'
          : 'Dieses Konto hat keinen Zugang zur Administration. Bitte wende dich an eine Person mit Inhaber- oder Administrationsrolle.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6">
        <Link className="inline-flex min-h-11 items-center underline" href="/">
          Zur Startseite
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="inline-flex min-h-11 items-center underline">
            Abmelden
          </button>
        </form>
      </div>
    </main>
  )
}
