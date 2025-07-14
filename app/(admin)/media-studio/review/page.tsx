import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import AdminReviewTable from '@/components/admin/AdminReviewTable'

type Session = {
  id: string
  title: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default async function AdminReviewPage() {
  const supabase = createServerComponentClient({ cookies: cookies() })

  const { data } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, status, created_at')
    .order('created_at', { ascending: false })

  if (!data) return notFound()

  // If needed, adjust the mapping to match your Session type exactly
  const sessions: Session[] = data.map((s: any) => ({
    id: s.id,
    title: s.title,
    user_id: s.user_id,
    status: s.status,
    created_at: s.created_at,
  }))

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold">🔒 Admin Review – Creator Sessions</h1>
      <AdminReviewTable sessions={sessions} />
    </main>
  )
}
