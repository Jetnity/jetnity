// Real product component and styles; only the documented randomness and
// Clipboard transport ports are synthetic. This is not an Admin login proof.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MarketingLinks from '@/components/admin/marketing/MarketingLinks'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export type MarketingFixtureBoot = {
  sprache: UiSprache
  appearance: 'light' | 'dark'
  uuidMode: 'valid' | 'missing' | 'invalid' | 'throw'
  clipboardMode: 'controlled' | 'missing' | 'throw'
  documentId: string
}

type ClipboardCall = {
  text: string
  startedAt: number
  settled: boolean
  outcome: 'pending' | 'fulfilled' | 'rejected'
  resolve: () => void
  reject: (error: Error) => void
}

declare global {
  interface Window {
    __marketingFixtureBoot: MarketingFixtureBoot
    __recordMarketingViolation: (message: string) => Promise<void>
    __marketingBlockedOperations: string[]
    __marketingProof: {
      documentId: string
      diagnostics: () => { mounted: boolean; renderRequests: number; uuidCalls: number; clipboardCalls: number }
      uuidCalls: () => number
      calls: () => { text: string; startedAt: number; settled: boolean; outcome: ClipboardCall['outcome'] }[]
      settle: (index: number, outcome: 'fulfilled' | 'rejected') => void
      setUuidMode: (mode: MarketingFixtureBoot['uuidMode']) => void
      setClipboardMode: (mode: MarketingFixtureBoot['clipboardMode']) => void
      unmount: () => void
      remount: () => void
    }
  }
}

const boot = window.__marketingFixtureBoot
if (!boot || !['de', 'en'].includes(boot.sprache) || !boot.documentId) throw new Error('Missing synthetic Marketing boot')
if (typeof window.__recordMarketingViolation !== 'function' || !Array.isArray(window.__marketingBlockedOperations)) {
  throw new Error('Marketing isolation must be installed before the production bundle')
}
document.documentElement.classList.toggle('dark', boot.appearance === 'dark')
document.documentElement.lang = boot.sprache

// No UUID is generated for fixture identity or on mount. Node provides the
// document identifier; every call below is an actual product-port invocation.
const uuids = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
]
let uuidMode = boot.uuidMode
let clipboardMode = boot.clipboardMode
let uuidCalls = 0
let validUuidIndex = 0
let mounted = true
let renderRequests = 0
const calls: ClipboardCall[] = []

function uuidErzeugen(): unknown {
  uuidCalls += 1
  if (uuidMode === 'throw') throw new Error('Synthetic randomness failure')
  if (uuidMode === 'missing') return undefined
  if (uuidMode === 'invalid') return 'not-a-uuid@example.invalid'
  const uuid = uuids[validUuidIndex++]
  if (!uuid) throw new Error('Synthetic UUID sequence exhausted')
  return uuid
}

function clipboardSchreiben(text: string): Promise<void> {
  if (clipboardMode === 'throw') {
    calls.push({ text, startedAt: Date.now(), settled: true, outcome: 'rejected', resolve() {}, reject() {} })
    throw new Error('Synthetic synchronous Clipboard failure')
  }
  return new Promise<void>((resolve, reject) => {
    calls.push({ text, startedAt: Date.now(), settled: false, outcome: 'pending', resolve, reject })
  })
}

const container = document.getElementById('root')
if (!container) throw new Error('Missing Marketing fixture root')
const root = createRoot(container)
function render() {
  renderRequests += 1
  root.render(
    <StrictMode>
      <main className="min-w-0 bg-background text-foreground">
        {mounted ? <MarketingLinks sprache={boot.sprache} uuidErzeugen={uuidErzeugen}
          clipboardSchreiben={clipboardMode === 'missing' ? null : clipboardSchreiben} />
          : <p data-marketing-unmounted>Marketing component unmounted</p>}
      </main>
    </StrictMode>,
  )
}

window.__marketingProof = {
  documentId: boot.documentId,
  diagnostics: () => ({ mounted, renderRequests, uuidCalls, clipboardCalls: calls.length }),
  uuidCalls: () => uuidCalls,
  calls: () => calls.map(({ text, startedAt, settled, outcome }) => ({ text, startedAt, settled, outcome })),
  settle(index, outcome) {
    const call = calls[index]
    if (!call || call.settled) throw new Error('Invalid synthetic Clipboard settlement')
    call.settled = true
    call.outcome = outcome
    if (outcome === 'fulfilled') call.resolve()
    else call.reject(new Error('Synthetic rejected Clipboard write'))
  },
  setUuidMode(mode) { uuidMode = mode },
  setClipboardMode(mode) { clipboardMode = mode; render() },
  // Removing the actual component commits its cleanup. Re-adding it is a new
  // component lifetime in the same document and same production module graph.
  // The production document-local pending lock is never cleared by this fixture.
  unmount() { mounted = false; render() },
  remount() { mounted = true; render() },
}
render()
