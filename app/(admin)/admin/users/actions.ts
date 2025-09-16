// app/(admin)/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

type Role = 'owner' | 'admin' | 'operator' | 'moderator' | 'creator' | 'user'
type Status = 'active' | 'banned' | 'pending' | 'disabled'

/** Hilfsfunktion: lockerer Client, um TS-Reibung mit DB-Generics zu vermeiden */
function sb() {
  return createServerComponentClient() as any
}

/** Niemand (außer evtl. Owner) darf sich selbst auf eine Low-Rolle setzen */
function isDangerousSelfChange(actorId: string, targetId: string, nextRole: Role) {
  if (actorId !== targetId) return false
  // Self-demote nur erlauben, wenn in Richtung admin/owner – alles andere blocken
  return !['owner', 'admin'].includes(nextRole)
}

/** setUserRole – unterstützt FormData und direkte Argumente */
export async function setUserRole(formData: FormData): Promise<void>
export async function setUserRole(user_id: string, role: Role): Promise<void>
export async function setUserRole(a: FormData | string, b?: Role): Promise<void> {
  const { user, role: actorRole } = await requireAdmin()
  const client = sb()

  let user_id: string
  let nextRole: Role

  if (typeof a === 'string') {
    user_id = a
    nextRole = (b as Role)!
  } else {
    user_id = String(a.get('user_id') ?? '')
    nextRole = String(a.get('role') ?? '') as Role
  }

  if (!user_id || !nextRole) return

  // Schutz: Owner-Rolle nur von Owner vergeben
  if (nextRole === 'owner' && actorRole !== 'owner') {
    throw new Error('Nur Owner dürfen die Owner-Rolle vergeben.')
  }

  // Schutz: riskante Selbst-Änderungen verhindern
  if (isDangerousSelfChange(user.id, user_id, nextRole)) {
    throw new Error('Du kannst deine eigene Rolle nicht herabstufen.')
  }

  const { error } = await client
    .from('creator_profiles')
    .update({ role: nextRole })
    .eq('user_id', user_id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}

/** setUserStatus – unterstützt FormData und direkte Argumente */
export async function setUserStatus(formData: FormData): Promise<void>
export async function setUserStatus(user_id: string, status: Status): Promise<void>
export async function setUserStatus(a: FormData | string, b?: Status): Promise<void> {
  await requireAdmin()
  const client = sb()

  let user_id: string
  let nextStatus: Status

  if (typeof a === 'string') {
    user_id = a
    nextStatus = (b as Status)!
  } else {
    user_id = String(a.get('user_id') ?? '')
    nextStatus = String(a.get('status') ?? '') as Status
  }

  if (!user_id || !nextStatus) return

  const { error } = await client
    .from('creator_profiles')
    .update({ status: nextStatus })
    .eq('user_id', user_id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/users')
}
