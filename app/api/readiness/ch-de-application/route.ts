import { NextResponse } from 'next/server'
import { applicationPilotRequest } from '@/lib/readiness/official-truth-ch-de-application-pilot-1/request-server'
import { readinessHttpHeader } from '@/lib/readiness/anfrage'
export const dynamic = 'force-dynamic'
export const maxDuration = 20
export async function POST(req: Request) {
  try {
    const result = await applicationPilotRequest(req)
    return NextResponse.json(result.body,{ status: result.status, headers: readinessHttpHeader() })
  } catch {
    return NextResponse.json({ message: 'Die Prüfung ist gerade nicht verfügbar.' },{ status: 503, headers: readinessHttpHeader() })
  }
}
