// app/(admin)/admin/media-studio/page.tsx
export const dynamic = 'force-dynamic'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { redirect } from 'next/navigation'

export default async function MediaStudioPage() {
  await requireAdmin()
  // Vorerst direkt zur Review-Liste leiten
  redirect('/admin/media-studio/review')
}
