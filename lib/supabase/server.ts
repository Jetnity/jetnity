import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

// Richtiger Next.js App Router + Supabase SSR Support
export function createServerComponentClient<T = Database>() {
  return createServerClient<T>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Liest das Cookie aus dem aktuellen SSR-Request
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Wird in SSR selten gebraucht, hier leer lassen
        },
        remove(name: string, options: any) {
          // Wird in SSR selten gebraucht, hier leer lassen
        }
      }
    }
  )
}
