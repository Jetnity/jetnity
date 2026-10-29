// lib/providers/discovercars/widget/vertrag.ts
//
// Fail-closed gate for an official DiscoverCars search widget.
// The account export is not in this repository. Nothing here builds a
// vendor URL, script, frame or pixel. A click is not consent.

export const WIDGET_QUELLENSTATUS = 'VENDOR_EXPORT_MISSING' as const

export type WidgetQuellenstatus = typeof WIDGET_QUELLENSTATUS

/** Empty until a hashed official export names its hosts. */
export const WIDGET_HERKUNFT_ERLAUBT: readonly string[] = Object.freeze([])

/** Empty until that same export names its attributes. Fragments are not enough. */
export const WIDGET_ATTRIBUT_ERLAUBT: readonly string[] = Object.freeze([])

export const WIDGET_PRUEFNAHT = 'synthetisch-nicht-anbieter' as const

export const WIDGET_FIXTURE_TEXT =
  'Synthetische Jetnity-Prüfseite. Kein Anbieter, keine Preise, keine Verfügbarkeit.'

export type WidgetAblehnung =
  | 'quelle-fehlt'
  | 'herkunft'
  | 'attribut'
  | 'doppelt'
  | 'reise'
  | 'adresse'
  | 'einwilligung'

export type WidgetEntscheidung = { ok: false; grund: WidgetAblehnung }

const ERLAUBTE_FELDER = new Set(['adresse', 'attribute', 'einwilligung'])

const PRIVATE_FELDER = new Set([
  'age',
  'alter',
  'datum',
  'dates',
  'dob',
  'email',
  'geburtstag',
  'participants',
  'reise',
  'reiseid',
  'residence',
  'route',
  'teilnehmer',
  'trip',
  'tripid',
  'user',
  'userid',
  'wohnsitz',
])

export type WidgetAnsicht =
  | { art: 'ruhend' }
  | { art: 'bereit'; reiseId: string; lauf: number }
  | { art: 'laedt'; reiseId: string; lauf: number }
  | { art: 'fixture'; reiseId: string; lauf: number }
  | { art: 'fehler'; reiseId: string; lauf: number }

export type WidgetEreignis =
  | { art: 'setzen'; naht: boolean; reiseId: string }
  | { art: 'klick' }
  | { art: 'fertig'; lauf: number; reiseId: string }
  | { art: 'fehlschlag'; lauf: number; reiseId: string }
  | { art: 'erneut' }
  | { art: 'schliessen' }
  | { art: 'reise'; reiseId: string }

export function widgetQuelle(): {
  status: WidgetQuellenstatus
  sha256: null
  herkunft: readonly string[]
} {
  return {
    status: WIDGET_QUELLENSTATUS,
    sha256: null,
    herkunft: WIDGET_HERKUNFT_ERLAUBT,
  }
}

/** Real vendor execution stays off while the export and consent gate are missing. */
export function widgetDarfAusfuehren(): false {
  return false
}

export function widgetPruefnaht(marke: unknown): marke is typeof WIDGET_PRUEFNAHT {
  return marke === WIDGET_PRUEFNAHT
}

function istSatz(wert: unknown): wert is Record<string, unknown> {
  return (
    wert !== null &&
    typeof wert === 'object' &&
    !Array.isArray(wert) &&
    Object.getPrototypeOf(wert) === Object.prototype &&
    Object.getOwnPropertySymbols(wert).length === 0
  )
}

function enthaeltReise(reiseId: string | undefined, wert: unknown): boolean {
  if (!reiseId || typeof wert !== 'string') return false
  return wert.includes(reiseId)
}

