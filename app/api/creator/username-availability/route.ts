// app/api/creator/username-availability/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/** feste Reservierungen, die niemals vergeben werden */
const RESERVED = new Set([
  'jetnity',
  'admin', 'administrator', 'root', 'owner', 'system',
  'support', 'help',
  'api', 'app', 'www',
  'blog', 'news',
  'creator', 'creators', 'dashboard', 'settings',
  'login', 'signin', 'signup', 'logout',
  'team', 'teams',
  'marketing', 'ads',
  'test', 'tests'
])

const USERNAME_RE = /^[a-z0-9._-]{3,30}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const username = (searchParams.get('u') || '').trim().toLowerCase()
    const excludeId = searchParams.get('excludeId') || undefined
    const excludeProfileId = searchParams.get('excludeProfileId') || undefined
    const excludeUserId = searchParams.get('excludeUserId') || undefined

    if (!USERNAME_RE.test(username)) {
      return NextResponse.json({ available: false, reason: 'invalid' })
    }
    if (RESERVED.has(username)) {
      return NextResponse.json({ available: false, reason: 'reserved' })
    }

    const supa = createSupabaseAdmin()
    let q = supa
      .from('creator_profiles') // ⚠️ keine Generics!
      .select('id', { count: 'exact', head: true })
      .eq('username', username)

    if (excludeProfileId && UUID_RE.test(excludeProfileId)) q = q.neq('id', excludeProfileId)
    if (excludeUserId && UUID_RE.test(excludeUserId)) q = q.neq('user_id', excludeUserId)
    if (excludeId && UUID_RE.test(excludeId)) q = q.neq('id', excludeId).neq('user_id', excludeId)

    const { count, error } = await q
    if (error) return NextResponse.json({ available: false, reason: 'error', error: error.message })

    return NextResponse.json({ available: (count ?? 0) === 0 })
  } catch (e: any) {
    return NextResponse.json({ available: false, reason: 'error', error: e?.message ?? 'unknown' })
  }
}
