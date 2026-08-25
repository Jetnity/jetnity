// app/(public)/reisen/[tripId]/page.tsx
//
// Eine Reise – im Konto oder im Browser.
//
// Die Kennung entscheidet, wo nachgesehen wird: Eine Reise im Konto trägt die
// UUID der Datenbank, eine Gastreise `trip-<uuid>`. Ohne diese Unterscheidung
// ginge jede Gastkennung als Abfrage an PostgREST und käme als
// `22P02 invalid input syntax for type uuid` zurück – ein Fehler, wo eine
// Zuordnung gemeint ist.
//
// Eine UUID, die es im Konto nicht gibt, ist eine 404. Ob sie nicht existiert
// oder jemand anderem gehört, bleibt offen: Wer eine fremde Kennung errät, soll
// nicht erfahren, dass sie existiert. RLS liefert in beiden Fällen null Zeilen,
// und diese Seite macht daraus dieselbe Antwort.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

import { NICHT_INDEXIEREN } from '@/lib/seo/index-grenze'
import { createServerComponentClient } from '@/lib/supabase/server'
import { istKontoKennung, reiseLaden } from '@/lib/trips/daten'
import GastArbeitsbereich from '@/components/trips/GastArbeitsbereich'
import KontoArbeitsbereich from '@/components/trips/KontoArbeitsbereich'

export const metadata: Metadata = {
  title: 'Reiseübersicht',
  description: 'Plane deine Reise übersichtlich mit Jetnity.',
  robots: NICHT_INDEXIEREN,
}

export const dynamic = 'force-dynamic'

/** Next.js liest nur ein Literal. Muss den Sol-Lauf plus Terra-Fallback tragen. */
export const maxDuration = 300

type ReiseSeiteProps = {
  params: { tripId: string }
}

export default async function ReiseSeite({ params }: ReiseSeiteProps) {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getUser()

  // Eine Gastkennung bleibt eine Gastkennung, auch in einer angemeldeten
  // Sitzung: Der Entwurf liegt im Browser, und die Brücke auf /reisen holt ihn
  // ins Konto. Ihn hier stillschweigend gegen eine Reise im Konto zu tauschen
  // wäre ein Rätsel für alle, die die Adresse gespeichert haben.
  if (!data.user || !istKontoKennung(params.tripId)) {
    return <GastArbeitsbereich tripId={params.tripId} />
  }

  const { zeilen, problem } = await reiseLaden(params.tripId)

  if (problem) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-brand-800">
          Diese Reise konnte nicht geladen werden.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          {problem.status === 503
            ? 'Die Datenbank war gerade nicht erreichbar. Deine Reise ist gespeichert – bitte lade die Seite in einem Moment neu.'
            : 'Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.'}
        </p>
      </main>
    )
  }

  const reise = zeilen[0]
  if (!reise) notFound()

  return <KontoArbeitsbereich reise={reise} ohneTag={reise.ohneTag} />
}
