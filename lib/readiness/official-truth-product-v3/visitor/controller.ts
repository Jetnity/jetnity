import type { Ladung } from '@/lib/admin/ladezustand'
import type { V3VisitorInput } from '../contract'
import type { V3VisitorView } from './presentation'

export type V3VisitorLoad = (input: V3VisitorInput, signal: AbortSignal) => Promise<Ladung<V3VisitorView>>
export type V3VisitorUiState =
  | { phase: 'idle' | 'loading'; view: null; message: null }
  | { phase: 'ready'; view: V3VisitorView; message: null }
  | { phase: 'error'; view: null; message: string }

function key(input: V3VisitorInput): string {
  return `${input.destinationCountryCode}|${[...input.citizenshipCountryCodes].sort().join(',')}`
}

/** Local UI request order only; no persistent visitor identity or network here. */
export function createV3VisitorController(load: V3VisitorLoad, changed: (state: V3VisitorUiState) => void) {
  let generation = 0
  let current: AbortController | null = null
  let timeout: ReturnType<typeof setTimeout> | null = null
  const cancel = () => {
    generation += 1
    current?.abort()
    current = null
    if (timeout !== null) clearTimeout(timeout)
    timeout = null
  }
  return {
    invalidate() { cancel(); changed({ phase: 'idle', view: null, message: null }) },
    // Safe for unmount and React's development effect replay: no state emission.
    dispose() { cancel() },
    async submit(input: V3VisitorInput): Promise<void> {
      cancel()
      const ownGeneration = generation
      const request = new AbortController()
      current = request
      const countries = [...input.citizenshipCountryCodes]
      Object.freeze(countries)
      const snapshot: V3VisitorInput = Object.freeze({ destinationCountryCode: input.destinationCountryCode,
        citizenshipCountryCodes: countries })
      changed({ phase: 'loading', view: null, message: null })
      timeout = setTimeout(() => {
        if (generation !== ownGeneration) return
        cancel()
        changed({ phase: 'error', view: null, message: 'Die Abfrage dauert zu lange. Bitte erneut versuchen.' })
      }, 10_000)
      try {
        const result = await load(snapshot, request.signal)
        if (generation !== ownGeneration || request.signal.aborted) return
        if (timeout !== null) clearTimeout(timeout)
        timeout = null
        current = null
        if (result.fehler !== null || result.daten === null) {
          changed({ phase: 'error', view: null, message: 'Die Auskunft konnte nicht geladen werden. Bitte erneut versuchen.' })
          return
        }
        if (key(result.daten.input) !== key(snapshot)) {
          changed({ phase: 'error', view: null, message: 'Die Antwort passt nicht zur aktuellen Auswahl. Bitte erneut versuchen.' })
          return
        }
        changed({ phase: 'ready', view: result.daten, message: null })
      } catch {
        if (generation !== ownGeneration || request.signal.aborted) return
        if (timeout !== null) clearTimeout(timeout)
        timeout = null
        current = null
        // Deliberately do not display raw error/response messages.
        changed({ phase: 'error', view: null, message: 'Die Auskunft konnte nicht geladen werden. Bitte erneut versuchen.' })
      }
    },
  }
}

/** Honest default for an unbound client transport; no fake pending state. */
export const unboundV3VisitorLoad: V3VisitorLoad = async (input) => ({ daten: {
  input, synthetic: false, cells: input.citizenshipCountryCodes.map((country) => ({
    country, label: country, results: [{ status: 'unavailable', title: 'Derzeit nicht verfügbar',
      message: 'Für diese Kombination ist aktuell keine verlässliche Auskunft verfügbar.' }],
  })),
}, fehler: null })
