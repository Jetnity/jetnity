/** Rendered text/UI pairs. Thresholds match TASK V1: 4.5:1 body text, 3:1 large text and control cues. */

export type Rgb = readonly [number, number, number]

export type Farbe = { r: number; g: number; b: number; a: number }

export type Paar = {
  name: string
  kind: 'text' | 'ui'
  fontSize: number
  fontWeight: number
  color: Rgb
  background: Rgb | null
  unsupported: string | null
}

export type Urteil = {
  ok: boolean
  fehler: string[]
  paare: number
  unsupported: string[]
}

const NORMAL_TEXT = 4.5
const GROSS_ODER_UI = 3

function kanal(wert: number) {
  const anteil = wert / 255
  return anteil <= 0.04045 ? anteil / 12.92 : ((anteil + 0.055) / 1.055) ** 2.4
}

export function kontrast(vordergrund: Rgb, hintergrund: Rgb) {
  const helligkeit = (farbe: Rgb) => 0.2126 * kanal(farbe[0]) + 0.7152 * kanal(farbe[1]) + 0.0722 * kanal(farbe[2])
  const erste = helligkeit(vordergrund)
  const zweite = helligkeit(hintergrund)
  const [hell, dunkel] = erste > zweite ? [erste, zweite] : [zweite, erste]
  return (hell + 0.05) / (dunkel + 0.05)
}

function gross(paar: Paar) {
  return paar.fontSize >= 24 || (paar.fontWeight >= 700 && paar.fontSize >= 18.67)
}

function ziel(paar: Paar) {
  if (paar.kind === 'ui') return GROSS_ODER_UI
  return gross(paar) ? GROSS_ODER_UI : NORMAL_TEXT
}

/**
 * The same decision for rendered pairs and for the injected counterexample.
 * An empty required list is a vacuous contract and fails.
 * A required name with no pair fails, even when every present pair would pass.
 */
export function paarePruefen(paare: readonly Paar[], erforderlich: readonly string[]): Urteil {
  const fehler: string[] = []
  const unsupported: string[] = []
  if (erforderlich.length === 0) fehler.push('required label list is empty')
  if (paare.length === 0) fehler.push('no rendered pairs')
  for (const name of erforderlich) {
    const da = paare.some((paar) => paar.name === name || paar.name.includes(name))
    if (!da) fehler.push(`missing required label: ${name}`)
  }
  paare.forEach((paar, index) => {
    if (paar.unsupported || !paar.background) {
      unsupported.push(`${index}:${paar.name}:${paar.unsupported ?? 'no background'}`)
      return
    }
    const wert = kontrast(paar.color, paar.background)
    const minimum = ziel(paar)
    if (wert < minimum) {
      fehler.push(
        `pair ${index} ${paar.kind} "${paar.name}" contrast ${wert.toFixed(2)} < ${minimum} on rgb(${paar.background.join(',')})`,
      )
    }
  })
  return { ok: fehler.length === 0, fehler, paare: paare.length, unsupported }
}

function farbeLesen(text: string): Farbe | null {
  const treffer = text.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/)
  if (!treffer) return null
  return {
    r: Number(treffer[1]),
    g: Number(treffer[2]),
    b: Number(treffer[3]),
    a: treffer[4] === undefined ? 1 : Number(treffer[4]),
  }
}

function mischen(oben: Farbe, unten: Rgb): Rgb {
  const a = oben.a
  return [
    Math.round(oben.r * a + unten[0] * (1 - a)),
    Math.round(oben.g * a + unten[1] * (1 - a)),
    Math.round(oben.b * a + unten[2] * (1 - a)),
  ]
}

function textOhneSteuer(el: Element) {
  const klon = el.cloneNode(true) as HTMLElement
  klon.querySelectorAll('input,textarea,select,svg,img').forEach((knoten) => knoten.remove())
  return (klon.textContent || '').replace(/\s+/g, ' ').trim()
}

function sichtbar(el: Element) {
  if (!(el instanceof HTMLElement)) return false
  if (el.closest('[data-negative],[data-white-mint-probe],[aria-hidden="true"]')) return false
  const stil = getComputedStyle(el)
  if (stil.display === 'none' || stil.visibility === 'hidden' || Number(stil.opacity) === 0) return false
  const rechteck = el.getBoundingClientRect()
  return rechteck.width >= 8 && rechteck.height >= 8
}

