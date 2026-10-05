// proxy.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types/supabase' // relative statt "@/"

/**
 * Der Proxy prüft ausschliesslich die Anmeldung, nicht die Rolle.
 *
 * Rollen liegen in der Datenbank; sie bei jedem Request am Rand abzufragen
 * würde die Autorisierung auf zwei Orte verteilen. Die Rollenprüfung passiert
 * deshalb im Layout der Gruppe `(admin)` und in `requireAdminApi()` – der
 * Proxy sorgt davor dafür, dass anonyme Zugriffe die geschützten Bereiche
 * gar nicht erreichen, und liefert je Oberfläche die passende Antwort.
 *
 * Next 16 führt diesen Rand auf Node.js aus. Das ändert die Semantik nicht:
 * weiter nur Identität, kein Matcher, kein AAL-/Rollenentscheider.
 *
 * Identität und Ausfall bleiben getrennt. Nicht angemeldet führt zur Login-
 * Weiterleitung. Ein nicht prüfbarer Auth-Server oder fehlende Konfiguration
 * ist kein „bitte anmelden“, sondern ein ehrlicher unavailable/retry-Zustand.
 * Schutz und AAL2 werden dadurch nicht geschwächt: Freigabe gibt es nur bei
 * belastbar gelesener Identität.
 */
type Scope = {
  /** Trifft der Pfad diesen Bereich? */
  matches: (pathname: string) => boolean
  /** Antwort für einen nicht angemeldeten Zugriff. */
  deny: (req: NextRequest) => NextResponse
}

export type AuthLookupUnavailableGrund = 'unconfigured' | 'lookup-failed'

