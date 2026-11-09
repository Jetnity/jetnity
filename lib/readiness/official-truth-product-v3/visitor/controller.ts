import type { Ladung } from '@/lib/admin/ladezustand'
import type { V3VisitorInput } from '../contract'
import type { V3VisitorView } from './presentation'

export type V3VisitorLoad = (input: V3VisitorInput, signal: AbortSignal) => Promise<Ladung<V3VisitorView>>
export type V3VisitorUiState =
  | { phase: 'idle' | 'loading'; view: null; message: null }
  | { phase: 'ready'; view: V3VisitorView; message: string | null;
      refresh: 'off' | 'waiting' | 'checking' | 'stopped'; focusResult: boolean }
  | { phase: 'error'; view: null; message: string; focusResult: boolean }

/** Monotonic elapsed time and cancellable timers; this does not grant authority. */
export interface V3VisitorTimers {
  now(): number
  after(milliseconds: number, callback: () => void): () => void
}
const browserTimers: V3VisitorTimers = {
  now: () => performance.now(),
  after: (milliseconds, callback) => { const timer = setTimeout(callback, milliseconds); return () => clearTimeout(timer) },
}
const POLL_DELAYS = [2_000, 4_000, 8_000, 16_000, 30_000, 45_000] as const
const POLL_WINDOW = 120_000
const WINDOW_ENDED = 'Die Recherche ist noch nicht abgeschlossen. Die automatische Aktualisierung ist beendet. Bitte rufe die Angaben später erneut ab.'

function key(input: V3VisitorInput): string {
  return `${input.destinationCountryCode}|${[...input.citizenshipCountryCodes].sort().join(',')}`
}

