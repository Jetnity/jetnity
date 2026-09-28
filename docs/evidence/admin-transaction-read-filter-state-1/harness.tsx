import * as React from 'react'
import { createRoot } from 'react-dom/client'

import PaymentsCenter from '@/components/admin/payments/PaymentsCenter'

type Held = {
  url: string
  resolve: (response: Response) => void
}

type Call = { method: string; url: string }

const listCalls: string[] = []
const allCalls: Call[] = []
const held: Held[] = []

function notify() {
  window.dispatchEvent(new Event('tx-filter-log'))
}

function installFetch() {
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const url = new URL(raw, window.location.origin)
    const method = (init?.method ?? 'GET').toUpperCase()
    const recorded = `${url.pathname}${url.search}`
    allCalls.push({ method, url: recorded })
    notify()
    if (url.pathname !== '/api/admin/payments/list') {
      return new Promise(() => {})
    }
    listCalls.push(recorded)
    return new Promise((resolve) => {
      held.push({ url: recorded, resolve })
    })
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function resolveHeld(index: number, status: number, body: unknown) {
  const item = held[index]
  if (!item) throw new Error('no pending synthetic list response')
  held.splice(index, 1)
  item.resolve(jsonResponse(status, body))
  notify()
}

installFetch()

function HarnessLog() {
  const [, setVersion] = React.useState(0)
  React.useEffect(() => {
    const onLog = () => setVersion((value) => value + 1)
    window.addEventListener('tx-filter-log', onLog)
    return () => window.removeEventListener('tx-filter-log', onLog)
  }, [])

  return (
    <pre data-harness-log="true">
      {listCalls.length === 0 ? 'no list request yet' : listCalls.join('\n')}
    </pre>
  )
}

function HarnessApp() {
  React.useEffect(() => {
    const api = {
      ready: true,
      listCalls: () => listCalls.slice(),
      allCalls: () => allCalls.map((call) => ({ ...call })),
      pending: () => held.map((item) => item.url),
      resolveNext: (status: number, body: unknown) => resolveHeld(0, status, body),
      resolveMatching: (part: string, status: number, body: unknown) => {
        const index = held.findIndex((item) => item.url.includes(part))
        if (index < 0) throw new Error(`no pending list request matching ${part}`)
        resolveHeld(index, status, body)
      },
    }
    ;(window as unknown as { __txFilter?: typeof api }).__txFilter = api
    notify()
    return () => {
      delete (window as unknown as { __txFilter?: typeof api }).__txFilter
    }
  }, [])

  return (
    <main className="p-6">
      <p className="mb-4 text-sm text-muted-foreground">Synthetische Zahlungszeilen · kein echter Vorgang</p>
      <PaymentsCenter />
      <section className="mt-6 rounded-xl border p-3">
        <h2 className="text-xs font-semibold">HARNESS LOG</h2>
        <HarnessLog />
      </section>
    </main>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing harness root')
createRoot(root).render(<HarnessApp />)
