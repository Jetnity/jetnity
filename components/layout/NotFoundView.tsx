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
    <main className="min-h-[70dvh] px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-panel border border-border bg-card p-6 text-center shadow-card sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-kicker uppercase text-muted-foreground">
            Fehler 404
          </p>
          <h1 className="mt-2 text-display text-foreground [overflow-wrap:anywhere]">
            Diese Seite gibt es nicht.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-body text-muted-foreground">
            Vielleicht wurde die Adresse geändert. Deine Reisen und dein Reiseentwurf bleiben
            unverändert erreichbar.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <GastCreateLink
              createHref="/planen"
              createLabel="Reise planen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reise planen
            </GastCreateLink>
            <Link
              href="/reisen"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Meine Reisen
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-2 font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zurück
            </button>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-control px-2 font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
