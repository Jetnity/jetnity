import { NextResponse } from 'next/server'

import { modellZustand } from '@/lib/modell/konfiguration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const EXPECTED_DEVELOPMENT_REF = 'yfvbxvijcorffwxbxahl'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())

  let observedRef = 'missing'
  let supabaseUrlValid = false
  if (supabaseUrl) {
    try {
      const hostname = new URL(supabaseUrl).hostname
      supabaseUrlValid = true
      observedRef = hostname.endsWith('.supabase.co')
        ? hostname.slice(0, -'.supabase.co'.length)
        : 'other-host'
    } catch {
      observedRef = 'invalid-url'
    }
  }

  const state = modellZustand()
  const body = {
    diagnostic: 'assistant-runtime-1-smoke',
    vercelEnv: process.env.VERCEL_ENV ?? 'missing',
    supabaseUrlValid,
    serviceRoleConfigured,
    expectedDevelopmentRef: EXPECTED_DEVELOPMENT_REF,
    observedRef,
    developmentTarget: observedRef === EXPECTED_DEVELOPMENT_REF,
    modelActive: state.aktiv,
    modelReason: state.aktiv ? null : state.grund,
    model: state.aktiv ? state.modell : null,
  }

  console.info('[assistant-smoke-diagnostic]', JSON.stringify(body))

  return NextResponse.json(body, {
    status: 200,
    headers: { 'cache-control': 'no-store' },
  })
}