/** Local UI request order only; no persistent visitor identity or network here. */
export function createV3VisitorController(load: V3VisitorLoad, changed: (state: V3VisitorUiState) => void,
  timers: V3VisitorTimers = browserTimers) {
  let generation = 0
  let current: AbortController | null = null
  let cancelRequest: (() => void) | null = null
  let cancelPoll: (() => void) | null = null
  let cancelWindow: (() => void) | null = null
  let cancelFreshness: (() => void) | null = null
  let visible: Extract<V3VisitorUiState, { phase: 'ready' }> | null = null
  const cancel = () => {
    generation += 1
    current?.abort()
    current = null
    cancelRequest?.(); cancelPoll?.(); cancelWindow?.(); cancelFreshness?.()
    cancelRequest = cancelPoll = cancelWindow = cancelFreshness = null
    visible = null
  }
  return {
    invalidate() { cancel(); changed({ phase: 'idle', view: null, message: null }) },
    // Safe for unmount and React's development effect replay: no state emission.
    dispose() { cancel() },
    async submit(input: V3VisitorInput): Promise<void> {
      cancel()
      const ownGeneration = generation
      const countries = [...input.citizenshipCountryCodes]
      Object.freeze(countries)
      const snapshot: V3VisitorInput = Object.freeze({ destinationCountryCode: input.destinationCountryCode,
        citizenshipCountryCodes: countries })
      const startedAt = timers.now()
      let polls = 0, windowEnded = false
      changed({ phase: 'loading', view: null, message: null })

      const ready = (view: V3VisitorView, refresh: Extract<V3VisitorUiState, { phase: 'ready' }>['refresh'],
        message: string | null, focusResult = false) => {
        visible = { phase: 'ready', view, refresh, message, focusResult }
        changed(visible)
      }
      const stopPolling = () => {
        windowEnded = true
        cancelPoll?.(); cancelWindow?.()
        cancelPoll = cancelWindow = null
      }
      const endWindow = () => {
        if (generation !== ownGeneration) return
        stopPolling()
        current?.abort(); current = null; cancelRequest?.(); cancelRequest = null
        if (visible) ready(visible.view, 'stopped', WINDOW_ENDED)
      }
      const fail = (message: string, manual: boolean) => {
        if (generation !== ownGeneration) return
        cancel()
        changed({ phase: 'error', view: null, message, focusResult: manual })
      }
      const freshness = (view: V3VisitorView, readStartedAt: number) => {
        cancelFreshness?.(); cancelFreshness = null
        const elapsed = Math.max(0, timers.now() - readStartedAt)
        const generated = Date.parse(view.generatedAt)
        let nextExpiry = Infinity
        const next = { ...view, cells: view.cells.map((cell) => ({ ...cell, results: cell.results.map((result) => {
          if (result.status !== 'accepted') return result
          // Subtract the complete request duration, not only time after receipt.
          // A slow response never extends a server-issued projection deadline.
          const remaining = Date.parse(result.expiresAt) - generated - elapsed
          if (!Number.isFinite(remaining) || remaining <= 0) return { status: 'unavailable' as const,
            title: 'Quellenstand wird nicht mehr angezeigt', message: 'Die Gültigkeit dieser vorbereiteten Auskunft ist abgelaufen. Bitte erneut abrufen.' }
          nextExpiry = Math.min(nextExpiry, remaining)
          return result
        }) })) }
        if (Number.isFinite(nextExpiry)) cancelFreshness = timers.after(Math.min(nextExpiry, 2_147_483_647), () => {
          if (generation !== ownGeneration || !visible) return
          const nextView = freshness(visible.view, readStartedAt)
          const expired = nextView.cells.some((cell) => cell.results.some((result) => result.status === 'unavailable'))
          if (expired) stopPolling()
          ready(nextView, expired ? 'off' : visible.refresh, expired ? 'Der bisherige Quellenstand ist abgelaufen. Bitte erneut abrufen.' : visible.message)
        })
        return next
      }
      const withoutPreviousPositives = (view: V3VisitorView): V3VisitorView => ({ ...view,
        cells: view.cells.map((cell) => ({ ...cell, results: cell.results.map((result) => result.status === 'accepted'
          ? { status: 'unavailable', title: 'Angaben werden aktualisiert', message: 'Der aktuelle amtliche Stand wird erneut abgerufen.' }
          : result) })) })
      const run = async (manual: boolean): Promise<void> => {
        if (generation !== ownGeneration || (!manual && windowEnded)) return
        if (!manual && (polls >= POLL_DELAYS.length || timers.now() - startedAt >= POLL_WINDOW)) { endWindow(); return }
        if (current !== null) return // A pending transport never starts a second request.
        if (!manual) {
          polls += 1
          cancelFreshness?.(); cancelFreshness = null
          if (visible) ready(withoutPreviousPositives(visible.view), 'checking', 'Die Angaben werden im Hintergrund aktualisiert.')
        }
        const request = new AbortController()
        current = request
        const readStartedAt = timers.now()
        const stopRequestTimer = timers.after(10_000, () => fail('Die Abfrage dauert zu lange. Bitte erneut versuchen.', manual))
        cancelRequest = stopRequestTimer
        let rejectAborted: (() => void) | undefined
        const aborted = new Promise<never>((_, reject) => {
          rejectAborted = () => reject(new Error('cancelled'))
          request.signal.addEventListener('abort', rejectAborted, { once: true })
        })
        try {
          const result = await Promise.race([load(snapshot, request.signal), aborted])
          if (generation !== ownGeneration || request.signal.aborted) return
          stopRequestTimer(); cancelRequest = null; current = null
          if (result.fehler !== null || result.daten === null) {
            fail('Die Auskunft konnte nicht geladen werden. Bitte erneut versuchen.', manual); return
          }
          if (key(result.daten.input) !== key(snapshot)) {
            fail('Die Antwort passt nicht zur aktuellen Auswahl. Bitte erneut versuchen.', manual); return
          }
          const view = freshness(result.daten, readStartedAt)
          const results = view.cells.flatMap((cell) => cell.results)
          const hasPending = results.some((result) => result.status === 'pending')
          const terminal = results.some((result) => result.status !== 'accepted' && result.status !== 'pending')
          if (!hasPending || terminal) {
            stopPolling()
            ready(view, 'off', hasPending ? 'Die automatische Aktualisierung ist angehalten. Bitte beachte die Hinweise und frage später erneut ab.' : null, manual)
          } else if (polls >= POLL_DELAYS.length || timers.now() - startedAt >= POLL_WINDOW) {
            ready(view, 'stopped', WINDOW_ENDED, manual); stopPolling()
          } else {
            ready(view, 'waiting', 'Die Recherche läuft. Ergebnisse werden automatisch aktualisiert.', manual)
            cancelPoll = timers.after(POLL_DELAYS[polls], () => { cancelPoll = null; void run(false) })
          }
        } catch {
          if (generation !== ownGeneration || request.signal.aborted) return
          fail('Die Auskunft konnte nicht geladen werden. Bitte erneut versuchen.', manual)
        } finally {
          stopRequestTimer()
          if (rejectAborted) request.signal.removeEventListener('abort', rejectAborted)
          if (current === request) { current = null; cancelRequest = null }
        }
      }
      cancelWindow = timers.after(POLL_WINDOW, endWindow)
      await run(true)
    },
  }
}

/** Honest default for an unbound client transport; no fake pending state. */
export const unboundV3VisitorLoad: V3VisitorLoad = async (input) => ({ daten: {
  input, generatedAt: new Date().toISOString(), synthetic: false, cells: input.citizenshipCountryCodes.map((country) => ({
    country, label: country, results: [{ status: 'unavailable', title: 'Derzeit nicht verfügbar',
      message: 'Für diese Kombination ist aktuell keine verlässliche Auskunft verfügbar.' }],
  })),
}, fehler: null })
