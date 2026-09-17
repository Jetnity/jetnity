import { NextResponse } from 'next/server'

import { modellZustand } from '@/lib/modell/konfiguration'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const EXPECTED_DEVELOPMENT_REF = 'yfvbxvijcorffwxbxahl'

export async function GET() {
  const vercelEnv = process.env.VERCEL_ENV ?? 'missing'
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
  const developmentTarget = observedRef === EXPECTED_DEVELOPMENT_REF

  let status = 200
  let gate = 'all-preflight-gates-pass'
  if (vercelEnv !== 'preview') {
    status = 421
    gate = 'not-preview'
  } else if (!supabaseUrlValid) {
    status = 422
    gate = 'supabase-url-invalid-or-missing'
  } else if (!developmentTarget) {
    status = 423
    gate = 'not-development-supabase'
  } else if (!serviceRoleConfigured) {
    status = 424
    gate = 'service-role-missing'
  } else if (!state.aktiv) {
    status = 425
    gate = 'model-inactive'
  }

  return NextResponse.json(
    {
      diagnostic: 'assistant-runtime-1-smoke',
      gate,
      vercelEnv,
      supabaseUrlValid,
      serviceRoleConfigured,
      expectedDevelopmentRef: EXPECTED_DEVELOPMENT_REF,
      observedRef,
      developmentTarget,
      modelActive: state.aktiv,
      modelReason: state.aktiv ? null : state.grund,
      model: state.aktiv ? state.modell : null,
    },
    {
      status,
      headers: { 'cache-control': 'no-store' },
    },
  )
}
