'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Compass, MapPin, Plus } from 'lucide-react'

import GastCreateLink from '@/components/trips/GastCreateLink'
import { Statuskarte, statusAktionHaupt, statusAktionNeben, statusFussLink } from '@/components/ui/statuskarte'

/**
 * Gemeinsame 404-Ansicht für Jetnity V2.
 * Führt bewusst nur zu Zielen, die zum Reiseplanen gehören.
 */
export default function NotFoundView() {
  const router = useRouter()

  return (
    <main className="min-h-[70dvh] px-4 py-14 sm:px-6 sm:py-20">
      <Statuskarte
        symbol={Compass}
        kicker="Fehler 404"
        titel="Diese Seite gibt es nicht."
        aktionen={
          <>
            <GastCreateLink createHref="/planen" createLabel="Reise planen" className={statusAktionHaupt}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reise planen
            </GastCreateLink>
            <Link href="/reisen" className={statusAktionNeben}>
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Meine Reisen
            </Link>
          </>
        }
        fuss={
          <>
            <button type="button" onClick={() => router.back()} className={statusFussLink}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zurück
            </button>
            <Link href="/" className={statusFussLink}>
              Zur Startseite
            </Link>
          </>
        }
      >
        <p>
          Vielleicht wurde die Adresse geändert. Deine Reisen und dein Reiseentwurf bleiben
          unverändert erreichbar.
        </p>
      </Statuskarte>
    </main>
  )
}
