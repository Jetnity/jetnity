import 'server-only'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { planpunktAus } from '@/lib/trips/abbildung'
import { neuePlanpunktNutzlastSchema } from '@/lib/trips/schema'
import { KONFLIKT, manuellerInhaltSchema, planAenderungSchema } from './manual'

const kennung = z.string().uuid()
const version = z.string().datetime({ offset: true })
const bearbeiten = z.object({ tripId: kennung, itemId: kennung, expectedVersion: version, aenderung: planAenderungSchema }).strict()

/** Uses the authenticated RLS client only. Row version is a SQL predicate, not a preflight promise. */
export async function accountPlanSchreiben(db: SupabaseClient<Database>, userId: string | null, art: 'anlegen' | 'bearbeiten', input: unknown) {
  if (!userId) throw new Error('Bitte melde dich an, um deine Reise zu speichern.')
  if (art === 'anlegen') {
    const v = neuePlanpunktNutzlastSchema.extend({ clientRef: kennung }).strict().parse(input)
    if (v.kind === 'activity' || v.kind === 'note') {
      manuellerInhaltSchema.parse({ kind: v.kind, title: v.title, note: v.note, startsOn: v.startsOn, startsAt: v.startsAt, endsOn: v.endsOn, endsAt: v.endsAt })
    } else if (v.startsOn || v.endsOn || v.endsAt) throw new Error('Bitte verwende die vorgesehene Detailansicht.')
    const day = await db.from('trip_days').select('id, stage_id').eq('id', v.dayId).eq('trip_id', v.tripId).eq('user_id', userId).maybeSingle()
    if (day.error || !day.data) throw new Error('Dieser Tag ist nicht verfügbar.')
    // Stable form request ID prevents duplicate creation after a lost response.
    const values = { id: v.clientRef, trip_id: v.tripId, day_id: v.dayId, stage_id: day.data.stage_id,
      kind: v.kind, title: v.title, note: v.note, starts_on: v.startsOn ?? null,
      starts_at: v.startsAt, ends_on: v.endsOn ?? null, ends_at: v.endsAt ?? null }
    const existing = await db.from('trip_items').select('*').eq('id', v.clientRef).eq('trip_id', v.tripId).eq('user_id', userId).maybeSingle()
    if (existing.error) throw new Error('Der Speicherstand konnte nicht geprüft werden.')
    if (existing.data) {
      const row = planpunktAus(existing.data)
      if (row.dayId !== v.dayId || row.kind !== v.kind || row.title !== v.title || row.note !== v.note ||
        row.startsOn !== (v.startsOn ?? null) || row.startsAt !== v.startsAt || row.endsOn !== (v.endsOn ?? null) || row.endsAt !== (v.endsAt ?? null)) throw new Error(KONFLIKT)
      return row
    }
    const last = await db.from('trip_items').select('position').eq('trip_id', v.tripId).eq('day_id', v.dayId).order('position', { ascending: false }).limit(1)
    if (last.error) throw new Error('Der Tagesplan konnte nicht geprüft werden.')
    const write = await db.from('trip_items').insert({ ...values, position: Math.min((last.data?.[0]?.position ?? 0) + 1, 500) }).select('*').maybeSingle()
    if (write.error || !write.data) throw new Error('Der Punkt konnte nicht bestätigt gespeichert werden. Bitte versuche es erneut.')
    return planpunktAus(write.data)
  }
  const v = bearbeiten.parse(input)
  const a = v.aenderung
  if (a.dayId !== null) {
    kennung.parse(a.dayId)
    const day = await db.from('trip_days').select('id').eq('id', a.dayId).eq('trip_id', v.tripId).eq('user_id', userId).maybeSingle()
    if (day.error || !day.data) throw new Error('Dieser Tag ist nicht verfügbar.')
  }
  const values = { day_id: a.dayId, ...(a.art === 'inhalt' ? {
    title: a.inhalt.title, note: a.inhalt.note, starts_on: a.inhalt.startsOn ?? null,
    starts_at: a.inhalt.startsAt, ends_on: a.inhalt.endsOn ?? null, ends_at: a.inhalt.endsAt ?? null,
  } : {}) }
  let query = db.from('trip_items').update(values).eq('id', v.itemId).eq('trip_id', v.tripId)
    .eq('user_id', userId).eq('updated_at', v.expectedVersion)
  if (a.art === 'inhalt') query = query.eq('kind', a.inhalt.kind).is('provider', null).is('external_ref', null).is('booking_url', null)
  const write = await query.select('*').maybeSingle()
  if (write.error || !write.data) throw new Error(KONFLIKT)
  return planpunktAus(write.data)
}
