// app/creator/sessions/page.tsx  (Server Component)
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import SessionsClient from './SessionsClient'

export default async function Page() {
  const supabase = createServerComponentClient<Database>()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <SessionsClient initial={sessions ?? []} />
}
