// lib/analytics.ts
'use client'

type Primitive = string | number | boolean | null | undefined
export type EventProps = Record<string, Primitive>
export type TrackPayload =
  | { type: 'event'; name: string; props: EventProps; t: number }
  | { type: 'page'; props: EventProps; t: number }
  | { type: 'identify'; userId?: string; traits?: EventProps; t: number }

const ENDPOINT =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) ||
  '/api/analytics'

const MAX_BATCH = 20
const FLUSH_INTERVAL = 5000

let superProps: EventProps = {}
let queue: TrackPayload[] = []
let flushTimer: any = null
let flushing = false

const isBrowser = () => typeof window !== 'undefined'

function vendorTrack(name: string, props: EventProps) {
  if (!isBrowser()) return
  const w = window as any
  // PostHog
  if (w.posthog?.capture) {
    try { w.posthog.capture(name, props) } catch {}
  }
  // Plausible
  if (typeof w.plausible === 'function') {
    try { w.plausible(name, { props }) } catch {}
  }
  // GA4
  if (typeof w.gtag === 'function') {
    try { w.gtag('event', name, props) } catch {}
  }
}

async function sendBatch(batch: TrackPayload[]) {
  if (!isBrowser() || batch.length === 0) return
  const body = JSON.stringify({ v: 1, events: batch })
  const blob = new Blob([body], { type: 'application/json' })

  // Try Beacon first
  const beac = (navigator as any)?.sendBeacon?.(ENDPOINT, blob)
  if (beac) return

  // Fallback: fetch
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {}
}

function scheduleFlush(immediate = false) {
  if (flushing) return
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(async () => {
    if (queue.length === 0) return
    flushing = true
    const batch = queue.splice(0, MAX_BATCH)
    await sendBatch(batch)
    flushing = false
    if (queue.length > 0) scheduleFlush(true)
  }, immediate ? 0 : FLUSH_INTERVAL)
}

export function setSuperProps(props: EventProps) {
  superProps = { ...superProps, ...props }
}

export function identify(userId?: string, traits?: EventProps) {
  if (!isBrowser()) return
  const w = window as any
  if (w.posthog?.identify) {
    try { w.posthog.identify(userId, traits) } catch {}
  }
  if (typeof w.gtag === 'function' && userId) {
    try { w.gtag('set', { user_id: userId, ...(traits || {}) }) } catch {}
  }
  queue.push({ type: 'identify', userId, traits, t: Date.now() })
  scheduleFlush(true)
}

export function pageview(path?: string, title?: string, referrer?: string) {
  if (!isBrowser()) return
  const props = {
    path: path ?? (location.pathname + location.search),
    title: title ?? document.title,
    referrer: referrer ?? document.referrer,
    ...superProps,
  }
  vendorTrack('page_view', props)
  queue.push({ type: 'page', props, t: Date.now() })
  scheduleFlush()
}

export function trackEvent(name: string, props: EventProps = {}) {
  if (!isBrowser()) return
  const merged = { ...superProps, ...props }
  vendorTrack(name, merged)
  queue.push({ type: 'event', name, props: merged, t: Date.now() })
  if (queue.length >= MAX_BATCH) scheduleFlush(true)
  else scheduleFlush()
}

// Auto-Flush bei „Seite verlassen“
if (isBrowser()) {
  addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && queue.length) {
      const batch = queue.splice(0)
      void sendBatch(batch)
    }
  })
  addEventListener('pagehide', () => {
    if (queue.length) void sendBatch(queue.splice(0))
  })
  addEventListener('online', () => {
    if (queue.length) scheduleFlush(true)
  })
}

export default { trackEvent, pageview, identify, setSuperProps }
