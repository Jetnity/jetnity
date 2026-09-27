import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Konto gelöscht',
  description: 'Dieses Jetnity-Konto und die dazu gespeicherten Reisedaten wurden gelöscht.',
  robots: { index: false, follow: false },
}

export default function KontoGeloeschtSeite() {
  return (
    <main className="bg-surface-75 px-4 py-16 text-brand-800 sm:px-6">
      <article className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Konto</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">Konto gelöscht</h1>
        <p className="mt-4 text-sm leading-6 text-ink-700">
          Dieses Jetnity-Konto wurde gelöscht. Die dazu gespeicherten Reisen, Reisenden und Besuche
          sind entfernt. Eine Wiederherstellung dieses Kontos ist nicht vorgesehen.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-2xl bg-brand-800 px-4 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Zur Startseite
        </Link>
      </article>
    </main>
  )
}
