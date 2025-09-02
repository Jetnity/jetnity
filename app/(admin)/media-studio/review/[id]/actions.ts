// app/(admin)/media-studio/review/[id]/actions.ts
'use server';

import { createServerComponentClient } from '@/lib/supabase/server';

type ReviewStatus = 'pending' | 'approved' | 'rejected';

export async function updateReviewStatus(formData: FormData) {
  const id = String(formData.get('id') || '');
  const review_status = String(formData.get('review_status') || '') as ReviewStatus;

  if (!id || !['pending', 'approved', 'rejected'].includes(review_status)) {
    throw new Error('Ungültige Parameter');
  }

  const supabase = createServerComponentClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht angemeldet');

  const { data: me } = await supabase
    .from('creator_profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single();
  if (!me || me.role !== 'admin') throw new Error('Keine Admin-Berechtigung');

  const { error } = await supabase
    .from('creator_sessions')
    .update({ review_status })
    .eq('id', id);

  if (error) throw new Error(error.message || 'Update fehlgeschlagen');
}

export async function createChangeRequest(formData: FormData) {
  const session_id = String(formData.get('session_id') || '');
  const severity = String(formData.get('severity') || '');
  const reason = (formData.get('reason') || '') as string;
  const details = (formData.get('details') || '') as string;
  const due_date = (formData.get('due_date') || '') as string; // YYYY-MM-DD

  if (!session_id || !['low','medium','high','blocker'].includes(severity)) {
    throw new Error('Ungültige Parameter');
  }

  const supabase = createServerComponentClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht angemeldet');

  const { data: me } = await supabase
    .from('creator_profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single();
  if (!me || me.role !== 'admin') throw new Error('Keine Admin-Berechtigung');

  const insert = {
    session_id,
    admin_id: session.user.id,
    severity,
    reason: reason || null,
    details: details || null,
    due_date: due_date ? new Date(due_date).toISOString().slice(0,10) : null,
    status: 'open',
  };

  const { error } = await supabase.from('session_review_requests').insert(insert);
  if (error) throw new Error(error.message || 'Change Request fehlgeschlagen');
}
