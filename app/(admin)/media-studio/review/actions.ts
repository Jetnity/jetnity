// app/(admin)/media-studio/review/actions.ts
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

  // Auth & Admin prüfen
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Nicht angemeldet');

  const { data: me } = await supabase
    .from('creator_profiles')
    .select('id, role')
    .eq('id', session.user.id)
    .single();

  if (!me || me.role !== 'admin') {
    throw new Error('Keine Admin-Berechtigung');
  }

  const { error } = await supabase
    .from('creator_sessions')
    .update({ review_status })
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Update fehlgeschlagen');
  }
}
