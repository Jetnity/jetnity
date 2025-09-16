// app/api/admin/infomaniak/mail/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET() {
  await requireAdmin()
  return NextResponse.json(
    {
      ok: false,
      error:
        'Not implemented. Nutze /api/admin/infomaniak/dns (GET/POST) für DNS/E-Mail-Checks & Auto-Fix.',
    },
    { status: 501 },
  )
}

export async function POST() {
  await requireAdmin()
  return NextResponse.json(
    { ok: false, error: 'Not implemented.' },
    { status: 501 },
  )
}
