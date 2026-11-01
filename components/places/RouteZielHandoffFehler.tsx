'use client'

import { useState } from 'react'
import Link from 'next/link'

type RouteZielHandoffFehlerProps = {
  meldung: string
  wiederholen?: boolean
}

export default function RouteZielHandoffFehler({ meldung, wiederholen = false }: RouteZielHandoffFehlerProps) {
  const [laedt, setLaedt] = useState(false)
  return (
    <section
      role="alert"
      className="min-w-0 max-w-full rounded-[28px] border border-line-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-[-0.04em] text-brand-900">
        Diese Route konnte nicht übernommen werden.
      </h2>
      <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-ink-900 sm:text-base">
        {meldung}
      </p>
      {wiederholen && (
        <button type="button" disabled={laedt} onClick={() => { setLaedt(true); window.location.reload() }}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-brand-600 px-5 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:opacity-50">
          {laedt ? 'Wird geprüft …' : 'Erneut versuchen'}
        </button>
      )}
      <p className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Zur Startseite
        </Link>
      </p>
    </section>
  )
}