export function widgetAusfuehren(
  anfrage: unknown = {},
  kontext: { reiseId?: string } = {},
): WidgetEntscheidung {
  if (anfrage === undefined) return { ok: false, grund: 'quelle-fehlt' }
  if (!istSatz(anfrage)) return { ok: false, grund: 'adresse' }

  const reiseId = typeof kontext.reiseId === 'string' && kontext.reiseId.length >= 4
    ? kontext.reiseId
    : undefined
  let reise = false
  let doppelt = false
  let attribut = false
  let herkunft = false
  let adresse = false
  let einwilligung = false

  for (const schluessel of Object.keys(anfrage)) {
    const klein = schluessel.toLowerCase()
    if (PRIVATE_FELDER.has(klein)) reise = true
    else if (!ERLAUBTE_FELDER.has(schluessel)) attribut = true
  }

  const rohAdresse = anfrage.adresse
  if (rohAdresse !== undefined) {
    if (typeof rohAdresse !== 'string') adresse = true
    else if (enthaeltReise(reiseId, rohAdresse)) reise = true
    else {
      let url: URL | null = null
      try {
        url = new URL(rohAdresse)
      } catch {
        adresse = true
      }
      if (url) {
        if (url.username !== '' || url.password !== '' || url.protocol !== 'https:') adresse = true
        else if (!WIDGET_HERKUNFT_ERLAUBT.includes(url.hostname)) herkunft = true
        const namen = [...url.searchParams.keys()]
        if (new Set(namen).size !== namen.length) doppelt = true
        for (const name of namen) {
          if (PRIVATE_FELDER.has(name.toLowerCase())) reise = true
        }
        for (const wert of url.searchParams.values()) {
          if (enthaeltReise(reiseId, wert)) reise = true
        }
      }
    }
  }

  const rohAttribute = anfrage.attribute
  if (rohAttribute !== undefined) {
    if (!Array.isArray(rohAttribute)) attribut = true
    else {
      const namen: string[] = []
      for (const eintrag of rohAttribute) {
        if (!istSatz(eintrag)) {
          attribut = true
          continue
        }
        const felder = Object.keys(eintrag)
        if (felder.length !== 2 || !felder.includes('name') || !felder.includes('wert')) attribut = true
        if (typeof eintrag.name !== 'string' || typeof eintrag.wert !== 'string') attribut = true
        if (typeof eintrag.name === 'string') {
          namen.push(eintrag.name)
          if (!WIDGET_ATTRIBUT_ERLAUBT.includes(eintrag.name)) attribut = true
          if (PRIVATE_FELDER.has(eintrag.name.toLowerCase())) reise = true
        }
        if (enthaeltReise(reiseId, eintrag.wert)) reise = true
      }
      if (new Set(namen).size !== namen.length) doppelt = true
    }
  }

  const rohEinwilligung = anfrage.einwilligung
  if (rohEinwilligung === true || rohEinwilligung === 'klick' || rohEinwilligung === 'click') {
    einwilligung = true
  } else if (rohEinwilligung !== undefined) {
    attribut = true
  }

  if (reise) return { ok: false, grund: 'reise' }
  if (doppelt) return { ok: false, grund: 'doppelt' }
  if (attribut) return { ok: false, grund: 'attribut' }
  if (herkunft) return { ok: false, grund: 'herkunft' }
  if (adresse) return { ok: false, grund: 'adresse' }
  if (einwilligung) return { ok: false, grund: 'einwilligung' }
  return { ok: false, grund: 'quelle-fehlt' }
}

export function widgetAnfang(naht: boolean, reiseId: string): WidgetAnsicht {
  if (!naht) return { art: 'ruhend' }
  return { art: 'bereit', reiseId, lauf: 0 }
}

function gleicheReise(ansicht: WidgetAnsicht, reiseId: string, lauf: number): ansicht is WidgetAnsicht & { reiseId: string; lauf: number } {
  return ansicht.art !== 'ruhend' && ansicht.reiseId === reiseId && ansicht.lauf === lauf
}

export function widgetAnsicht(vorher: WidgetAnsicht, ereignis: WidgetEreignis): WidgetAnsicht {
  if (ereignis.art === 'setzen') return widgetAnfang(ereignis.naht, ereignis.reiseId)
  if (ereignis.art === 'reise') {
    if (vorher.art === 'ruhend') return vorher
    return { art: 'bereit', reiseId: ereignis.reiseId, lauf: 0 }
  }
  if (ereignis.art === 'klick') {
    if (vorher.art !== 'bereit' && vorher.art !== 'fehler') return vorher
    return { art: 'laedt', reiseId: vorher.reiseId, lauf: vorher.lauf + 1 }
  }
  if (ereignis.art === 'erneut') {
    if (vorher.art !== 'fehler') return vorher
    return { art: 'laedt', reiseId: vorher.reiseId, lauf: vorher.lauf + 1 }
  }
  if (ereignis.art === 'fertig') {
    if (vorher.art !== 'laedt' || !gleicheReise(vorher, ereignis.reiseId, ereignis.lauf)) return vorher
    return { art: 'fixture', reiseId: vorher.reiseId, lauf: vorher.lauf }
  }
  if (ereignis.art === 'fehlschlag') {
    if (vorher.art !== 'laedt' || !gleicheReise(vorher, ereignis.reiseId, ereignis.lauf)) return vorher
    return { art: 'fehler', reiseId: vorher.reiseId, lauf: vorher.lauf }
  }
  if (ereignis.art !== 'schliessen' || vorher.art !== 'fixture') return vorher
  return { art: 'bereit', reiseId: vorher.reiseId, lauf: vorher.lauf }
}
