// app/(public)/planen/page.tsx
//
// Das Formular für eine neue Reise.
//
// Ob die Reise im Konto oder im Browser entsteht, entscheidet der Server:
// `auth.getUser()` prüft das Token beim Auth-Server. Die Antwort geht als
// `angemeldet` in beide Einstiege. Der Client selbst darf das nicht beantworten –
// er könnte es behaupten, und die Server Action würde ihn korrigieren, aber erst
// nach dem Absenden.
//
// Seit Phase 2.1 gibt es zwei Einstiege, und ihre Reihenfolge ist eine Aussage:
// Die freie Beschreibung steht oben, das Formular darunter. Das Formular bleibt
// vollständig – es ist der Weg, der ohne Modell funktioniert, und genau deshalb
// wird er nicht ersetzt. Ist die intelligente Planung nicht freigegeben, sagt der
// obere Teil das und der untere trägt die Reise weiter.

import type { Metadata } from 'next'

import { createServerComponentClient } from '@/lib/supabase/server'
import Reiseidee from '@/components/trips/Reiseidee'
import TripPlanner from '@/components/trips/TripPlanner'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { planenRobots } from '@/lib/seo/index-grenze'
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'
import { GRENZEN } from '@/lib/trips/schema'
import { VORSCHLAG_GRENZEN } from '@/lib/reisevorschlag/schema'

type PlanenSeiteProps = {
  searchParams?: {
    idee?: string | string[]
    ziel?: string | string[]
    zielId?: string | string[]
  }
}

export function generateMetadata({ searchParams }: PlanenSeiteProps): Metadata {
  const robots = planenRobots(searchParams)
  // Nur die parametrisierte Variante setzt ein eigenes Signal. `robots: undefined`
  // würde in Next die geerbte öffentliche Basis (`index, follow`) löschen.
  return {
    title: 'Reise planen',
    description: 'Erstelle deine Reise mit Jetnity.',
    alternates: { canonical: kanonischeUrl('/planen') },
    ...(robots ? { robots } : {}),
  }
}

export const dynamic = 'force-dynamic'

/**
 * Sol 120 s plus Terra-Fallback. Next.js verlangt hier ein Literal;
 * dieselbe Zahl steht in `SEITEN_DAUER_S` (`lib/modell/konfiguration.ts`).
 */
export const maxDuration = 300

function ersterWert(wert?: string | string[]) {
  return Array.isArray(wert) ? wert[0] : wert
}

export default async function PlanenSeite({ searchParams }: PlanenSeiteProps) {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getUser()

  const idee = ersterWert(searchParams?.idee)
  const ziel = ersterWert(searchParams?.ziel)
  const zielId = ersterWert(searchParams?.zielId)
  const bestaetigt = zielId ? await ortBestaetigen(zielId, 'ziel') : null
  const zielOrt = bestaetigt?.ok ? bestaetigt.wert : null

  const angemeldet = Boolean(data.user)

  return (
    <main className="min-h-screen bg-surface-75 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-10">
        <Reiseidee
          angemeldet={angemeldet}
          initialIdee={idee?.slice(0, VORSCHLAG_GRENZEN.freitextMaximum) ?? ''}
        />

        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-line-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">
            Oder Schritt für Schritt
          </span>
          <span className="h-px flex-1 bg-line-200" />
        </div>

        <TripPlanner
          angemeldet={angemeldet}
          initialDestination={(zielOrt?.name ?? ziel)?.slice(0, GRENZEN.titel) ?? ''}
          initialDestinationId={zielOrt?.id ?? ''}
          initialIdea={idee?.slice(0, GRENZEN.reisewunsch) ?? ''}
        />
      </div>
    </main>
  )
}
