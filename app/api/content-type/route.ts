// app/api/content-type/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// === KONFIG (falls deine Spalten/Tabellen anders heißen, hier anpassen)
const TABLE = 'creator_sessions'         // deine Tabelle
const COL_ID = 'id'                      // Primärschlüssel der Session
const COL_USER = 'user_id'               // Besitzer-Spalte
const COL_TYPE = 'content_type'          // zu setzende Spalte
const ALLOWED = new Set(['video','image','guide','blog','story','other'])

type Body = { sessionId?: string; contentType?: string }

// Supabase Admin (Server) – benötigt SERVICE ROLE KEY (nur Server!)
function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false } })
}

// Supabase JWT aus Cookie holen und User-ID extrahieren (sub)
function userIdFromCookie(): string | null {
  const jar = cookies().getAll()
  const entry = jar.find((c) => c.name.endsWith('-auth-token') && c.name.startsWith('sb-'))
  if (!entry?.value) return null
  try {
    // Cookie enthält JSON mit access_token
    const parsed = JSON.parse(entry.value)
    const access = Array.isArray(parsed) ? parsed[0] : parsed?.access_token ?? parsed?.currentSession?.access_token
    if (!access || typeof access !== 'string') return null
    const payload = JSON.parse(
      Buffer.from(access.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )
    return payload?.sub ?? null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const sessionId = (body.sessionId || '').trim()
    const contentType = (body.contentType || '').trim()

    if (!sessionId || !ALLOWED.has(contentType)) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
    }

    const userId = userIdFromCookie()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supa = admin()

    // Sicherheits-Update: nur eigene Zeile
    const { data, error } = await supa
      .from(TABLE)
      .update({ [COL_TYPE]: contentType })
      .eq(COL_ID, sessionId)
      .eq(COL_USER, userId)
      .select(`${COL_ID}, ${COL_TYPE}`)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Not Found or Forbidden' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, contentType: data[0][COL_TYPE] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal Error' }, { status: 500 })
  }
}
