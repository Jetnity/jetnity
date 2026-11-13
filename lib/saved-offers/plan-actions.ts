'use server'

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase/server'
import { savedOfferPlanValues, type PlanChoice, type PlanDays } from './plan'

type Result<T> = { ok: true; value: T } | { ok: false; message: string }
const unavailable = { ok: false as const, message: 'Deine Reise konnte nicht geladen werden. Bitte melde dich an oder versuche es erneut.' }

async function account() {
  const db = await createServerActionClient()
  const { data, error } = await db.auth.getUser()
  return { db, user: error ? null : data.user }
}

export async function savedOfferTrips(): Promise<Result<PlanChoice[]>> {
  const { db, user } = await account()
  if (!user) return unavailable
  const { data, error } = await db.from('trips').select('id,title').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(200)
  return error ? unavailable : { ok: true, value: data }
}

export async function savedOfferDays(tripId: unknown): Promise<Result<PlanDays>> {
  const parsed = z.string().uuid().safeParse(tripId)
  if (!parsed.success) return unavailable
  const { db, user } = await account()
  if (!user) return unavailable
  const [days, stages] = await Promise.all([
    db.from('trip_days').select('id,day_date,day_index,stage_id').eq('trip_id', parsed.data).eq('user_id', user.id).order('day_index'),
    db.from('trip_stages').select('id,name').eq('trip_id', parsed.data).eq('user_id', user.id).order('position'),
  ])
  if (days.error || stages.error) return unavailable
  return { ok: true, value: { days: days.data.map(d => ({ id: d.id, dayDate: d.day_date, dayIndex: d.day_index, stageId: d.stage_id })), stages: stages.data } }
}

export async function savedOfferToPlan(input: unknown): Promise<Result<string>> {
  const parsed = z.object({ offerId: z.string().uuid(), tripId: z.string().uuid(), dayId: z.string().uuid(),
    timing: z.object({ starts_on: z.string().nullable(), ends_on: z.string().nullable(), starts_at: z.string().nullable(), ends_at: z.string().nullable() }).strict(),
  }).strict().safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Bitte wähle Reise und Tag und prüfe die Zeitangaben.' }
  const { db, user } = await account()
  if (!user) return unavailable
  const v = parsed.data
  const [offer, day] = await Promise.all([
    db.from('saved_offers').select('*').eq('id', v.offerId).eq('user_id', user.id).maybeSingle(),
    db.from('trip_days').select('id,day_date,stage_id').eq('id', v.dayId).eq('trip_id', v.tripId).eq('user_id', user.id).maybeSingle(),
  ])
  if (offer.error || !offer.data || day.error || !day.data) return { ok: false, message: 'Angebot oder Reisetag ist nicht verfügbar. Bitte lade die Ansicht neu.' }
  try {
    const values = savedOfferPlanValues(offer.data, v.timing, day.data.day_date)
    // Deterministic request identity: a retry after a lost response cannot duplicate this offer/day.
    const hex = createHash('sha256').update(`${user.id}:${v.offerId}:${v.tripId}:${v.dayId}`).digest('hex')
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
    const last = await db.from('trip_items').select('position').eq('trip_id', v.tripId).eq('day_id', v.dayId).eq('user_id', user.id).order('position', { ascending: false }).limit(1)
    if (last.error) return unavailable
    const result = await db.from('trip_items').insert({ ...values, id, user_id: user.id, trip_id: v.tripId, day_id: v.dayId, stage_id: day.data.stage_id, position: Math.min((last.data?.[0]?.position ?? 0) + 1, 500) }).select('id').single()
    if (result.error && result.error.code !== '23505') return { ok: false, message: 'Das Angebot konnte nicht eingeplant werden. Bitte prüfe die Reise und versuche es erneut.' }
    const confirmed = await db.from('trip_items').select('id,title,starts_on,ends_on,starts_at,ends_at').eq('id', id).eq('user_id', user.id).eq('trip_id', v.tripId).maybeSingle()
    if (confirmed.error || !confirmed.data) return { ok: false, message: 'Speichern konnte nicht bestätigt werden. Lade die Reise neu; ein erneuter Versuch erzeugt keinen zweiten Eintrag.' }
    const c = confirmed.data
    if (c.title !== values.title || c.starts_on !== values.starts_on || c.ends_on !== values.ends_on || (c.starts_at?.slice(0, 5) ?? null) !== values.starts_at || (c.ends_at?.slice(0, 5) ?? null) !== values.ends_at) return { ok: false, message: 'Dieses Angebot wurde an diesem Tag bereits mit anderen Angaben eingeplant. Bitte bearbeite es im Reiseplan.' }
    revalidatePath(`/reisen/${v.tripId}`)
    revalidatePath('/reisen')
    return { ok: true, value: `/reisen/${v.tripId}?ansicht=reiseplan` }
  } catch (error) { return { ok: false, message: error instanceof z.ZodError ? error.issues[0]?.message ?? 'Bitte prüfe deine Angaben.' : error instanceof Error ? error.message : 'Speichern ist gerade nicht möglich.' } }
}
