'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AdminGrant } from '@/lib/auth/admin-access'
import type { Role } from '@/lib/auth/roles'

export type AdminSession = {
  role: Role | null
  grant: AdminGrant
}

const AdminSessionContext = createContext<AdminSession | null>(null)

export default function AdminSessionProvider({
  role,
  grant,
  children,
}: AdminSession & { children: ReactNode }) {
  return (
    <AdminSessionContext.Provider value={{ role, grant }}>
      {children}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext)
  if (!session) {
    throw new Error('useAdminSession braucht AdminSessionProvider')
  }
  return session
}
