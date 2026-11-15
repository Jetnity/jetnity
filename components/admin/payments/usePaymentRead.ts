'use client'

import { useCallback, useEffect, useRef } from 'react'
import { lade } from '@/lib/admin/ladezustand'

/** One current read per card. A denied response clears the whole payment view. */
export function usePaymentRead(onDenied: () => void) {
  const generation = useRef(0)
  const pending = useRef<AbortController | null>(null)

  useEffect(() => () => {
    generation.current += 1
    pending.current?.abort()
  }, [])

  return useCallback(async <T,>(url: string, parse: (body: unknown) => T) => {
    pending.current?.abort()
    const controller = new AbortController()
    pending.current = controller
    const request = ++generation.current
    let denied = false
    const result = await lade(async () => {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
      if (request === generation.current && !controller.signal.aborted && (response.status === 401 || response.status === 403)) {
        denied = true
        // Clear as soon as headers deny access, without waiting for the body.
        onDenied()
      }
      return response
    }, parse)
    if (request !== generation.current || controller.signal.aborted || denied) return null
    pending.current = null
    return result
  }, [onDenied])
}
