import { parseCmsRecoveryMarker, type CmsRecoveryMarker } from './request'

/** Only an operation reference enters the URL. It confers no authority and
 * contains neither editorial text nor an instruction to replay a write. */
export function writeCmsIntentLocation(marker: CmsRecoveryMarker | null): boolean {
  try {
    if (typeof window === 'undefined') return false
    const url = new URL(window.location.href)
    if (url.pathname !== '/admin/content/editor') return false
    if (marker) {
      const checked = parseCmsRecoveryMarker(marker)
      if (!checked) return false
      url.searchParams.set('entry', checked.entryId)
      url.searchParams.set('cmsRequestId', checked.requestId)
      url.searchParams.set('cmsExpectedVersion', checked.expectedVersion)
    } else {
      url.searchParams.delete('cmsRequestId')
      url.searchParams.delete('cmsExpectedVersion')
    }
    window.history.replaceState(window.history.state, '', url.href)
    return true
  } catch { return false }
}
