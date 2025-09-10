// app/(admin)/media-studio/review/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import AdminReviewTable from '@/components/admin/AdminReviewTable';
import { updateReviewStatus } from './actions';

type ReviewStatus = 'pending' | 'approved' | 'rejected';
type ReviewSession = {
  id: string;
  title: string | null;
  user_id: string;
  review_status: ReviewStatus;
  created_at: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminReviewPage() {
  const supabase = createServerComponentClient();

  // Auth prüfen
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Admin-Rolle prüfen
  const { data: me } = await supabase
    .from('creator_profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single();

  if (!me || me.role !== 'admin') return notFound();

  // Sessions laden (über review_status)
  const { data, error } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, review_status, created_at')
    .order('created_at', { ascending: false });

  if (error) return notFound();

  const sessions: ReviewSession[] = (data || []).map((s: any) => ({
    id: s.id,
    title: s.title ?? null,
    user_id: s.user_id,
    review_status: (s.review_status ?? 'pending') as ReviewStatus,
    created_at: s.created_at,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">🔒 Admin Review – Creator Sessions</h1>
        <p className="text-sm text-muted-foreground">{sessions.length} Einträge</p>
      </div>

      <AdminReviewTable sessions={sessions} onUpdate={updateReviewStatus} />
    </main>
  );
}
