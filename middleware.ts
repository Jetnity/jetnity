// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types/supabase' // relative statt "@/"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Die Middleware prüft ausschliesslich die Anmeldung, nicht die Rolle.
 *
 * Rollen liegen in der Datenbank; sie bei jedem Request am Rand abzufragen
 * würde die Autorisierung auf zwei Orte verteilen. Die Rollenprüfung passiert
 * deshalb im Layout der Gruppe `(admin)` und in `requireAdminApi()` – die
 * Middleware sorgt davor dafür, dass anonyme Zugriffe die geschützten Bereiche
 * gar nicht erreichen, und liefert je Oberfläche die passende Antwort.
 */
type Scope = {
  /** Trifft der Pfad diesen Bereich? */
  matches: (pathname: string) => boolean
  /** Antwort für einen nicht angemeldeten Zugriff. */
  deny: (req: NextRequest) => NextResponse
}

function jsonDenied(status: 401 | 503, error: string, message: string) {
  const res = NextResponse.json({ ok: false, error, message }, { status })
  res.headers.set('Cache-Control', 'no-store')
  if (status === 401) res.headers.set('WWW-Authenticate', 'Bearer')
  return res
}

function redirectToLogin(req: NextRequest, loginPath: string) {
  const target = new URL(loginPath, req.url)
  target.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
  return NextResponse.redirect(target)
}

const SCOPES: Scope[] = [
  {
    // API-Routen bekommen einen Statuscode. Eine Weiterleitung auf eine
    // HTML-Loginseite käme im Client als erfolgreiche Antwort an.
    matches: pathname => pathname.startsWith('/api/admin'),
    deny: () => jsonDenied(401, 'unauthenticated', 'Nicht angemeldet.'),
  },
  {
    // `/admin/login` selbst muss offen bleiben, sonst entsteht eine Endlosschleife.
    matches: pathname => pathname.startsWith('/admin') && !pathname.startsWith('/admin/login'),
    deny: req => redirectToLogin(req, '/admin/login'),
  },
  {
    matches: pathname => pathname.startsWith('/account'),
    deny: req => redirectToLogin(req, '/login'),
  },
]

export async function middleware(req: NextRequest) {
  // Antwortobjekt vorbereiten, Cookies durchreichen (wichtig für Supabase SSR)
  const res = NextResponse.next({ request: { headers: req.headers } })
  res.headers.set('x-middleware-cache', 'no-cache')

  const { pathname } = req.nextUrl

  const scope = SCOPES.find(candidate => candidate.matches(pathname))
  if (!scope) return res

  // Ohne Zugangsdaten lässt sich keine Identität prüfen. Früher wurde in
  // diesem Fall durchgelassen; ein geschützter Bereich, der bei fehlender
  // Konfiguration aufgeht, ist aber genau das Gegenteil von Schutz.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      '[middleware] Supabase-ENV fehlt (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) – geschützter Bereich wird gesperrt.',
    )
    return pathname.startsWith('/api/')
      ? jsonDenied(503, 'unconfigured', 'Anmeldung derzeit nicht prüfbar.')
      : scope.deny(req)
  }

  // Supabase-Client mit Cookie-Adapter (Edge-kompatibel)
  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    // `getUser()` fragt den Auth-Server und ist damit belastbar. `getSession()`
    // liest nur die mitgeschickten Cookies und taugt nicht als Grundlage.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return scope.deny(req)

    return res
  } catch (err) {
    console.error('[middleware] Supabase-Fehler:', err)
    // Nicht prüfbar heisst nicht freigegeben.
    return pathname.startsWith('/api/')
      ? jsonDenied(503, 'lookup-failed', 'Anmeldung derzeit nicht prüfbar.')
      : scope.deny(req)
  }
}

/**
 * Wichtig:
 * KEIN `export const config = { matcher: ... }`.
 * Wir scopen die Middleware per Early-Return oben.
 * So umgehst du den micromatch/picomatch Stack-Overflow.
 */
