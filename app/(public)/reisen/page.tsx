// app/(public)/reisen/page.tsx
//
// „Meine Reisen" – für Gäste und für Konten dieselbe Adresse.
//
// Der Unterschied entsteht auf dem Server: `auth.getUser()` fragt den
// Auth-Server und prüft das Token. `auth.getSession()` würde nur den Cookie
// wiedergeben; wer serverseitig entscheidet, welche Daten er lädt, darf sich
// darauf nicht stützen.
// Angemeldet wird eine begrenzte Seite der Kontoreisen geladen – durch RLS
// bereits auf das eigene Konto beschränkt, ohne einen Filter im Code. Dazu die
// Brücke, die einen Entwurf aus dem Browser übernimmt.
//
// `dynamic = 'force-dynamic'`, weil die Seite von der Sitzung abhängt. Ohne die
// Angabe könnte Next die Antwort eines Kontos an das nächste ausliefern.

import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { NICHT_INDEXIEREN } from '@/lib/seo/index-grenze'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { createServerComponentClient } from '@/lib/supabase/server'
import {
  MEINE_REISEN_HAUPT,
  MEINE_REISEN_INNEN,
  MEINE_REISEN_KOPF,
  MEINE_REISEN_LEAD,
  MEINE_REISEN_NEU,
  MEINE_REISEN_TITEL,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import type { SammlungSuchparameter } from '@/lib/trips/reisen-sammlung-abfrage'
import { reisenSammlungAusParametern } from '@/lib/trips/reisen-sammlung-daten'
import AccountNavigation from '@/components/account/AccountNavigation'
import GastReisen from '@/components/trips/GastReisen'
import GastreiseBruecke from '@/components/trips/GastreiseBruecke'
import MyTripsCollection from '@/components/trips/MyTripsCollection'

export const metadata: Metadata = {
  title: 'Meine Reisen',
  description: 'Öffne und bearbeite deine Jetnity-Reisen.',
  robots: NICHT_INDEXIEREN,
}

export const dynamic = 'force-dynamic'

export default async function ReisenSeite({
  searchParams,
}: {
  searchParams?: PageRequestParam<SammlungSuchparameter>
}) {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const angemeldet = Boolean(data.user)
  const parameter = (await leseOptionalRequestParam(searchParams)) ?? {}

  // Dieselbe serverseitige Auth-Aussage steuert Daten und die gemeinsame
  // Account-Leiste. Gäste bleiben auf der öffentlichen Route ohne Konto-Nav.

  return (
    <>
      {angemeldet ? <AccountNavigation /> : null}
      <main className={MEINE_REISEN_HAUPT}>
        <div className={MEINE_REISEN_INNEN}>
          <div className={MEINE_REISEN_KOPF}>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dein Jetnity</p>
              <h1 className={MEINE_REISEN_TITEL}>Meine Reisen</h1>
              <p className={MEINE_REISEN_LEAD}>
                {angemeldet
                  ? 'Deine Reisen sind in deinem Konto gespeichert und auf allen Geräten sichtbar.'
                  : 'Ohne Konto bleibt ein Reiseentwurf privat in diesem Browser. Mit einem Konto werden deine Reisen dauerhaft gespeichert.'}
              </p>
            </div>
            {angemeldet ? (
              <Link href="/planen" className={MEINE_REISEN_NEU}>
                <Plus className="h-4 w-4" />
                Neue Reise
              </Link>
            ) : null}
          </div>

          {angemeldet ? <KontoReisen parameter={parameter} /> : <GastReisen />}
        </div>
      </main>
    </>
  )
}

async function KontoReisen({ parameter }: { parameter: SammlungSuchparameter }) {
  const ergebnis = await reisenSammlungAusParametern(parameter)
  const problem = ergebnis.problem
  const fehlerTitel = 'Deine Reisen konnten nicht geladen werden.'
  const leerTitel = 'Noch keine Reise in deinem Konto.'
  let fehlerHinweis = ''

  // Ein Fehler darf nicht wie eine leere Liste aussehen: „Du hast noch keine
  // Reise" nach einem Datenbankausfall ist die falsche Auskunft mit den
  // grössten Folgen – sie sieht aus wie Datenverlust.
  if (problem) {
    fehlerHinweis =
      problem.status === 503
        ? 'Die Datenbank war gerade nicht erreichbar. Bitte versuche diese Ansicht erneut.'
        : 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte versuche diese Ansicht erneut.'
  }

  return (
    <>
      <GastreiseBruecke />
      <MyTripsCollection
        ergebnis={ergebnis}
        fehlerTitel={fehlerTitel}
        leerTitel={leerTitel}
        fehlerHinweis={fehlerHinweis}
      />
    </>
  )
}
