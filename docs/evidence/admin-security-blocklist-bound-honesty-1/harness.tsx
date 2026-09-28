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
    ip: `203.0.113.${n}`,
    type: index === 0 ? 'login_failed' : 'note',
    user_id: null,
    detail: `synthetic-detail-${n}`,
  }
}

function events(count: number): SyntheticEvent[] {
  return Array.from({ length: count }, (_, index) => event(index))
}

function block(index: number): SyntheticBlock {
  const n = index + 1
  return {
    ip: `203.0.113.${n}`,
    reason: `synthetic-block-${n}`,
    created_at: '2026-09-28T12:00:00.000Z',
  }
}

function blocks(count: number): SyntheticBlock[] {
  return Array.from({ length: count }, (_, index) => block(index))
}

const FIXTURES: Record<string, Fixture> = {
  baseline200: { fail: false, events: [], blocklist: blocks(200) },
  empty: { fail: false, events: [], blocklist: [] },
  rows199: { fail: false, events: [], blocklist: blocks(199) },
  rows200: { fail: false, events: [], blocklist: blocks(200) },
  events200: { fail: false, events: events(200), blocklist: [] },
  events200blocks199: { fail: false, events: events(200), blocklist: blocks(199) },
  both200: { fail: false, events: events(200), blocklist: blocks(200) },
  filterOnBound: { fail: false, events: events(1), blocklist: blocks(200) },
  failed: { fail: true, events: [], blocklist: [] },
}

type Call = { url: string; method: string }

declare global {
  interface Window {
    __securityBlocklist: {
      ready: boolean
      scenario: string
      calls: () => Call[]
    }
  }
}

const scenario = new URLSearchParams(window.location.search).get('scenario') || 'baseline200'
const fixture = FIXTURES[scenario]
if (!fixture) {
  throw new Error(`unknown synthetic scenario: ${scenario}`)
}

const calls: Call[] = []

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const method = (init?.method ?? 'GET').toUpperCase()
  calls.push({ url, method })
  if (method !== 'GET' || !url.includes('/api/admin/security/list')) {
    return new Response(JSON.stringify({ ok: false, error: 'unexpected synthetic request' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  if (fixture.fail) {
    return new Response(JSON.stringify({ error: 'synthetic read failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ events: fixture.events, blocklist: fixture.blocklist }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

window.__securityBlocklist = {
  ready: false,
  scenario,
  calls: () => calls.slice(),
}

createRoot(document.getElementById('root')!).render(<SecurityWidget />)
window.__securityBlocklist.ready = true
