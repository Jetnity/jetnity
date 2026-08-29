// app/(public)/reisen/page.tsx
//
// „Meine Reisen" – für Gäste und für Konten dieselbe Adresse.
//
// Der Unterschied entsteht auf dem Server: `auth.getUser()` fragt den
// Auth-Server und prüft das Token. `auth.getSession()` würde nur den Cookie
// wiedergeben; wer serverseitig entscheidet, welche Daten er lädt, darf sich
// darauf nicht stützen.
//
// Angemeldet werden die Reisen des Kontos geladen – durch RLS bereits auf das
// eigene Konto beschränkt, ohne einen Filter im Code. Dazu die Brücke, die
// einen Entwurf aus dem Browser übernimmt.
//
// `dynamic = 'force-dynamic'`, weil die Seite von der Sitzung abhängt. Ohne die
// Angabe könnte Next die Antwort eines Kontos an das nächste ausliefern.

import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, MapPin, Plus } from 'lucide-react'

import { NICHT_INDEXIEREN } from '@/lib/seo/index-grenze'
import { createServerComponentClient } from '@/lib/supabase/server'
import { reisenLaden } from '@/lib/trips/daten'
import AccountNavigation from '@/components/account/AccountNavigation'
import GastReisen from '@/components/trips/GastReisen'
import GastreiseBruecke from '@/components/trips/GastreiseBruecke'
import KontoReisenGruppen from '@/components/trips/KontoReisenGruppen'

export const metadata: Metadata = {
  title: 'Meine Reisen',
  description: 'Öffne und bearbeite deine Jetnity-Reisen.',
  robots: NICHT_INDEXIEREN,
}

export const dynamic = 'force-dynamic'

export default async function ReisenSeite() {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const angemeldet = Boolean(data.user)

  // Dieselbe serverseitige Auth-Aussage steuert Daten und die gemeinsame
  // Account-Leiste. Gäste bleiben auf der öffentlichen Route ohne Konto-Nav.

  return (
    <>
      {angemeldet ? <AccountNavigation /> : null}
      <main className="min-h-screen bg-surface-75 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dein Jetnity</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
                Meine Reisen
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">
                {angemeldet
                  ? 'Deine Reisen sind in deinem Konto gespeichert und auf allen Geräten sichtbar.'
                  : 'Ohne Konto bleibt ein Reiseentwurf privat in diesem Browser. Mit einem Konto werden deine Reisen dauerhaft gespeichert.'}
              </p>
            </div>
            {angemeldet ? (
              <Link
                href="/planen"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
              >
                <Plus className="h-4 w-4" />
                Neue Reise
              </Link>
            ) : null}
          </div>

          {angemeldet ? <KontoReisen /> : <GastReisen />}
        </div>
      </main>
    </>
  )
}

async function KontoReisen() {
  const { zeilen, problem } = await reisenLaden()

  // Ein Fehler darf nicht wie eine leere Liste aussehen: „Du hast noch keine
  // Reise" nach einem Datenbankausfall ist die falsche Auskunft mit den
  // grössten Folgen – sie sieht aus wie Datenverlust.
  if (problem) {
    return (
      <>
        <GastreiseBruecke />
        <section
          role="alert"
          className="rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <AlertCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-red-800">
            Deine Reisen konnten nicht geladen werden.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
            {problem.status === 503
              ? 'Die Datenbank war gerade nicht erreichbar. Deine Reisen sind gespeichert – bitte lade die Seite in einem Moment neu.'
              : 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.'}
          </p>
        </section>
      </>
    )
  }

  return (
    <>
      <GastreiseBruecke />
      {zeilen.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
            Noch keine Reise in deinem Konto.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
            Erstelle deine erste Reise. Sie wird dauerhaft gespeichert und lässt sich von jedem Gerät aus
            weiterplanen.
          </p>
          <Link
            href="/planen"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-brand-900"
          >
            <Plus className="h-4 w-4" />
            Reise erstellen
          </Link>
        </section>
      ) : (
        <KontoReisenGruppen reisen={zeilen} />
      )}
    </>
  )
}
