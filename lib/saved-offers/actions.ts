'use server'

import { createHash } from 'node:crypto'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerActionClient } from '@/lib/supabase/server'
import { createRentalSearch, rentalAccess } from '@/lib/providers/discovercars/search/server'
import { offerInput, type OfferInput, type SavedOffer } from './contract'

type Result<T> = { ok: true; value: T } | { ok: false; message: string }
const LOGIN = 'Bitte melde dich an, um Angebote in deinem Konto zu merken.'
const FAILURE = 'Die Merkliste konnte nicht gespeichert werden. Bitte versuche es erneut.'

async function account() {
  const db = await createServerActionClient()
  const { data, error } = await db.auth.getUser()
  return { db, user: error ? null : data.user }
}

export async function savedOffersList(): Promise<Result<SavedOffer[]>> {
  const { db, user } = await account()
  if (!user) return { ok: false, message: LOGIN }
  const { data, error } = await db.from('saved_offers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(501)
  if (error) return { ok: false, message: 'Die Merkliste konnte nicht geladen werden. Bitte versuche es erneut.' }
  if (data.length > 500) return { ok: false, message: 'Deine Merkliste enthält mehr als 500 Angebote. Bitte wende dich an den Support.' }
  return { ok: true, value: data }
}

async function save(value: OfferInput, source: 'manual' | 'discovercars', ref?: string, expiresAt?: number): Promise<Result<SavedOffer>> {
  const { db, user } = await account()
  if (!user) return { ok: false, message: LOGIN }
  const offer_ref = createHash('sha256').update(JSON.stringify([source, ref ?? value.url, value.starts_on, value.ends_on, value.starts_at, value.ends_at])).digest('hex')
  const row = { ...value, source, user_id: user.id, offer_ref, provider: source === 'discovercars' ? 'DiscoverCars' : new URL(value.url).hostname,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null }
  // A unique owner/reference key handles retries and concurrent tabs without overwriting a saved entry.
  const inserted = await db.from('saved_offers').insert(row).select('*').single()
  if (!inserted.error) { revalidatePath('/account/merkliste'); return { ok: true, value: inserted.data } }
  if (inserted.error.code === '23505') {
    const existing = await db.from('saved_offers').select('*').eq('user_id', user.id).eq('offer_ref', offer_ref).single()
    if (!existing.error) return { ok: true, value: existing.data }
  }
  return { ok: false, message: FAILURE }
}

export async function saveManualOffer(input: unknown): Promise<Result<SavedOffer>> {
  const parsed = offerInput.safeParse(input)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? FAILURE }
  return save(parsed.data, 'manual')
}

export async function saveRentalOffer(input: unknown): Promise<Result<SavedOffer>> {
  const parsed = z.object({ token: z.string().min(20).max(1000), context: z.object({ destination: z.string().max(200).nullable(), starts_on: z.string().nullable(), ends_on: z.string().nullable(), starts_at: z.string().nullable(), ends_at: z.string().nullable() }).strict() }).strict().safeParse(input)
  if (!parsed.success) return { ok: false, message: 'Dieses Angebot konnte nicht gelesen werden.' }
  const { user } = await account()
  if (!user) return { ok: false, message: LOGIN }
  const key = rentalAccess()
  if (!key) return { ok: false, message: 'Die Mietwagensuche ist gerade nicht verfügbar.' }
  try {
    const { offer, expiresAt } = await createRentalSearch(key).detail(parsed.data.token)
    const value = offerInput.parse({ category: 'rental_car', title: offer.car.name, url: offer.url.web, ...parsed.data.context, start_timezone: null, end_timezone: null })
    return save(value, 'discovercars', offer.offer_id, expiresAt)
  } catch { return { ok: false, message: 'Das Angebot konnte nicht erneut geprüft werden. Bitte aktualisiere die Mietwagensuche.' } }
}

export async function removeSavedOffer(id: unknown): Promise<Result<null>> {
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: FAILURE }
  const { db, user } = await account()
  if (!user) return { ok: false, message: LOGIN }
  const { error } = await db.from('saved_offers').delete().eq('id', parsed.data).eq('user_id', user.id)
  if (error) return { ok: false, message: FAILURE }
  revalidatePath('/account/merkliste')
  return { ok: true, value: null }
}
