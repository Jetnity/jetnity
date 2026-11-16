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
    __securityAuditControlledPolls?: boolean
    __securityAudit?: {
      ready: boolean
      calls: () => Call[]
      pending: () => Call[]
      intervals: () => number[]
      release: (id: number, status: number, body: unknown) => void
      releaseHeaders: (id: number, status: number, cancelMode?: 'resolve' | 'reject' | 'stall') => void
      finishBody: (id: number, body: unknown) => void
      bodyReads: () => Array<{ id: number; jsonReads: number; cancelled: boolean }>
      poll: () => void
      fail: (id: number) => void
      unmount: () => void
    }
  }
}

const calls: Call[] = []
const gates: Gate[] = []
const bodies = new Map<number, { jsonReads: number; cancelled: boolean; finish: (body: unknown) => void }>()
let nextId = 0
let root: Root | null = null
const originalFetch = window.fetch.bind(window)
const controlledPolls = new Map<number, () => void>()

// Opt-in only for response-order tests. The legacy verify.mjs keeps its real
// interval/clock path; normal rAF, timeouts and other intervals are untouched.
if (window.__securityAuditControlledPolls) {
  const nativeSetInterval = window.setInterval.bind(window)
  const nativeClearInterval = window.clearInterval.bind(window)
  let nextIntervalId = -1
  window.setInterval = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
    if (delay !== 15_000 || typeof handler !== 'function') return nativeSetInterval(handler, delay, ...args)
    const id = nextIntervalId--
    controlledPolls.set(id, () => handler(...args))
    return id
  }) as typeof window.setInterval
  window.clearInterval = ((id?: number) => {
    if (id !== undefined && controlledPolls.delete(id)) return
    nativeClearInterval(id)
  }) as typeof window.clearInterval
}

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
  releaseHeaders: (id, status, cancelMode = 'resolve') => {
    const receipt: { jsonReads: number; cancelled: boolean; finish: (body: unknown) => void } = { jsonReads: 0, cancelled: false, finish: () => {} }
    const body = new Promise<unknown>((resolve) => { receipt.finish = resolve })
    bodies.set(id, receipt)
    // This controlled transport intentionally ignores cancellation when the
    // delayed body is released: stale-result safety must use request identity.
    gateAt(id).resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => { receipt.jsonReads++; return body },
      body: {
        cancel: () => {
          receipt.cancelled = true
          if (cancelMode === 'reject') return Promise.reject(new Error('synthetic cancellation failure'))
          if (cancelMode === 'stall') return new Promise<void>(() => {})
          return Promise.resolve()
        },
      },
    } as unknown as Response)
  },
  finishBody: (id, body) => {
    const receipt = bodies.get(id)
    if (!receipt) throw new Error(`no synthetic body ${id}`)
    receipt.finish(body)
  },
  bodyReads: () => [...bodies].map(([id, { jsonReads, cancelled }]) => ({ id, jsonReads, cancelled })),
  poll: () => { for (const poll of controlledPolls.values()) poll() },
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
