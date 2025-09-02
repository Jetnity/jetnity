// app/(admin)/media-studio/review/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase/server';
import { updateReviewStatus, createChangeRequest } from './actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ChangeRequestDialog from './ChangeRequestDialog';
import MediaPreview from './MediaPreview';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type ReviewSession = {
  id: string;
  title: string | null;
  user_id: string;
  review_status: ReviewStatus;
  created_at: string;
  preview_url: string | null; // statt cover_url (schema-unabhängig)
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient();

  // Auth
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Admin-Gate
  const { data: me } = await supabase
    .from('creator_profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single();
  if (!me || me.role !== 'admin') return notFound();

  // Nur sichere (existierende) Spalten auswählen
  const { data: s, error } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, review_status, created_at')
    .eq('id', params.id)
    .single();
  if (error || !s) return notFound();

  // Generic Media-Fallback: wir wählen "*" und greifen tolerant auf mögliche Feldnamen zu
  let preview_url: string | null = null;
  try {
    const { data: m } = await supabase
      .from('session_media')
      .select('*')
      .eq('session_id', s.id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (m) {
      const mm = m as any;
      preview_url = mm.url || mm.public_url || mm.file_url || mm.path || null;
    }
  } catch {
    // kein preview verfügbar → bleibt null
  }

  const sessionData: ReviewSession = {
    id: s.id,
    title: s.title ?? null,
    user_id: s.user_id,
    review_status: (s.review_status ?? 'pending') as ReviewStatus,
    created_at: s.created_at,
    preview_url,
  };

  const statusCfg: Record<ReviewStatus, { label: string; badge: 'default' | 'outline' | 'destructive' }> = {
    pending: { label: 'Pending', badge: 'outline' },
    approved: { label: 'Approved', badge: 'default' },
    rejected: { label: 'Rejected', badge: 'destructive' },
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/media-studio/review" className="text-sm text-muted-foreground hover:underline">
            ← Zur Liste
          </Link>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Review: {sessionData.title || 'Untitled'}
          </h1>
          <Badge variant={statusCfg[sessionData.review_status].badge as any} className="capitalize">
            {statusCfg[sessionData.review_status].label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="pending" />
            <Button variant="outline" size="sm">Pending</Button>
          </form>
          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="approved" />
            <Button variant="success" size="sm">Approve</Button>
          </form>
          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="rejected" />
            <Button variant="destructive" size="sm">Reject</Button>
          </form>

          <ChangeRequestDialog sessionId={sessionData.id} onSubmitAction={createChangeRequest} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preview */}
        <section className="lg:col-span-8 rounded-2xl border overflow-hidden">
          <MediaPreview url={sessionData.preview_url} />
        </section>

        {/* Meta */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border p-4">
            <h2 className="font-semibold mb-2">Details</h2>
            <dl className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Session-ID</dt>
                <dd className="font-mono text-xs">{sessionData.id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Creator</dt>
                <dd className="font-mono text-xs">{sessionData.user_id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Erstellt</dt>
                <dd>
                  {new Intl.DateTimeFormat('de-CH', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }).format(new Date(sessionData.created_at))}
                </dd>
              </div>
            </dl>

            <div className="my-4 h-px bg-border" />

            <h3 className="text-sm font-semibold mb-1">Schnell-Aktionen</h3>
            <div className="flex flex-wrap gap-2">
              <a className="text-sm underline underline-offset-2 text-primary" href={`/creator/media-studio/session/${sessionData.id}`} target="_blank" rel="noopener noreferrer">
                Im Editor öffnen
              </a>
              <a className="text-sm underline underline-offset-2 text-primary" href={`/story/${sessionData.id}`} target="_blank" rel="noopener noreferrer">
                Öffentliche Vorschau
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
