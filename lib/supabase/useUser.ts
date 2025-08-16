// lib/supabase/useUser.ts

import { useEffect, useState } from 'react'
import { supabase } from './client'
import type { User } from '@supabase/supabase-js'

type UseUserResult = {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      setUser(data?.user ?? null)
      // Optional: Checke Admin-Rolle aus z. B. user.user_metadata.role === 'admin'
      setIsAdmin(data?.user?.user_metadata?.role === 'admin')
      setLoading(false)
    }
    fetchUser()
  }, [])

  return { user, isAdmin, loading }
}
