// Synthetische Gegenprobe. Ein Abbruch wird nur vermerkt.
// Die Promise bleibt offen, bis der Lauf sie ausdrücklich zustellt.

import type { Ort } from '@/lib/places/domain'
import type { GygLadeErgebnis, GygRenderer } from '@/lib/activities/getyourguide/widget'
import type { GygSuchkonfiguration } from '@/lib/activities/getyourguide/suche'

export type OrtQuelle = 'signal' | 'aktion'
export type OrtArt = 'katalog' | 'fremd' | 'leer'

export type OrtZeile = {
  operation: number
  id: string
  quelle: OrtQuelle
  aborted: boolean
  settled: boolean
  zugestellt: boolean
}

export type RendererZeile = {
  operation: number
  label: string
  aborted: boolean
  settled: boolean
  zugestellt: boolean
  verbunden: boolean | null
}

type OrtEintrag = OrtZeile & {
  resolve: (ort: Ort | null) => void
  reject: (grund: Error) => void
}

type RendererEintrag = RendererZeile & {
  ziel: HTMLElement
  host: HTMLElement | null
  resolve: (ergebnis: GygLadeErgebnis) => void
  reject: (grund: Error) => void
}

export type SyntheseStand = {
  orte: OrtZeile[]
  renderer: RendererZeile[]
  entsorgen: { operation: number; verbunden: boolean }[]
  uebernahmen: number
  warten: boolean
  sofortFehler: boolean
}

function ort(id: string, name: string, typ: Ort['typ'], countryCode: string, country: string, region: string | null): Ort {
  return {
    id,
    source: 'geonames',
    sourceId: id.split(':')[1] ?? id,
    name,
    typ,
    country,
    countryCode,
    region,
    lat: null,
    lon: null,
    iata: null,
    keywords: null,
  }
}

const katalog = [
  ort('geonames:2267057', 'Lissabon', 'city', 'PT', 'Portugal', '11'),
  ort('geonames:2593313', 'Kreta', 'island', 'GR', 'Griechenland', 'A1'),
  ort('geonames:2264397', 'Portugal', 'country', 'PT', 'Portugal', null),
]

function katalogOrt(id: string): Ort | null {
  return katalog.find((eintrag) => eintrag.id === id) ?? null
}

function zeileOrt(eintrag: OrtEintrag): OrtZeile {
  return {
    operation: eintrag.operation,
    id: eintrag.id,
    quelle: eintrag.quelle,
    aborted: eintrag.aborted,
    settled: eintrag.settled,
    zugestellt: eintrag.zugestellt,
  }
}

function zeileRenderer(eintrag: RendererEintrag): RendererZeile {
  return {
    operation: eintrag.operation,
    label: eintrag.label,
    aborted: eintrag.aborted,
    settled: eintrag.settled,
    zugestellt: eintrag.zugestellt,
    verbunden: eintrag.verbunden,
  }
}

type Bruecke = {
  ortOeffnen: (id: string, signal: AbortSignal | null, quelle: OrtQuelle) => Promise<Ort | null>
  ortAufloesen: (operation: number, art: OrtArt) => boolean
  ortAblehnen: (operation: number) => boolean
  rendererFreigeben: (operation: number, ok: boolean) => boolean
  rendererAblehnen: (operation: number) => boolean
  verbunden: (operation: number) => boolean | null
  imDokument: (operation: number) => boolean
  uebernahme: () => number
  wartenSetzen: (wert: boolean) => void
  fehlerSetzen: (wert: boolean) => void
  stand: () => SyntheseStand
  renderer: GygRenderer
}

