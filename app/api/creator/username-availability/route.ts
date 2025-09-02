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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = (searchParams.get('u') || '').toLowerCase().trim()
    const excludeId = searchParams.get('excludeId') || undefined

    // Grundvalidierung
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      return NextResponse.json({ available: false, reason: 'invalid' }, { status: 200 })
    }
    // Reservierte Namen sperren
    if (RESERVED.has(username)) {
      return NextResponse.json({ available: false, reason: 'reserved' }, { status: 200 })
    }

    const admin = createSupabaseAdmin()
    // Case-insensitive Eindeutigkeit setzt voraus, dass die Spalte citext ist (siehe SQL-Migration)
    let q = admin
      .from('creator_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('username', username)

    if (excludeId) q = q.neq('id', excludeId)

    const { count, error } = await q
    if (error) {
      return NextResponse.json({ available: false, error: error.message }, { status: 200 })
    }
    return NextResponse.json({ available: (count ?? 0) === 0 }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ available: false, error: e?.message ?? 'unknown' }, { status: 200 })
  }
}
