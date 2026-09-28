import { createRoot } from 'react-dom/client'

import SecurityWidget from '@/components/admin/security/SecurityWidget'

type SyntheticEvent = {
  id: string
  created_at: string
  ip: string
  type: string
  user_id: null
  detail: string
}

type SyntheticBlock = {
  ip: string
  reason: string
  created_at: string
}

type Fixture = {
  fail: boolean
  events: SyntheticEvent[]
  blocklist: SyntheticBlock[]
}

function event(index: number): SyntheticEvent {
  const n = index + 1
  return {
    id: `synthetic-event-${n}`,
    created_at: new Date(Date.now() - index * 1000).toISOString(),
    ip: `203.0.113.${(index % 250) + 1}`,
    type: index === 0 ? 'login_failed' : 'note',
    user_id: null,
    detail: `synthetic-detail-${n}`,
  }
}

function events(count: number): SyntheticEvent[] {
  return Array.from({ length: count }, (_, index) => event(index))
}

const blocklist: SyntheticBlock[] = [
  {
    ip: '203.0.113.50',
    reason: 'synthetic blocklist row',
    created_at: '2026-09-28T12:00:00.000Z',
  },
]

const FIXTURES: Record<string, Fixture> = {
  unmatched: { fail: false, events: events(1), blocklist },
  empty: { fail: false, events: [], blocklist: [] },
  matched: { fail: false, events: events(1), blocklist },
  rows199: { fail: false, events: events(199), blocklist: [] },
  rows200: { fail: false, events: events(200), blocklist: [] },
  failed: { fail: true, events: [], blocklist: [] },
}

type Write = { url: string; method: string }

declare global {
  interface Window {
    __securityFilter: {
      ready: boolean
      scenario: string
      writes: () => Write[]
      listCalls: () => number
    }
  }
}

const scenario = new URLSearchParams(window.location.search).get('scenario') || 'unmatched'
const fixture = FIXTURES[scenario]
if (!fixture) {
  throw new Error(`unknown synthetic scenario: ${scenario}`)
}

const writes: Write[] = []
let listCalls = 0

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = init?.method ?? 'GET'
  if (url.includes('/api/admin/security/list')) {
    listCalls += 1
    if (fixture.fail) {
      return new Response(JSON.stringify({ error: 'synthetic read failed' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(
      JSON.stringify({ events: fixture.events, blocklist: fixture.blocklist }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }
  writes.push({ url, method })
  return new Response(JSON.stringify({ ok: false, error: 'unexpected synthetic write' }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  })
}

window.__securityFilter = {
  ready: false,
  scenario,
  writes: () => writes.slice(),
  listCalls: () => listCalls,
}

createRoot(document.getElementById('root')!).render(<SecurityWidget />)
window.__securityFilter.ready = true
