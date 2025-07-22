import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from './types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Modernste Cookie-Schnittstelle: Nur getAll und setAll!
  const cookieStore = {
    getAll() {
      // Liefert ein Array von { name, value } für alle Cookies
      return req.cookies.getAll().map(({ name, value }) => ({ name, value }))
    },
    setAll(cookiesArr: { name: string; value: string; options?: any }[]) {
      // Setzt alle Cookies im Response-Objekt
      cookiesArr.forEach(({ name, value, options }) => {
        res.cookies.set(name, value, options)
      })
    },
  }

  // Supabase-SSR-Client inkl. Cookie-Support
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  )

  // Prüfe User-Session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Nur eingeloggte Creator dürfen das Dashboard sehen
  const isProtectedPath = req.nextUrl.pathname.startsWith('/creator/creator-dashboard')

  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// Nur für geschützte Creator-Dashboard-Route aktivieren!
export const config = {
  matcher: ['/creator/creator-dashboard'],
}
