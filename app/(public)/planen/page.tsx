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
//
// `zielIds` ist transienter Routeneinstieg. Fehlt eine Bestätigung, entsteht
// keine Teilroute und kein Erfolgspfad.

import type { Metadata } from 'next'

import { lese } from '@/lib/api/datenbank-lesen'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { createServerComponentClient } from '@/lib/supabase/server'
import PlanenCreateGate from '@/components/trips/PlanenCreateGate'
import {
  PlanenManuellZeiger,
  PlanenManuellZiel,
} from '@/components/trips/PlanenEinstiegNavigation'
import RouteZielHandoffFehler from '@/components/places/RouteZielHandoffFehler'
import Reiseidee from '@/components/trips/Reiseidee'
import TripPlanner from '@/components/trips/TripPlanner'
import { ORT_SPALTEN, ortAusZeile, type OrtZeile } from '@/lib/places/abbildung'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { istOrtId, type Ort } from '@/lib/places/domain'
import {
  routeEinstiegAusParams,
  routeZieleBestaetigen,
} from '@/lib/places/route-einstieg'
import { planenRobots } from '@/lib/seo/index-grenze'
import { htmlRobots } from '@/lib/seo/oeffentliche-metadata'
import { kanonischeUrl } from '@/lib/seo/oeffentlicher-origin'
import { planenVorbelegung } from '@/lib/trips/create-entry'
import { GRENZEN } from '@/lib/trips/schema'
import { VORSCHLAG_GRENZEN } from '@/lib/reisevorschlag/schema'

type PlanenSearchParams = {
  idee?: string | string[]
  ziel?: string | string[]
  zielId?: string | string[]
  zielIds?: string | string[]
}

type PlanenSeiteProps = {
  searchParams?: PageRequestParam<PlanenSearchParams>
}

export async function generateMetadata({ searchParams }: PlanenSeiteProps): Promise<Metadata> {
  const params = await leseOptionalRequestParam(searchParams)
  const robots = planenRobots(params) ?? htmlRobots()
  // Next setzt bei generateMetadata ohne robots-Feld wieder index,follow.
  // Deshalb immer ein explizites Signal: Param-Varianten bleiben noindex,
  // die Basis folgt htmlRobots() und damit darfIndexieren.
  return {
    title: 'Reise planen',
    description: 'Erstelle deine Reise mit Jetnity.',
    alternates: { canonical: kanonischeUrl('/planen') },
    robots,
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

async function routeOrteLesen(
  client: Awaited<ReturnType<typeof createServerComponentClient>>,
  ids: string[],
): Promise<Ort[] | null> {
  const eindeutig = [...new Set(ids.filter((id) => istOrtId(id)))]
  if (eindeutig.length === 0) return []
  const gelesen = await lese(() => client.from('places').select(ORT_SPALTEN).in('id', eindeutig))
  if (gelesen.problem) return null
  return gelesen.zeilen
    .map((zeile) => ortAusZeile(zeile as OrtZeile))
    .filter((ort): ort is Ort => ort !== null)
}

export default async function PlanenSeite({ searchParams }: PlanenSeiteProps) {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const params = await leseOptionalRequestParam(searchParams)
  const angemeldet = Boolean(data.user)
  const idee = ersterWert(params?.idee)
  const route = routeEinstiegAusParams(params)

  let handoffFehler: string | null = null
  let bestaetigteRoute: Ort[] = []

  if (route.art === 'konflikt' || route.art === 'transport_ungueltig') {
    handoffFehler = route.meldung
  } else if (route.art === 'ok') {
    const bestand = await routeOrteLesen(supabase, route.ids)
    const bestaetigt = routeZieleBestaetigen(route.ids, bestand)
    if (bestaetigt.art !== 'bestaetigt') {
      handoffFehler = bestaetigt.meldung
    } else {
      bestaetigteRoute = bestaetigt.ziele
    }
  }

  const ziel = ersterWert(params?.ziel)
  const zielId = route.art === 'kein' ? ersterWert(params?.zielId) : undefined
  const bestaetigt = !handoffFehler && zielId ? await ortBestaetigen(zielId, 'ziel') : null
  const zielOrt = bestaetigteRoute[0] ?? (bestaetigt?.ok ? bestaetigt.wert : null)
  const weitereZiele = bestaetigteRoute.slice(1).map((ort) => ({ id: ort.id, name: ort.name }))

  const vor = planenVorbelegung({
    zielId: zielOrt?.id ?? null,
    zielName: (zielOrt?.name ?? (route.art === 'kein' ? ziel : undefined))?.slice(0, GRENZEN.titel) ?? null,
    idee: idee?.slice(0, GRENZEN.reisewunsch) ?? null,
    weitereZiele,
  })

  return (
    <main className="min-h-screen bg-surface-75 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid w-full max-w-6xl gap-10">
        <PlanenCreateGate angemeldet={angemeldet}>
          {handoffFehler ? (
            <RouteZielHandoffFehler meldung={handoffFehler} />
          ) : (
            <>
              <div className="grid gap-3">
                <PlanenManuellZeiger />
                <Reiseidee
                  angemeldet={angemeldet}
                  initialIdee={idee?.slice(0, VORSCHLAG_GRENZEN.freitextMaximum) ?? ''}
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-line-200" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">
                  Oder Schritt für Schritt
                </span>
                <span className="h-px flex-1 bg-line-200" />
              </div>

              <PlanenManuellZiel>
                <TripPlanner
                  angemeldet={angemeldet}
                  initialDestination={vor.destination}
                  initialDestinationId={vor.destinationId}
                  initialIdea={vor.idee}
                  initialWeitereZiele={vor.weitereZiele}
                />
              </PlanenManuellZiel>
            </>
          )}
        </PlanenCreateGate>
      </div>
    </main>
  )
}
