// app/(public)/planen/page.tsx
//
// Das Formular für eine neue Reise.
//
// Ob die Reise im Konto oder im Browser entsteht, entscheidet der Server:
// `auth.getUser()` prüft das Token beim Auth-Server. Die Antwort geht als
// `angemeldet` in das Formular. Der Client selbst darf das nicht beantworten –
// er könnte es behaupten, und die Server Action würde ihn korrigieren, aber erst
// nach dem Absenden.

import type { Metadata } from 'next'

import { createServerComponentClient } from '@/lib/supabase/server'
import TripPlanner from '@/components/trips/TripPlanner'
import { GRENZEN } from '@/lib/trips/schema'

export const metadata: Metadata = {
  title: 'Reise planen',
  description: 'Erstelle deine Reise mit Jetnity.',
}

export const dynamic = 'force-dynamic'

type PlanenSeiteProps = {
  searchParams?: {
    idee?: string | string[]
    ziel?: string | string[]
  }
}

function ersterWert(wert?: string | string[]) {
  return Array.isArray(wert) ? wert[0] : wert
}

export default async function PlanenSeite({ searchParams }: PlanenSeiteProps) {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getUser()

  const idee = ersterWert(searchParams?.idee)
  const ziel = ersterWert(searchParams?.ziel)

  return (
    <main className="min-h-screen bg-surface-75 px-4 py-10 sm:px-6 sm:py-14">
      <TripPlanner
        angemeldet={Boolean(data.user)}
        initialDestination={ziel?.slice(0, GRENZEN.titel) ?? ''}
        initialIdea={idee?.slice(0, GRENZEN.reisewunsch) ?? ''}
      />
    </main>
  )
}