function erzeugen(): Bruecke {
  let ortNummer = 0
  let rendererNummer = 0
  let uebernahmen = 0
  let warten = false
  let sofortFehler = false
  const orte: OrtEintrag[] = []
  const renderer: RendererEintrag[] = []
  const entsorgen: { operation: number; verbunden: boolean }[] = []
  const nachZiel = new Map<HTMLElement, RendererEintrag>()

  const stand = (): SyntheseStand => ({
    orte: orte.map(zeileOrt),
    renderer: renderer.map(zeileRenderer),
    entsorgen: entsorgen.map((eintrag) => ({ ...eintrag })),
    uebernahmen,
    warten,
    sofortFehler,
  })

  const bruecke: Bruecke = {
    ortOeffnen(id, signal, quelle) {
      const operation = ++ortNummer
      return new Promise((resolve, reject) => {
        const eintrag: OrtEintrag = {
          operation,
          id,
          quelle,
          aborted: signal?.aborted === true,
          settled: false,
          zugestellt: false,
          resolve,
          reject,
        }
        orte.push(eintrag)
        if (signal) {
          const merken = () => {
            eintrag.aborted = true
          }
          if (signal.aborted) merken()
          else signal.addEventListener('abort', merken, { once: true })
        }
      })
    },
    ortAufloesen(operation, art) {
      const eintrag = orte.find((kandidat) => kandidat.operation === operation && !kandidat.settled)
      if (!eintrag) return false
      const gefunden = katalogOrt(eintrag.id)
      const wert =
        art === 'leer'
          ? null
          : art === 'fremd'
            ? gefunden
              ? { ...gefunden, id: 'geonames:1', sourceId: '1' }
              : null
            : gefunden
      eintrag.settled = true
      eintrag.zugestellt = true
      eintrag.resolve(wert)
      return true
    },
    ortAblehnen(operation) {
      const eintrag = orte.find((kandidat) => kandidat.operation === operation && !kandidat.settled)
      if (!eintrag) return false
      eintrag.settled = true
      eintrag.zugestellt = true
      eintrag.reject(new Error('synthetisch'))
      return true
    },
    rendererFreigeben(operation, ok) {
      const eintrag = renderer.find((kandidat) => kandidat.operation === operation && !kandidat.settled)
      if (!eintrag) return false
      const zeile = document.createElement('p')
      zeile.dataset.gygSpaet = String(operation)
      zeile.textContent = ok ? `spaet-ok-${operation}` : `spaet-nein-${operation}`
      eintrag.ziel.append(zeile)
      eintrag.verbunden = eintrag.ziel.isConnected
      eintrag.settled = true
      eintrag.zugestellt = true
      eintrag.resolve(ok ? { art: 'ressource' } : { art: 'abgelehnt', meldung: '' })
      return true
    },
    rendererAblehnen(operation) {
      const eintrag = renderer.find((kandidat) => kandidat.operation === operation && !kandidat.settled)
      if (!eintrag) return false
      eintrag.verbunden = eintrag.ziel.isConnected
      eintrag.settled = true
      eintrag.zugestellt = true
      eintrag.reject(new Error('synthetisch'))
      return true
    },
    verbunden(operation) {
      return renderer.find((eintrag) => eintrag.operation === operation)?.ziel.isConnected ?? null
    },
    imDokument(operation) {
      const ziel = renderer.find((eintrag) => eintrag.operation === operation)?.ziel
      return ziel ? ziel.isConnected : false
    },
    uebernahme() {
      uebernahmen += 1
      return uebernahmen
    },
    wartenSetzen(wert) {
      warten = wert
    },
    fehlerSetzen(wert) {
      sofortFehler = wert
    },
    stand,
    renderer: {
      laden(suche: GygSuchkonfiguration, ziel, signal) {
        const operation = ++rendererNummer
        const label = `${suche.umfang}:${suche.name}:${suche.countryCode}`
        const inhalt = document.createElement('div')
        inhalt.dataset.gygSynthese = suche.umfang
        inhalt.dataset.gygOperation = String(operation)
        inhalt.textContent = label
        ziel.append(inhalt)
        const eintrag: RendererEintrag = {
          operation,
          label,
          aborted: signal.aborted,
          settled: false,
          zugestellt: false,
          verbunden: ziel.isConnected,
          ziel,
          host: ziel.parentElement,
          resolve: () => undefined,
          reject: () => undefined,
        }
        renderer.push(eintrag)
        nachZiel.set(ziel, eintrag)
        if (sofortFehler) {
          inhalt.remove()
          eintrag.settled = true
          eintrag.zugestellt = true
          eintrag.verbunden = false
          return Promise.resolve({ art: 'abgelehnt', meldung: '' })
        }
        if (!warten) {
          eintrag.settled = true
          eintrag.zugestellt = true
          eintrag.verbunden = ziel.isConnected
          return Promise.resolve({ art: 'ressource' })
        }
        inhalt.dataset.gygWartet = '1'
        const vormerken = () => {
          eintrag.aborted = true
        }
        if (signal.aborted) vormerken()
        else signal.addEventListener('abort', vormerken, { once: true })
        return new Promise<GygLadeErgebnis>((resolve, reject) => {
          eintrag.resolve = resolve
          eintrag.reject = reject
        })
      },
      entsorgen(ziel) {
        const eintrag = nachZiel.get(ziel)
        entsorgen.push({ operation: eintrag?.operation ?? 0, verbunden: ziel.isConnected })
        const zeile = document.createElement('p')
        zeile.dataset.gygEntsorgt = '1'
        zeile.textContent = 'stale-dispose'
        ziel.append(zeile)
        eintrag?.host?.append(ziel)
        throw new Error('dispose-synthetic')
      },
    },
  }
  return bruecke
}

type SyntheseFenster = Window & { __gygSynthese?: Bruecke }

export function bruecke(): Bruecke {
  const fenster = window as SyntheseFenster
  if (!fenster.__gygSynthese) fenster.__gygSynthese = erzeugen()
  return fenster.__gygSynthese
}
