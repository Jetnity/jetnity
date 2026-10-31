// lib/providers/discovercars/widget/export.ts
//
// Exact general DiscoverCars account export. The HTML file beside this
// module is the byte source. This list is the allowlist those bytes must
// match. Execution is still refused: consent is not evidenced, and the
// later frame host is not a complete origin inventory.

export const WIDGET_EXPORT_DATEI = 'discovercars-widget-allgemein.html'

export const WIDGET_HERKUNFT_IM_EXPORT = 'www.discovercars.com'

/** Seen by Work after load. Not a full list of network or storage origins. */
export const WIDGET_HERKUNFT_SPAETER_BEOBACHTET = 'widget.discovercars.com'

export const WIDGET_HERKUNFT_INVENTAR_VOLLSTAENDIG = false

export const WIDGET_EXPORT_ATTRIBUTE = Object.freeze([
  Object.freeze({ name: 'id', wert: 'dchwidget' }),
  Object.freeze({ name: 'src', wert: 'https://www.discovercars.com/widget.js?v1' }),
  Object.freeze({ name: 'data-dev-env', wert: 'com' }),
  Object.freeze({ name: 'data-location', wert: '' }),
  Object.freeze({ name: 'data-lang', wert: 'de' }),
  Object.freeze({ name: 'data-currency', wert: 'chf' }),
  Object.freeze({ name: 'data-utm-source', wert: 'jetnity' }),
  Object.freeze({ name: 'data-utm-medium', wert: 'widget' }),
  Object.freeze({ name: 'data-aff-code', wert: 'a_aid' }),
  Object.freeze({ name: 'data-autocomplete', wert: 'on' }),
  Object.freeze({ name: 'data-style-submit-bg-color', wert: '#163d32' }),
  Object.freeze({ name: 'data-style-submit-font-color', wert: '#ffffff' }),
  Object.freeze({ name: 'data-style-form-bg-color', wert: '#f5f5ef' }),
  Object.freeze({ name: 'data-style-form-font-color', wert: '#173e33' }),
  Object.freeze({ name: 'data-style-submit-text', wert: 'Mietwagen suchen' }),
  Object.freeze({ name: 'data-style-title-color', wert: '#173e33' }),
  Object.freeze({ name: 'data-title-text', wert: 'Mietwagen suchen und vergleichen' }),
  Object.freeze({ name: 'async', wert: 'async' }),
  Object.freeze({ name: 'data-style_rounded_corners', wert: 'on' }),
  Object.freeze({ name: 'data-layout_benefits', wert: 'on' }),
  Object.freeze({ name: 'data-layout_description', wert: 'on' }),
  Object.freeze({ name: 'data-layout_description_text', wert: 'Wähle deinen Abholort und deine Mietdaten.' }),
  Object.freeze({ name: 'data-layout_logo_style', wert: 'on white' }),
  Object.freeze({ name: 'data-layout_powered_by', wert: 'on' }),
  Object.freeze({ name: 'data-layout_style_form_bg_color', wert: '#f5f5ef' }),
  Object.freeze({ name: 'data-layout_title', wert: 'on' }),
])

export type WidgetExportAttribut = { name: string; wert: string }

export type WidgetExportLesart =
  | { art: 'attribute'; attribute: WidgetExportAttribut[] }
  | { art: 'doppelt' }
  | { art: 'form' }

export type WidgetExportEntscheidung = {
  ok: false
  grund: 'export' | 'doppelt' | 'attribut' | 'einwilligung'
}

const ANFANG = '<div><script '
const ENDE = '></script></div>'

function nameZeichen(zeichen: string): boolean {
  return /[A-Za-z0-9_:-]/.test(zeichen)
}

export function widgetExportLesen(html: string): WidgetExportLesart {
  if (!html.startsWith(ANFANG) || !html.endsWith(ENDE)) return { art: 'form' }
  if (html.indexOf('<script') !== html.lastIndexOf('<script')) return { art: 'form' }
  if (html.includes('<iframe') || html.includes('<img')) return { art: 'form' }
  let index = ANFANG.length
  const attribute: WidgetExportAttribut[] = []
  const namen = new Set<string>()
  while (index < html.length && html[index] !== '>') {
    while (html[index] === ' ') index += 1
    if (html[index] === '>') break
    const nameStart = index
    while (index < html.length && nameZeichen(html[index] ?? '')) index += 1
    const name = html.slice(nameStart, index)
    if (name.length === 0 || html[index] !== '=' || html[index + 1] !== '"') return { art: 'form' }
    index += 2
    const wertStart = index
    while (index < html.length && html[index] !== '"') index += 1
    if (html[index] !== '"') return { art: 'form' }
    const wert = html.slice(wertStart, index)
    index += 1
    if (namen.has(name)) return { art: 'doppelt' }
    namen.add(name)
    attribute.push({ name, wert })
    if (html[index] !== ' ' && html[index] !== '>') return { art: 'form' }
  }
  if (html.slice(index) !== ENDE) return { art: 'form' }
  return { art: 'attribute', attribute }
}

function gleich(attribute: readonly WidgetExportAttribut[]): boolean {
  if (attribute.length !== WIDGET_EXPORT_ATTRIBUTE.length) return false
  return WIDGET_EXPORT_ATTRIBUTE.every((erwartet, index) => {
    const ist = attribute[index]
    return ist?.name === erwartet.name && ist.wert === erwartet.wert
  })
}

/** The bound document still does not execute. Consent and the host inventory block it. */
export function widgetExportAusfuehren(html: string): WidgetExportEntscheidung {
  const lesart = widgetExportLesen(html)
  if (lesart.art === 'form') return { ok: false, grund: 'export' }
  if (lesart.art === 'doppelt') return { ok: false, grund: 'doppelt' }
  if (!gleich(lesart.attribute)) return { ok: false, grund: 'attribut' }
  return { ok: false, grund: 'einwilligung' }
}
