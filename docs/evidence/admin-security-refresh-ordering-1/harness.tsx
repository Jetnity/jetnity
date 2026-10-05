import { createRoot } from 'react-dom/client'

import SecurityWidget from '@/components/admin/security/SecurityWidget'

type Call = {
  id: number
  url: string
  method: string
  body: string | null
}

type Gate = Call & {
  resolve: (response: Response) => void
}

type IntervalMark = {
  ms: number
}

declare global {
  interface Window {
    __intervalMarks?: IntervalMark[]
    __securityRefresh?: {
      ready: boolean
      calls: () => Call[]
      pending: () => Call[]
      intervals: () => number[]
      release: (id: number, status: number, body: unknown) => void
    }
  }
}

const calls: Call[] = []
const gates: Gate[] = []
let nextId = 0

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const id = ++nextId
  const call: Call = {
    id,
    url: requestUrl(input),
    method: (init?.method ?? 'GET').toUpperCase(),
    body: typeof init?.body === 'string' ? init.body : null,
  }
  calls.push(call)
  return new Promise((resolve) => {
    gates.push({ ...call, resolve })
  })
}

window.__securityRefresh = {
  ready: true,
  calls: () => calls.map((call) => ({ ...call })),
  pending: () => gates.map(({ id, url, method, body }) => ({ id, url, method, body })),
  intervals: () => (window.__intervalMarks ?? []).map((mark) => mark.ms),
  release: (id, status, body) => {
    const index = gates.findIndex((gate) => gate.id === id)
    if (index < 0) throw new Error(`no pending synthetic request ${id}`)
    const [gate] = gates.splice(index, 1)
    gate.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    )
  },
}

createRoot(document.getElementById('root')!).render(<SecurityWidget />)
