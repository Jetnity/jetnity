import { createRoot, type Root } from 'react-dom/client'

import SecurityWidget from '@/components/admin/security/SecurityWidget'

type Call = {
  id: number
  url: string
  method: string
  body: string | null
}

type Gate = Call & {
  resolve: (response: Response) => void
  reject: (error: Error) => void
}

declare global {
  interface Window {
    __intervalMarks?: Array<{ ms: number }>
    __securityAudit?: {
      ready: boolean
      calls: () => Call[]
      pending: () => Call[]
      intervals: () => number[]
      release: (id: number, status: number, body: unknown) => void
      fail: (id: number) => void
      unmount: () => void
    }
  }
}

const calls: Call[] = []
const gates: Gate[] = []
let nextId = 0
let root: Root | null = null
const originalFetch = window.fetch.bind(window)

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = requestUrl(input)
  if (!url.includes('/api/admin/security/')) return originalFetch(input, init)
  const id = ++nextId
  const call: Call = {
    id,
    url,
    method: (init?.method ?? 'GET').toUpperCase(),
    body: typeof init?.body === 'string' ? init.body : null,
  }
  calls.push(call)
  return new Promise((resolve, reject) => {
    gates.push({ ...call, resolve, reject })
  })
}

function gateAt(id: number): Gate {
  const index = gates.findIndex((gate) => gate.id === id)
  if (index < 0) throw new Error(`no pending synthetic request ${id}`)
  const [gate] = gates.splice(index, 1)
  return gate
}

window.__securityAudit = {
  ready: true,
  calls: () => calls.map((call) => ({ ...call })),
  pending: () => gates.map(({ id, url, method, body }) => ({ id, url, method, body })),
  intervals: () => (window.__intervalMarks ?? []).map((mark) => mark.ms),
  release: (id, status, body) => {
    gateAt(id).resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    )
  },
  fail: (id) => {
    gateAt(id).reject(new TypeError('Failed to fetch'))
  },
  unmount: () => {
    root?.unmount()
    root = null
  },
}

root = createRoot(document.getElementById('root')!)
root.render(<SecurityWidget />)
