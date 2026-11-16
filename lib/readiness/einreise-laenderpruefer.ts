// Display session for /einreise.
// The existing visitor controller owns abort, request order and expiresAt.
// This file adds no source, method or transport.

import { landAnzeigeText } from '@/lib/country/darstellung'
import { einreiseAusBesucher, type EinreiseAnzeige, type EinreiseBesucherErgebnis } from '@/lib/readiness/einreise-kundenanzeige'
import { readChDeVisaInput } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'
import type { V3VisitorLoad, V3VisitorUiState } from '@/lib/readiness/official-truth-product-v3/visitor/controller'
import type { V3VisitorView } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'

const OFFEN = 'Für diese Kombination liegt keine freigegebene Auskunft vor.'

/** Only the released CH→DE input reaches the real loader. Every other selection stays unconfirmed and does not start a request. */
export function einreisePrueferLaden(chDe: V3VisitorLoad): V3VisitorLoad {
  return async (input, signal) => {
    if (readChDeVisaInput(input)) return chDe(input, signal)
    if (signal.aborted) return { daten: null, fehler: { meldung: 'Die Abfrage wurde abgebrochen.', wiederholbar: true } }
    const view: V3VisitorView = {
      input,
      generatedAt: '1970-01-01T00:00:00.000Z',
      synthetic: false,
      cells: input.citizenshipCountryCodes.map((country) => ({
        country,
        label: landAnzeigeText(country),
        results: [{ status: 'unavailable', title: 'Derzeit nicht verfügbar', message: OFFEN }],
      })),
    }
    return { daten: view, fehler: null }
  }
}

function ergebnisLesen(result: V3VisitorView['cells'][number]['results'][number]): EinreiseBesucherErgebnis {
  if (result.status !== 'accepted') return { status: result.status }
  return {
    status: result.status,
    informationTopic: result.informationTopic,
    statements: result.statements,
    source: result.source,
    checkedAtText: result.checkedAtText,
  }
}

/** The visible country is the answered input, never the form field that may already have moved. */
export function einreisePrueferSicht(state: V3VisitorUiState): {
  zielCode: string
  zielLabel: string
  anzeige: EinreiseAnzeige
  synthetisch: boolean
  hinweis: string
} | null {
  if (state.phase !== 'ready') return null
  const input = state.view.input
  const zellen = input.citizenshipCountryCodes.map((pass) => {
    const zelle = state.view.cells.find((eintrag) => eintrag.country === pass)
    return {
      landCode: pass,
      landLabel: landAnzeigeText(pass),
      ergebnisse: zelle ? zelle.results.map(ergebnisLesen) : [],
    }
  })
  return {
    zielCode: input.destinationCountryCode,
    zielLabel: landAnzeigeText(input.destinationCountryCode),
    anzeige: einreiseAusBesucher({ zielCode: input.destinationCountryCode, zielLabel: landAnzeigeText(input.destinationCountryCode), zellen }),
    synthetisch: state.view.synthetic === true,
    hinweis: state.message ?? '',
  }
}
