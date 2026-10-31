import type { NextRequest } from 'next/server'

import { decide } from './lib/decide.mjs'

/**
 * No path filter. The classifier allows only the two embed documents on the
 * pinned child host. Every other request stays on the closed S1 response.
 * Host is an authority check, not consent.
 */
export function proxy(request: NextRequest) {
  return decide(request)
}
