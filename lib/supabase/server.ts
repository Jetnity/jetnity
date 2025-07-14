import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createServerComponentClient({ cookies }: { cookies: any }) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  )
}

export { createServerComponentClient as createServerClient }


