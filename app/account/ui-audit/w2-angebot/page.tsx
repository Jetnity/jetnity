// Local browser-only synthetic W2 fixture. Never publicly available and
// never writes to Supabase, user journeys or real provider APIs.
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import W2TestangebotDev from '@/components/trips/W2TestangebotDev'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function W2TestangebotPage() {
  if (process.env.VERCEL_ENV !== 'preview'
    || process.env.VERCEL_GIT_COMMIT_REF !== 'feat/workspace-w2-ux-followup-1299-20261124') notFound()
  return <W2TestangebotDev />
}