function hintergrund(el: Element | null): { farbe: Rgb | null; unsupported: string | null } {
  const schichten: Farbe[] = []
  let knoten: Element | null = el
  let undurchsichtig = false
  while (knoten && knoten instanceof Element) {
    const stil = getComputedStyle(knoten)
    const bild = stil.backgroundImage && stil.backgroundImage !== 'none'
    if (bild && !undurchsichtig) {
      return { farbe: null, unsupported: `background-image on ${knoten.tagName.toLowerCase()}` }
    }
    const flaeche = farbeLesen(stil.backgroundColor)
    if (flaeche && flaeche.a > 0) schichten.push(flaeche)
    if (flaeche && flaeche.a >= 0.99) {
      undurchsichtig = true
      break
    }
    knoten = knoten.parentElement
  }
  if (!undurchsichtig || schichten.length === 0) {
    return { farbe: null, unsupported: 'no opaque ancestor background' }
  }
  let acc: Rgb = [schichten[schichten.length - 1]!.r, schichten[schichten.length - 1]!.g, schichten[schichten.length - 1]!.b]
  for (let index = schichten.length - 2; index >= 0; index -= 1) acc = mischen(schichten[index]!, acc)
  return { farbe: acc, unsupported: null }
}

function ueberBild(el: Element) {
  const rechteck = el.getBoundingClientRect()
  const wurzel = el.closest('a,article,section,div') ?? el.parentElement
  if (!wurzel) return false
  for (const bild of wurzel.querySelectorAll('img')) {
    const kasten = bild.getBoundingClientRect()
    const kreuzt = rechteck.left < kasten.right && rechteck.right > kasten.left && rechteck.top < kasten.bottom && rechteck.bottom > kasten.top
    if (kreuzt && kasten.width > 8 && kasten.height > 8) return true
  }
  return false
}

const TEXT_SELEKTOR = 'h1,h2,h3,h4,p,a,button,label,summary,small,time,strong,li,span'

/**
 * Collect rendered pairs under root. Runs in the fixture browser.
 * Returns an empty list when root is missing so the checker cannot pass vacuously.
 */
export function paareSammeln(root: ParentNode | null): Paar[] {
  if (!root) return []
  const paare: Paar[] = []
  const gesehen = new Set<string>()
  const merken = (paar: Paar) => {
    const schluessel = `${paar.kind}:${paar.name}:${paar.color.join(',')}:${paar.background?.join(',') ?? ''}`
    if (gesehen.has(schluessel)) return
    gesehen.add(schluessel)
    paare.push(paar)
  }
  root.querySelectorAll<HTMLElement>(TEXT_SELEKTOR).forEach((el) => {
    if (!sichtbar(el)) return
    const name = textOhneSteuer(el).slice(0, 120)
    if (name.length < 2) return
    const stil = getComputedStyle(el)
    const schrift = farbeLesen(stil.color)
    if (!schrift || schrift.a === 0) return
    const bild = ueberBild(el)
    const grund = bild ? { farbe: null, unsupported: 'text over image' } : hintergrund(el)
    const flaeche = grund.farbe
    const farbe = flaeche ? mischen(schrift, flaeche) : [schrift.r, schrift.g, schrift.b] as Rgb
    merken({
      name,
      kind: 'text',
      fontSize: Number.parseFloat(stil.fontSize) || 0,
      fontWeight: Number.parseInt(stil.fontWeight, 10) || 400,
      color: farbe,
      background: flaeche,
      unsupported: grund.unsupported,
    })
  })
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input,textarea').forEach((el) => {
    if (!sichtbar(el) || el.value) return
    const name = (el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 120)
    if (name.length < 2) return
    const stil = getComputedStyle(el, '::placeholder')
    const schrift = farbeLesen(stil.color)
    if (!schrift || schrift.a === 0) return
    const grund = hintergrund(el)
    const flaeche = grund.farbe
    merken({
      name,
      kind: 'text',
      fontSize: Number.parseFloat(stil.fontSize) || Number.parseFloat(getComputedStyle(el).fontSize) || 0,
      fontWeight: Number.parseInt(stil.fontWeight, 10) || 400,
      color: flaeche ? mischen(schrift, flaeche) : [schrift.r, schrift.g, schrift.b],
      background: flaeche,
      unsupported: grund.unsupported,
    })
  })
  root.querySelectorAll<HTMLElement>('input,textarea,select,button').forEach((el) => {
    if (!sichtbar(el)) return
    const stil = getComputedStyle(el)
    if (Number.parseFloat(stil.borderTopWidth) < 1) return
    const rand = farbeLesen(stil.borderTopColor)
    const eigene = farbeLesen(stil.backgroundColor)
    if (!rand || !eigene || eigene.a < 0.99) return
    const gleich = Math.abs(rand.r - eigene.r) < 3 && Math.abs(rand.g - eigene.g) < 3 && Math.abs(rand.b - eigene.b) < 3
    if (gleich) return
    const grund = hintergrund(el.parentElement)
    if (!grund.farbe) return
    const label = el.closest('label')
    const name = (label ? textOhneSteuer(label) : el.getAttribute('aria-label') || textOhneSteuer(el) || el.tagName).slice(0, 120)
    merken({
      name: `${name} border`,
      kind: 'ui',
      fontSize: Number.parseFloat(stil.fontSize) || 0,
      fontWeight: 400,
      color: [rand.r, rand.g, rand.b],
      background: grund.farbe,
      unsupported: grund.unsupported,
    })
  })
  return paare
}
