// lib/auth.ts
import 'server-only'
import type { Session, User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession()
  return session?.user ?? null
}

export async function requireUser(opts?: { redirectTo?: string }): Promise<User> {
  const user = await getCurrentUser()
  if (user) return user
  if (opts?.redirectTo) redirect(opts.redirectTo)
  throw new Error('UNAUTHORIZED')
}

export function getUserRolesFromJWT(user: User | null): string[] {
  if (!user) return []
  const md: any = user.user_metadata ?? {}
  const app: any = user.app_metadata ?? {}
  const roles: string[] = []
  if (Array.isArray(app.roles)) roles.push(...app.roles)
  if (typeof app.role === 'string') roles.push(app.role)
  if (typeof md.role === 'string') roles.push(md.role)
  if (app.is_admin === true || md.is_admin === true) roles.push('admin')
  return Array.from(new Set(roles.map((r) => String(r).toLowerCase())))
}

export function isAdmin(user: User | null): boolean {
  return getUserRolesFromJWT(user).includes('admin')
}
