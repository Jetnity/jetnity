// app/(admin)/admin/users/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import {
  canAssignRole,
  canManageUsers,
  isAccountStatus,
  parseRole,
  rankOf,
  type AccountStatus,
  type Role,
} from '@/lib/auth/roles'

/**
 * Server-Actions sind eigene Eintrittspunkte: Das Layout der Gruppe `(admin)`
 * schützt sie nicht. Jede Action prüft deshalb selbst.
 */

/** Hilfsfunktion: lockerer Client, um TS-Reibung mit DB-Generics zu vermeiden */
function sb() {
  return createServerComponentClient() as any
}

/** Rolle des Zielkontos – Grundlage für die Rangprüfung. */
async function loadTargetRole(userId: string): Promise<Role | null> {
  const { data, error } = await sb()
    .from('creator_profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error('Zielkonto konnte nicht geladen werden.')
  if (!data) throw new Error('Zielkonto existiert nicht.')

  return parseRole(data.role)
}

/**
 * Stellt sicher, dass der Aufrufer Konten verwalten darf, und gibt die
 * geprüfte Rolle zurück. Ein Notzugang ohne Datenbankrolle darf lesen, aber
 * keine Rollen vergeben – dafür fehlt der Rang, an dem sich die Prüfung
 * ausrichtet.
 */
async function requireUserManager() {
  const { user, role } = await requireAdminPage({ surface: 'users-action' })

  if (!role || !canManageUsers(role)) {
    throw new Error('Keine Berechtigung zur Kontoverwaltung.')
  }

  return { user, role }
}

/** setUserRole – unterstützt FormData und direkte Argumente */
export async function setUserRole(formData: FormData): Promise<void>
export async function setUserRole(user_id: string, role: Role): Promise<void>
export async function setUserRole(a: FormData | string, b?: Role): Promise<void> {
  const { user, role: actorRole } = await requireUserManager()

  const rawId = typeof a === 'string' ? a : String(a.get('user_id') ?? '')
  const rawRole = typeof a === 'string' ? b : a.get('role')

  const targetId = rawId.trim()
  const nextRole = parseRole(rawRole)

  if (!targetId) throw new Error('Kein Konto angegeben.')
  if (!nextRole) throw new Error('Unbekannte Rolle.')

  const currentTargetRole = await loadTargetRole(targetId)
  if (!currentTargetRole) {
    throw new Error('Die bisherige Rolle des Kontos ist unbekannt – bitte zuerst bereinigen.')
  }

  // Die eigentliche Schutzregel. Vorher konnte sich eine Moderation selbst
  // zur Administration befördern, weil nur die Owner-Rolle und ein
  // Selbst-Downgrade geprüft wurden.
  const allowed = canAssignRole({
    actorRole,
    actorId: user.id,
    targetId,
    currentTargetRole,
    nextRole,
  })

  if (!allowed) {
    console.warn(
      `[admin-rollen] Abgelehnt: Konto ${user.id} (${actorRole}) wollte ${targetId} ` +
        `von ${currentTargetRole} auf ${nextRole} setzen.`,
    )
    throw new Error(
      user.id === targetId
        ? 'Die eigene Rolle kann nicht geändert werden.'
        : 'Für diese Rollenänderung fehlt die Berechtigung.',
    )
  }

  const { error } = await sb()
    .from('creator_profiles')
    .update({ role: nextRole })
    .eq('user_id', targetId)

  if (error) throw new Error(error.message)

  console.info(
    `[admin-rollen] Konto ${user.id} (${actorRole}) hat ${targetId} ` +
      `von ${currentTargetRole} auf ${nextRole} gesetzt.`,
  )
  revalidatePath('/admin/users')
}

/** setUserStatus – unterstützt FormData und direkte Argumente */
export async function setUserStatus(formData: FormData): Promise<void>
export async function setUserStatus(user_id: string, status: AccountStatus): Promise<void>
export async function setUserStatus(a: FormData | string, b?: AccountStatus): Promise<void> {
  const { user, role: actorRole } = await requireUserManager()

  const rawId = typeof a === 'string' ? a : String(a.get('user_id') ?? '')
  const rawStatus = typeof a === 'string' ? b : a.get('status')

  const targetId = rawId.trim()
  const nextStatus = typeof rawStatus === 'string' && isAccountStatus(rawStatus) ? rawStatus : null

  if (!targetId) throw new Error('Kein Konto angegeben.')
  if (!nextStatus) throw new Error('Unbekannter Status.')
  if (targetId === user.id) throw new Error('Das eigene Konto kann nicht gesperrt werden.')

  // Ein Sperren wirkt wie eine Entmachtung, deshalb gilt dieselbe Rangregel
  // wie bei Rollenänderungen: nur gegenüber niedrigeren Rängen.
  const currentTargetRole = await loadTargetRole(targetId)
  if (actorRole !== 'owner') {
    if (!currentTargetRole || rankOf(actorRole) <= rankOf(currentTargetRole)) {
      throw new Error('Für dieses Konto fehlt die Berechtigung.')
    }
  }

  const { error } = await sb()
    .from('creator_profiles')
    .update({ status: nextStatus })
    .eq('user_id', targetId)

  if (error) throw new Error(error.message)

  console.info(
    `[admin-konten] Konto ${user.id} (${actorRole}) hat ${targetId} auf ${nextStatus} gesetzt.`,
  )
  revalidatePath('/admin/users')
}
