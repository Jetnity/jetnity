// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types/supabase' // relative statt "@/"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function hasEnv() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export async function middleware(req: NextRequest) {
  // Antwortobjekt vorbereiten, Cookies durchreichen (wichtig für Supabase SSR)
  const res = NextResponse.next({ request: { headers: req.headers } })
  res.headers.set('x-middleware-cache', 'no-cache')

  const { pathname, search } = req.nextUrl

  // Nur Creator-Dashboard schützen; alles andere sofort durchlassen
  if (!pathname.startsWith('/creator/creator-dashboard')) {
    return res
  }

  // Fällt zurück auf „durchlassen“, wenn ENV in Preview/CI fehlt
  if (!hasEnv()) {
    console.error(
      '[middleware] Supabase ENV fehlt: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
    return res
  }

  // Supabase-Client mit Cookie-Adapter (Edge-kompatibel)
  const supabase = createServerClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          // Cookies zurück ins Response-Objekt schreiben
          res.cookies.set({ name, value, ...options })
        }
      },
    },
  })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Nicht eingeloggt → zur Startseite, mit "next" Rücksprungziel
    if (!user) {
      const redirectTo = new URL('/', req.url)
      redirectTo.searchParams.set('next', pathname + search)
      return NextResponse.redirect(redirectTo)
    }

    // Rolle prüfen (nur creator/admin erlaubt)
    const role = (user.user_metadata as any)?.role
    if (role && role !== 'creator' && role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url))
    }

    return res
  } catch (err) {
    console.error('[middleware] Supabase-Fehler:', err)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

/**
 * Wichtig:
 * KEIN `export const config = { matcher: ... }`.
 * Wir scopen die Middleware per Early-Return oben.
 * So umgehst du den micromatch/picomatch Stack-Overflow.
 */
