// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from './types/supabase' // relativ = gut für Edge

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase ENV fehlt: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

export async function middleware(req: NextRequest) {
  assertEnv()

  // Response vorbereiten, Headers/Cookies weiterreichen
  const res = NextResponse.next({ request: { headers: req.headers } })
  res.headers.set('x-middleware-cache', 'no-cache')

  const { pathname, search } = req.nextUrl

  // Nur Creator-Dashboard schützen (inkl. Unterseiten)
  const isProtected = pathname.startsWith('/creator/creator-dashboard')
  if (!isProtected) return res

  const supabase = createServerClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          res.cookies.set({ name, value, ...options })
        }
      },
    },
  })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const redirectTo = new URL('/', req.url)
      redirectTo.searchParams.set('next', pathname + search)
      return NextResponse.redirect(redirectTo)
    }

    const role = (user.user_metadata as any)?.role
    if (role && role !== 'creator' && role !== 'admin') {
      return NextResponse.redirect(new URL('/403', req.url))
    }

    return res
  } catch (err) {
    console.error('Middleware/Supabase Fehler:', err)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

// Wichtig: alle Unterpfade matchen
export const config = {
  matcher: ['/creator/creator-dashboard/:path*'],
}
