import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TravelAnalytics from '@/components/admin/analytics/TravelAnalytics'
import PaymentsCenter from '@/components/admin/payments/PaymentsCenter'
import { analyticsRange, type TravelAnalyticsReport } from '@/lib/admin/analytics/report'

type Call = { url: string; signal: AbortSignal | null; resolve: (response: Response) => void; settled: boolean }
const calls: Call[] = []

declare global {
  interface Window {
    __adminCompletion: {
      documentId: string
      calls: () => { url: string; aborted: boolean; settled: boolean }[]
      respond: (index: number, status: number, body: unknown, stalledBody?: boolean) => void
    }
  }
}

// Deliberately do not auto-reject aborted fetches: a transport that delivers a
// late response must still be rejected by the actual component lifecycle.
window.fetch = (input, init) => new Promise<Response>((resolve) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  if (!new URL(url, window.location.origin).pathname.startsWith('/api/admin/payments/')) throw new Error('Unexpected fixture request')
  calls.push({ url, signal: init?.signal ?? null, resolve, settled: false })
})
window.__adminCompletion = {
  documentId: crypto.randomUUID(),
  calls: () => calls.map((call) => ({ url: call.url, aborted: call.signal?.aborted ?? false, settled: call.settled })),
  respond(index, status, body, stalledBody = false) {
    const call = calls[index]
    if (!call || call.settled) throw new Error('Invalid fixture response')
    call.settled = true
    call.resolve(new Response(stalledBody ? new ReadableStream() : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  },
}

const params = new URLSearchParams(window.location.search)
const selection = analyticsRange(params.has('tage') ? params.get('tage') : undefined)
const range = selection.range
const report: TravelAnalyticsReport = {
  observedAt: '2026-11-15T10:00:00.000Z', range,
  metrics: { kind: 'ready', data: { total: 120, last30Days: 45, accountsWithTrip30Days: 18 } },
  series: { kind: 'ready', data: Array.from({ length: range }, (_, index) => ({ date: new Date(Date.UTC(2026, 10, 16 - range + index)).toISOString().slice(0, 10), trips: index % 5 })) },
}
if (params.get('state') === 'unavailable') {
  report.metrics = { kind: 'unavailable' }
  report.series = { kind: 'unavailable' }
}
if (params.get('state') === 'partial') report.metrics = { kind: 'error', error: { meldung: 'Synthetischer Quellausfall', wiederholbar: true } }
if (params.get('state') === 'large' && report.metrics.kind === 'ready' && report.series.kind === 'ready') {
  report.metrics.data = { total: Number.MAX_SAFE_INTEGER, last30Days: Number.MAX_SAFE_INTEGER, accountsWithTrip30Days: 18 }
  report.series.data = report.series.data.map((row, index) => ({ ...row, trips: index === 0 ? Number.MAX_SAFE_INTEGER : 0 }))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="min-w-0 bg-background p-4 text-foreground">
      <p className="mb-3 text-xs text-muted-foreground">Synthetische Oberflächenprüfung · keine echte Sitzung</p>
      {window.location.pathname === '/admin/payments' ? <PaymentsCenter /> : <TravelAnalytics report={report} invalidRange={!selection.valid} />}
    </main>
  </StrictMode>,
)
