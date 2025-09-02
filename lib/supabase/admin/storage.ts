// lib/supabase/admin/storage.ts
import 'server-only'
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function ensurePublicBucket(bucket: string) {
  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(SB_URL, SB_SERVICE_KEY, { auth: { persistSession: false } })

  // Bucket anlegen (falls nicht vorhanden)
  await admin.storage.createBucket(bucket, { public: true }).catch(() => {})

  // Public lassen (idempotent)
  await admin.storage.updateBucket(bucket, { public: true }).catch(() => {})
}
