// app/creator/media-studio/page.tsx
export const dynamic = 'force-dynamic'

import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import MediaStudioShell from '@/components/creator/media-studio/MediaStudioShell'
import CreatorMediaList from '@/components/creator/CreatorMediaList'
import type { Tables } from '@/types/supabase'

export default async function MediaStudioPage() {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile, error } = await supabase
    .from('creator_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const allowedRoles: Tables<'creator_profiles'>['role'][] = ['pro', 'verified']

  if (error || !profile || !allowedRoles.includes(profile.role)) {
    redirect('/creator-dashboard')
  }

  return (
    <div className="space-y-12 px-6 py-10 max-w-6xl mx-auto">
      {/* 🧠 Medien-Studio Arbeitsbereich */}
      <MediaStudioShell userId={user.id} />

      {/* 🖼️ Creator Upload-Galerie */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🖼️ Deine hochgeladenen Medien</h2>
        <CreatorMediaList />
      </div>
    </div>
  )
}
