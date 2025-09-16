// app/api/admin/copilot/execute/route.ts
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function POST(req: Request) {
  await requireAdmin()

  const body = await req.json().catch(() => ({}))
  const action = String(body?.action ?? '')
  const payload = body?.payload ?? null

  // Platzhalter: Aktion entgegennehmen, validieren, ausführen/queue’n
  // (z. B. Hintergrundjob; hier nur ein Echo)
  return NextResponse.json({
    status: 'queued',
    received: { action, payload },
  })
}
