// Mounted production UI. Every identity, action, export and persisted value in
// this entry is an explicit fixture; no hosted session or Auth client is used.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import EinstellungenInhalt from '@/components/account/ui-einstellungen-1/EinstellungenInhalt'
import Sprachkatalog from '@/components/admin/localization/Sprachkatalog'
import type { KontoBeobachter } from '@/components/account/ui-einstellungen-1/konto-beobachter'
import type {
  UiEinstellungenLesen,
  UiEinstellungenSpeichernEingabe,
  UiEinstellungenSpeichernErgebnis,
} from '@/lib/account/ui-einstellungen-1/vertrag'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export type LanguageFixtureBoot = {
  initial: UiEinstellungenLesen
  surface: 'konto' | 'admin' | 'catalog'
  catalogLanguage: UiSprache
  deletionOffered: boolean
  appearance: 'light' | 'dark'
}

type ActionCall = {
  kind: 'save' | 'read'
  input: unknown
  startedAt: number
  settled: boolean
  committed: boolean
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}
type ExportCall = {
  url: string
  method: string
  signal: AbortSignal | null
  settled: boolean
  resolve: (response: Response) => void
}
type Observer = { userId: string; active: boolean; callback: () => void }

declare global {
  interface Window {
    __languageFixtureBoot: LanguageFixtureBoot
    // Playwright bindings reach only the isolated in-memory fixture store.
    // They do not emulate or prove server authorization or real persistence.
    __commitLanguageFixture: (input: UiEinstellungenSpeichernEingabe) => Promise<void>
    __readLanguageFixture: () => Promise<UiEinstellungenLesen>
    __recordSettingsRequestViolation: (message: string) => Promise<void>
    __settingsCompletion: {
      documentId: string
      diagnostics: () => { surface: LanguageFixtureBoot['surface']; initialStatus: UiEinstellungenLesen['status']; renderRequests: number; mounted: boolean }
      calls: () => { kind: 'save' | 'read'; input: unknown; startedAt: number; settled: boolean; committed: boolean }[]
      reply: (index: number, body: unknown) => void
      reject: (index: number) => void
      commitSave: (index: number) => Promise<void>
      replyFromStore: (index: number) => Promise<void>
      observers: () => { userId: string; active: boolean }[]
      notifyAccountChanged: (userId: string) => void
      deliverOldObserver: (index: number) => void
      replaceAccount: (initial: UiEinstellungenLesen) => void
      unmount: () => void
      exports: () => { url: string; method: string; aborted: boolean; settled: boolean }[]
      replyExport: (index: number, status: number, body: unknown) => void
      unexpectedRequests: () => string[]
    }
  }
}

const boot = window.__languageFixtureBoot
if (!boot || !['konto', 'admin', 'catalog'].includes(boot.surface)) throw new Error('Missing or invalid synthetic settings boot')
for (const port of ['__commitLanguageFixture', '__readLanguageFixture', '__recordSettingsRequestViolation'] as const) {
  if (typeof window[port] !== 'function') throw new Error(`Missing synthetic settings port: ${port}`)
}
// Use the real Admin theme selector and tokens from globals.css. The fixture
// supplies no replacement colors, contrast fixes or component styles.
document.documentElement.classList.toggle('dark', boot.appearance === 'dark')
const actionCalls: ActionCall[] = []
const exportCalls: ExportCall[] = []
const observers: Observer[] = []
const unexpectedRequests: string[] = []
let initial = boot.initial
let mounted = true
let renderRequests = 0

function action(kind: ActionCall['kind'], input: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    actionCalls.push({ kind, input: structuredClone(input), startedAt: Date.now(), settled: false, committed: false, resolve, reject })
  })
}

// Malformed replies intentionally cross this synthetic transport boundary so
// the real component, rather than a fixture validator, must reject them.
const speichern = (input: unknown) => action('save', input) as Promise<UiEinstellungenSpeichernErgebnis>
const neuLaden = () => action('read', null) as Promise<UiEinstellungenLesen>
const beobachten: KontoBeobachter = (userId, callback) => {
  const observer: Observer = { userId, callback, active: true }
  observers.push(observer)
  return () => { observer.active = false }
}

