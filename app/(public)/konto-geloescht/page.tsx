import type { Metadata } from 'next'
import Link from 'next/link'

import { KONTO_LOESCHUNG_TEXTE } from '@/lib/account/kontoloeschung-zustand'
import { leseRequestParam, type PageRequestParam } from '@/lib/next/request-api'

export const metadata: Metadata = {
  title: 'Konto gelöscht',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Suche = { stand?: string }

export default async function KontoGeloeschtSeite({
  searchParams,
}: {
  searchParams: PageRequestParam<Suche>
}) {
  const params = await leseRequestParam(searchParams)
  const text =
    params.stand === 'ereignisse'
      ? KONTO_LOESCHUNG_TEXTE.residual
      : params.stand === 'bereits'
        ? KONTO_LOESCHUNG_TEXTE.bereits
        : KONTO_LOESCHUNG_TEXTE.erfolg

  return (
    <main className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Jetnity</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          Konto gelöscht
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-700" role="status">
          {text}
        </p>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          Reisen, Reisende und bestätigte Besuche dieses Kontos sind dauerhaft entfernt. Eine
          Wiederherstellung gibt es nicht.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  )
}
