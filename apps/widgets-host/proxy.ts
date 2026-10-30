import type { NextRequest } from 'next/server'

import { failClosed } from './lib/fail-closed'

/**
 * There is intentionally no path filter. Next therefore runs this proxy
 * for every request, including framework asset paths. The request is not read.
 */
export function proxy(_request: NextRequest) {
  void _request
  return failClosed()
}
