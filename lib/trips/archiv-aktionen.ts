// lib/trips/archiv-aktionen.ts
//
// Der eine AP-4-Schreibweg für Archivieren und Wiederherstellen.
//
// Server Action: eigene Eintrittspunkte, deshalb `auth.getUser()` über `konto()`.
// Anon-Key als `authenticated`. Owner-RLS ist die Autorisierung. Die
// Zugehörigkeit kommt nicht aus der Nutzlast. Keine privilegierte Rolle,
// keine Migration.
//
// Der Write trägt einen Optimistic Guard gegen Status plus gelesenes
// `updated_at` (bestehende Zeilenversion über `trips_aktualisiert_am`).
// Ein gleichbleibender Status mit geänderter Metadata darf nicht
// überschrieben werden.

'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import {
  archivSchreibversion,
  archivierenPlan,
  wiederherstellenPlan,
  type ArchivPlan,
  type ArchivPlanFehler,
} from '@/lib/account/reise-archiv'
import { NICHT_ANGEMELDET, konto, meldungAus, type Aktionsergebnis } from '@/lib/trips/anlegen'
import type { Json } from '@/types/supabase'

const archivAktionSchema = z.object({
  tripId: z.string().uuid(),
  aktion: z.enum(['archivieren', 'wiederherstellen']),
})

const UNBEKANNT = 'Diese Reise ist unbekannt.'
const KONFLIKT = 'Die Reise hat sich inzwischen geändert. Bitte lade die Seite neu.'

const PLAN_MELDUNG: Record<ArchivPlanFehler, string> = {
  unbekannt: UNBEKANNT,
  'bereits-archiviert': 'Diese Reise ist bereits archiviert.',
  'ungueltiger-status': 'Diese Reise kann gerade nicht archiviert werden.',
  'nicht-archiviert': 'Diese Reise ist nicht archiviert.',
  'keine-provenienz':
    'Diese Reise lässt sich nicht automatisch wiederherstellen, weil der frühere Status nicht belegt ist.',
  'metadata-ungueltig': 'Diese Reise kann gerade nicht archiviert werden.',
}

export async function reiseArchivLebenszyklus(eingabe: unknown): Promise<Aktionsergebnis<null>> {
  const geprueft = archivAktionSchema.safeParse(eingabe)
  if (!geprueft.success) return { ok: false, meldung: UNBEKANNT }

  const { supabase, benutzerId } = await konto()
  if (!benutzerId) return { ok: false, meldung: NICHT_ANGEMELDET }

  const { tripId, aktion } = geprueft.data
  const { data, error: lesefehler, status: lesestatus } = await supabase
    .from('trips')
    .select('status, metadata, updated_at')
    .eq('id', tripId)
    .maybeSingle()

  if (lesefehler) return { ok: false, meldung: meldungAus(lesefehler, lesestatus) }
  if (!data) return { ok: false, meldung: UNBEKANNT }

  const version = archivSchreibversion(data.updated_at)
  if (!version) return { ok: false, meldung: KONFLIKT }

  const plan: ArchivPlan = aktion === 'archivieren' ? archivierenPlan(data) : wiederherstellenPlan(data)
  if (!plan.ok) return { ok: false, meldung: PLAN_MELDUNG[plan.grund] }

  const { data: geschrieben, error, status } = await supabase
    .from('trips')
    .update({
      status: plan.nextStatus,
      metadata: plan.nextMetadata as Json,
    })
    .eq('id', tripId)
    .eq('status', plan.expectedStatus)
    .eq('updated_at', version)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, meldung: meldungAus(error, status) }
  if (!geschrieben) return { ok: false, meldung: KONFLIKT }

  revalidatePath('/reisen')
  revalidatePath('/account')
  revalidatePath(`/reisen/${tripId}`)
  return { ok: true, wert: null }
}
