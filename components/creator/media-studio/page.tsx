// app/creator/media-studio/page.tsx

import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import MediaStudioShell from './MediaStudioShell'

export default async function MediaStudioPage() {
  const supabase = createServerComponentClient()
  const {
    data: {
      session, // Supabase-Session mit user.id
    },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('creator_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single()

  if (!profile || (profile.role !== 'pro' && profile.role !== 'verified')) {
    redirect('/creator-dashboard')
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">🧠 KI-Medien-Studio</h1>
      <MediaStudioShell userId={session.user.id} />
    </main>
  )
}
