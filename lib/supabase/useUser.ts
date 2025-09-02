// lib/supabase/useUser.ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './client'

type UseUserResult = {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  roles: string[]
  isAdmin: boolean
  error?: string
  refresh: () => Promise<void>
}

/** Rollen nur aus dem JWT lesen (app_metadata / user_metadata) */
function readRolesFromJWT(u: User | null): string[] {
  if (!u) return []
  const md: any = u.user_metadata ?? {}
  const app: any = u.app_metadata ?? {}
  const roles: string[] = []
  if (Array.isArray(app.roles)) roles.push(...app.roles)
  if (typeof app.role === 'string') roles.push(app.role)
  if (typeof md.role === 'string') roles.push(md.role)
  if (md.is_admin === true || app.is_admin === true) roles.push('admin')
  return Array.from(new Set(roles.map((r) => String(r).trim().toLowerCase()).filter(Boolean)))
}

/** Optionaler DB-Rollen-Lookup via ENV (z. B. "creator_profiles:role"). */
async function tryFetchDbRole(userId: string): Promise<string | null> {
  const cfg = process.env.NEXT_PUBLIC_PROFILE_ROLE_TABLE // z.B. "profiles:role" oder "creator_profiles:role"
  if (!cfg) return null
  const [table, colRaw] = cfg.split(':')
  const col = (colRaw || 'role').trim()
  if (!table) return null

  try {
    // bewusst untypisiert, damit es auch ohne generierte Table-Types compilet
    const client: any = supabase as any
    const { data, error } = await client.from(table).select(col).eq('id', userId).single()
    if (error) return null
    const val = data?.[col]
    return typeof val === 'string' && val ? val : null
  } catch {
    return null
  }
}

export function useUser(): UseUserResult {
  const mounted = useRef(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  const setSafe = useCallback(<T,>(setter: (v: T) => void, v: T) => {
    if (mounted.current) setter(v)
  }, [])

  const mergeRole = useCallback((role: string | null) => {
    if (!role) return
    setRoles((prev) => {
      const set = new Set(prev)
      set.add(role.toLowerCase())
      return Array.from(set)
    })
  }, [])

  const bootstrap = useCallback(async () => {
    setSafe(setLoading, true)
    setSafe(setError, undefined)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      const ses = data?.session ?? null
      const u = ses?.user ?? null
      setSafe(setSession, ses)
      setSafe(setUser, u)
      const jwtRoles = readRolesFromJWT(u)
      setSafe(setRoles, jwtRoles)
      if (u) {
        const dbRole = await tryFetchDbRole(u.id)
        if (dbRole) mergeRole(dbRole)
      }
    } catch (e: any) {
      setSafe(setError, e?.message ?? 'Unbekannter Auth-Fehler')
    } finally {
      setSafe(setLoading, false)
    }
  }, [mergeRole, setSafe])

  useEffect(() => {
    mounted.current = true
    bootstrap()
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, ses) => {
      const u = ses?.user ?? null
      setSession(ses ?? null)
      setUser(u)
      const jwtRoles = readRolesFromJWT(u)
      setRoles(jwtRoles)
      // DB-Rolle bewusst nicht bei jedem Event nachladen → auf Wunsch: refresh()
      setLoading(false)
    })
    return () => {
      mounted.current = false
      ;(sub as any)?.subscription?.unsubscribe?.()
      ;(sub as any)?.unsubscribe?.()
    }
  }, [bootstrap])

  const refresh = useCallback(async () => {
    await bootstrap()
  }, [bootstrap])

  const isAuthenticated = !!user
  const isAdmin = useMemo(() => roles.includes('admin'), [roles])

  return { user, session, loading, isAuthenticated, roles, isAdmin, error, refresh }
}
