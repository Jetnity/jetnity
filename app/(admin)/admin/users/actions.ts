// app/(admin)/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Hole einen streng getypten Server-Client.
 * (Falls dein Wrapper keine Generics exposed, casten wir einmal zentral.)
 */
function getSb(): SupabaseClient<Database> {
  return createServerComponentClient() as unknown as SupabaseClient<Database>
}

async function assertAdmin(sb: SupabaseClient<Database>) {
  const { data: auth } = await sb.auth.getUser()
  const uid = auth?.user?.id
  if (!uid) throw new Error('Nicht angemeldet')

  const { data: me, error } = await sb
    .from('creator_profiles')
    .select('role')
    .eq('user_id', uid)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!me || me.role !== 'admin') throw new Error('Keine Admin-Berechtigung')
  return uid
}

export async function setUserRole(
  userId: string,
  role: 'user' | 'creator' | 'admin'
) {
  const sb = getSb()
  await assertAdmin(sb)

  const { error } = await sb
    .from('creator_profiles')
    .update({ role })
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

export async function setUserStatus(
  userId: string,
  status: 'active' | 'banned'
) {
  const sb = getSb()
  await assertAdmin(sb)

  const { error } = await sb
    .from('creator_profiles')
    .update({ status })
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
