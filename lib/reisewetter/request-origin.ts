import { tripServicesOrigin, type MapEnvironment } from '@/lib/maps/config'

// The failed-release recovery preview has a *dedicated, stable* URL. Permitting
// exactly this non-Production origin lets QA exercise the normal auth/CMP/BG1
// admission path; it does NOT grant weather quota or call a provider by itself.
// Never derive an allowed origin from Host, Origin, x-forwarded-host or a
// NEXT_PUBLIC variable supplied by the requester.
const INCIDENT_DEV_ORIGIN =
  'https://jetnity-app-git-fix-release1260-csp-ki-b917c2-jetnity-e1b93c82.vercel.app'
const INCIDENT_DEV_BRANCH =
  'fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120'

export function weatherRequestOrigin(env: MapEnvironment): string | null {
  const existing = tripServicesOrigin(env)
  if (existing) return existing
  return env.VERCEL_ENV === 'preview' &&
    env.VERCEL_GIT_COMMIT_REF === INCIDENT_DEV_BRANCH
    ? INCIDENT_DEV_ORIGIN
    : null
}