// Deliberately allow a late export reply after AbortSignal. The production
// component must discard it; a cooperative fixture must not hide a race.
window.fetch = (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(raw, window.location.origin)
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (url.origin !== window.location.origin || url.pathname !== '/api/account/export' || method !== 'GET' || url.search) {
    const violation = `${method} ${url.origin}${url.pathname}`
    unexpectedRequests.push(violation)
    // This binding records in Node before rejecting; a subsequent document
    // reload cannot erase an attempted unexpected request from the evidence.
    return window.__recordSettingsRequestViolation(violation).then(() => {
      throw new Error('Unexpected request in synthetic settings proof')
    })
  }
  return new Promise<Response>((resolve) => {
    exportCalls.push({ url: url.pathname, method, signal: init?.signal ?? null, settled: false, resolve })
  })
}

function pendingAction(index: number): ActionCall {
  const call = actionCalls[index]
  if (!call || call.settled) throw new Error('Invalid synthetic action reply')
  return call
}

const container = document.getElementById('root')
if (!container) throw new Error('Missing synthetic settings root element')
const root = createRoot(container)
function render() {
  renderRequests += 1
  root.render(
    <StrictMode>
      <main className="min-w-0 bg-background text-foreground">
        <p className="px-4 py-2 text-xs text-muted-foreground">Synthetic settings proof · no real account or session</p>
        {!mounted ? <p>Settings fixture unmounted</p>
          : boot.surface === 'catalog' ? <Sprachkatalog sprache={boot.catalogLanguage} />
            : <EinstellungenInhalt initial={initial} bereich={boot.surface} loeschungAngeboten={boot.deletionOffered}
              speichern={speichern} neuLaden={neuLaden} beobachten={beobachten} />}
      </main>
    </StrictMode>,
  )
}

window.__settingsCompletion = {
  documentId: crypto.randomUUID(),
  diagnostics: () => ({ surface: boot.surface, initialStatus: initial.status, renderRequests, mounted }),
  calls: () => actionCalls.map(({ kind, input, startedAt, settled, committed }) => ({ kind, input, startedAt, settled, committed })),
  reply(index, body) {
    const call = pendingAction(index)
    call.settled = true
    call.resolve(body)
  },
  reject(index) {
    const call = pendingAction(index)
    call.settled = true
    call.reject(new Error('Synthetic action transport failure'))
  },
  async commitSave(index) {
    const call = actionCalls[index]
    if (!call || call.kind !== 'save' || call.committed) throw new Error('Invalid synthetic store commit')
    // A write may finish after the UI deadline or unmount. Committing and
    // replying are separate controls expressly to test this uncertainty.
    await window.__commitLanguageFixture(call.input as UiEinstellungenSpeichernEingabe)
    call.committed = true
  },
  async replyFromStore(index) {
    const call = pendingAction(index)
    if (call.kind !== 'read') throw new Error('Expected a synthetic read')
    const result = await window.__readLanguageFixture()
    call.settled = true
    call.resolve(result)
  },
  observers: () => observers.map(({ userId, active }) => ({ userId, active })),
  notifyAccountChanged(userId) {
    for (const observer of observers) if (observer.active && observer.userId === userId) observer.callback()
  },
  deliverOldObserver(index) {
    const observer = observers[index]
    if (!observer || observer.active) throw new Error('Expected a disposed observer')
    observer.callback()
  },
  replaceAccount(replacement) { initial = replacement; render() },
  unmount() { mounted = false; render() },
  exports: () => exportCalls.map((call) => ({ url: call.url, method: call.method, aborted: call.signal?.aborted ?? false, settled: call.settled })),
  replyExport(index, status, body) {
    const call = exportCalls[index]
    if (!call || call.settled) throw new Error('Invalid synthetic export reply')
    call.settled = true
    call.resolve(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  },
  unexpectedRequests: () => [...unexpectedRequests],
}
render()
