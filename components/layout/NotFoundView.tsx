'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Compass, MapPin, Plus } from 'lucide-react'

import GastCreateLink from '@/components/trips/GastCreateLink'

/**
 * Gemeinsame 404-Ansicht für Jetnity V2.
 * Führt bewusst nur zu Zielen, die zum Reiseplanen gehören.
 */
export default function NotFoundView() {
  const router = useRouter()

  return (
    <main className="min-h-[70dvh] bg-surface-75 px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[30px] border border-black/5 bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,46,42,0.07)] sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">
            Fehler 404
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-4xl">
            Diese Seite gibt es nicht.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink-800">
            Vielleicht wurde die Adresse geändert. Deine Reisen und dein Reiseentwurf bleiben
            unverändert erreichbar.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <GastCreateLink
              createHref="/planen"
              createLabel="Reise planen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:bg-brand-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reise planen
            </GastCreateLink>
            <Link
              href="/reisen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-300 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:border-line-500"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Meine Reisen
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-11 items-center gap-2 font-medium text-ink-800 transition hover:text-brand-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zurück
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center font-medium text-ink-800 transition hover:text-brand-800"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
