import 'server-only'

import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL } from '../method/human-contract'
import { getHumanRelease } from '../method/human-release'
import type { DevGuardRequest } from './guard-contract'

// The existing release selector binds the exact Vercel project/repository and
// Dev branch or Production main. A request never chooses or overrides a target.
export function selectedGuardEnvironment(): 'Dev' | 'Production' | null {
  const release = getHumanRelease(), url = getServerSupabaseUrl()
  if (release?.targetUrl === HUMAN_METHOD_DEV_URL && url === HUMAN_METHOD_DEV_URL) return 'Dev'
  if (release?.targetUrl === HUMAN_METHOD_PRODUCTION_URL && url === HUMAN_METHOD_PRODUCTION_URL) return 'Production'
  return null
}

export function guardRequestAllowed(environment: ReturnType<typeof selectedGuardEnvironment>, request: DevGuardRequest): boolean {
  return environment === 'Dev' || (environment === 'Production' && (request.intent === 'review' || request.action === 'resume'))
}