export type AuthLookupFehler = {
  name?: string
  status?: number
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

function htmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function retryPfad(req: NextRequest): string {
  const raw = req.nextUrl.pathname + req.nextUrl.search
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

/**
 * Ein fehlendes oder abgelaufenes Token ist „nicht angemeldet“.
 * Jeder andere getUser-Fehler ist ein Ausfall der Prüfung, kein Logout.
 */
export function authLookupFehlerIstSitzungFehlend(
  error: AuthLookupFehler | null | undefined,
): boolean {
  if (!error) return false
  return error.name === 'AuthSessionMissingError' || error.status === 401
}

export function authLookupUnavailableHtml(input: {
  grund: AuthLookupUnavailableGrund
  retryHref: string
}): string {
  const retryHref = htmlEscape(
    input.retryHref.startsWith('/') && !input.retryHref.startsWith('//')
      ? input.retryHref
      : '/',
  )
  const titel = 'Anmeldung derzeit nicht prüfbar'
  const text =
    input.grund === 'unconfigured'
      ? 'Die Anmeldung kann gerade nicht geprüft werden. Das bedeutet nicht, dass du abgemeldet bist. Bitte versuche es später erneut.'
      : 'Deine Anmeldung konnte gerade nicht geprüft werden. Das bedeutet nicht, dass du abgemeldet bist. Bitte versuche es in einigen Minuten erneut.'

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>${titel}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100dvh;
        background: #f5f4ee;
        color: #39534b;
        font-family: system-ui, ui-sans-serif, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      main {
        box-sizing: border-box;
        max-width: 40rem;
        margin: 0 auto;
        padding: 3.5rem 1.25rem 4rem;
      }
      section {
        background: #fff;
        border: 1px solid rgb(15 46 42 / 0.05);
        border-radius: 30px;
        padding: 2rem 1.5rem;
        box-shadow: 0 20px 60px rgb(15 46 42 / 0.07);
      }
      h1 {
        margin: 0;
        color: #153a33;
        font-size: 1.75rem;
        line-height: 1.2;
        letter-spacing: -0.04em;
      }
      p {
        margin: 1rem 0 0;
        color: #5f756d;
        font-size: 0.95rem;
        line-height: 1.6;
      }
      nav {
        display: grid;
        gap: 0.75rem;
        margin-top: 2rem;
      }
      a {
        display: inline-flex;
        min-height: 2.75rem;
        align-items: center;
        justify-content: center;
        padding: 0 1.25rem;
        border-radius: 999px;
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
      }
      a[data-auth-lookup-action="retry"] {
        background: #153a33;
        color: #fff;
      }
      a[data-auth-lookup-action="home"] {
        border: 1px solid #cbd7d2;
        background: #fff;
        color: #153a33;
      }
      @media (min-width: 640px) {
        main { padding: 5rem 1.5rem; }
        section { padding: 2.5rem; }
        nav { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <section data-auth-lookup="${input.grund}">
        <h1>${titel}</h1>
        <p>${text}</p>
        <nav aria-label="Nächste Schritte">
          <a data-auth-lookup-action="retry" href="${retryHref}">Erneut versuchen</a>
          <a data-auth-lookup-action="home" href="/">Zur Startseite</a>
        </nav>
      </section>
    </main>
  </body>
</html>`
}

function htmlDenied(req: NextRequest, grund: AuthLookupUnavailableGrund) {
  const res = new NextResponse(
    authLookupUnavailableHtml({ grund, retryHref: retryPfad(req) }),
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'x-middleware-cache': 'no-cache',
      },
    },
  )
  return res
}

function denyUnavailable(
  req: NextRequest,
  pathname: string,
  grund: AuthLookupUnavailableGrund,
) {
  return pathname.startsWith('/api/')
    ? jsonDenied(503, grund, 'Anmeldung derzeit nicht prüfbar.')
    : htmlDenied(req, grund)
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
    // `/admin/mfa` bleibt angemeldet geschützt, liegt aber nicht hinter dem
    // AAL2-Admin-Guard: sonst könnte ein AAL1-Admin den Step-up nicht erreichen.
    matches: pathname => pathname.startsWith('/admin') && !pathname.startsWith('/admin/login'),
    deny: req => redirectToLogin(req, '/admin/login'),
  },
  {
    matches: pathname => pathname.startsWith('/account'),
    deny: req => redirectToLogin(req, '/login'),
  },
]

export async function proxy(req: NextRequest) {
  // Antwortobjekt vorbereiten, Cookies durchreichen (wichtig für Supabase SSR)
  const res = NextResponse.next({ request: { headers: req.headers } })
  res.headers.set('x-middleware-cache', 'no-cache')

  const { pathname } = req.nextUrl

  const scope = SCOPES.find(candidate => candidate.matches(pathname))
  if (!scope) return res

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Ohne Zugangsdaten lässt sich keine Identität prüfen. Früher wurde in
  // diesem Fall durchgelassen; ein geschützter Bereich, der bei fehlender
  // Konfiguration aufgeht, ist aber genau das Gegenteil von Schutz.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[proxy] Supabase-ENV fehlt (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) – geschützter Bereich wird gesperrt.',
    )
    return denyUnavailable(req, pathname, 'unconfigured')
  }

  // Supabase-Client mit Cookie-Adapter (Next-16-Proxy läuft auf Node.js)
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
      error,
    } = await supabase.auth.getUser()

    if (error) {
      if (authLookupFehlerIstSitzungFehlend(error)) return scope.deny(req)
      console.error('[proxy] Supabase-Fehler:', error)
      return denyUnavailable(req, pathname, 'lookup-failed')
    }

    if (!user) return scope.deny(req)

    return res
  } catch (err) {
    console.error('[proxy] Supabase-Fehler:', err)
    // Nicht prüfbar heisst nicht freigegeben und auch nicht abgemeldet.
    return denyUnavailable(req, pathname, 'lookup-failed')
  }
}

/**
 * Wichtig:
 * KEIN `export const config = { matcher: ... }`.
 * Wir scopen den Proxy per Early-Return oben.
 * So umgehst du den micromatch/picomatch Stack-Overflow.
 */
