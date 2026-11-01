import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'

const DISCOVERCARS_WIDGET_ORIGIN = 'https://widget.discovercars.com'
export const DISCOVERCARS_WIDGET_SANDBOX = 'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox'
export const DISCOVERCARS_DATENSCHUTZ = 'https://www.discovercars.com/de/privacy'

// Exact iframe contract emitted by the official generator/loader, verified
// 2026-11-02. No trip, station, dates, driver or attribution input is accepted.
// The iframe is on the provider origin: no provider script runs on Jetnity.
const PARAMETER = {
  currency: 'chf', pickup_from: '', pickup_to: '',
  utm_source: 'jetnity', utm_medium: 'widget', aff_code: 'a_aid',
  aff_value: '', aff_channel: '', aff_data1: '', aff_data2: '', tspc: '',
  autocomplete: 'on', style_form_bg_color: '#f5f5ef', style_form_font_color: '#173e33',
  style_submit_bg_color: '#163d32', style_submit_font_color: '#ffffff',
  submit_text: 'Angebote bei DiscoverCars öffnen', title_text: 'Mietwagen suchen und vergleichen',
  style_title_color: '#173e33', layout_benefits: '', layout_description: 'on',
  layout_description_text: 'Wähle deinen Abholort und deine Mietdaten.',
  layout_logo_style: 'on white', layout_powered_by: 'on', layout_style_form_bg_color: '#f5f5ef',
  layout_title: 'on', layout_top_logo: '', layout_supplier_logos: '', responsive: 'on',
  localization_currency_box: '',
} as const

/** Only the current document's public origin, never its path/query/hash. */
export function discoverCarsWidgetAdresse(origin: string): string | null {
  try {
    const parsed = new URL(origin)
    if (parsed.origin !== origin || parsed.username || parsed.password) return null
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname))) return null
    const query = new URLSearchParams({ ...PARAMETER, widget_origin: origin })
    return `${DISCOVERCARS_WIDGET_ORIGIN}/de/locations/?${query}`
  } catch { return null }
}

/** Observed official JSON-string message; accepts height only, never HTML/URL. */
export function discoverCarsWidgetHoehe(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, source: Window | null): number | null {
  if (!source || event.source !== source || event.origin !== DISCOVERCARS_WIDGET_ORIGIN) return null
  if (typeof event.data !== 'string' || event.data.length > 200) return null
  try {
    const data: unknown = JSON.parse(event.data)
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null
    const entry = data as Record<string, unknown>
    if (Object.keys(entry).sort().join(',') !== 'action,discovercars,height') return null
    if (entry.discovercars !== true || entry.action !== 'heightChange') return null
    if (typeof entry.height !== 'number' || !Number.isFinite(entry.height) || entry.height < 200 || entry.height > 2400) return null
    return Math.ceil(entry.height)
  } catch { return null }
}

/** A local display choice never overrides a refusal or an unusable existing CMP. */
export function discoverCarsDatenschutzErlaubt(api: unknown, cmpErforderlich: boolean): boolean {
  const read = readCmpApi(api)
  if (read.status === 'explicit') return read.optionalSatisfied
  return !cmpErforderlich && api === undefined && read.reason === 'missing_api'
}
