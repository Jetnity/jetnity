// lib/account/welt-laender.ts
//
// Verbindet zwei getrennte Wahrheiten mit der Kartengeometrie: bestätigt
// besuchte Länder und in Jetnity geplante Länder.
//
// Keine der beiden Listen überschreibt die andere. Ein Land, das bestätigt
// besucht *und* erneut geplant ist, trägt beide Zustände – das ist der
// häufigste Fall bei einem Ort, den jemand liebt, und wäre als „nur geplant“
// oder „nur besucht“ jedes Mal eine Unterschlagung.
//
// Die Geometrie kommt als Nachschlagewerk herein, statt hier importiert zu
// werden. Das ist kein Stil, sondern Nutzlast: die vollständige Ländertabelle
// wiegt rund 90 kB und gehört auf den Server. Wer sie nachschlägt, ist
// `welt-geometrie.ts` – dort und nur dort –, und der Browser bekommt am Ende
// die wenigen Flächen des eigenen Lebens statt die aller Länder.

import { countryCodeNormalisieren, landAnzeigeText } from '@/lib/country/darstellung'

export type WeltLandZustand = 'besucht' | 'geplant' | 'beides'

/**
 * Wie ein Zustand heisst, wenn er nicht gezeigt, sondern gesagt wird.
 *
 * Jede Farbe auf der Karte hat hier ihr Wort. Wer Farben nicht unterscheidet,
 * liest denselben Sachverhalt in der Länderliste und im Vorlesetext – und
 * „Besucht und geplant“ ist zwei Aussagen, nicht eine dritte.
 */
export const WELT_ZUSTAND_TEXT: Readonly<Record<WeltLandZustand, string>> = {
  besucht: 'Besucht',
  geplant: 'Geplant',
  beides: 'Besucht und geplant',
}

export type WeltLandFlaeche = {
  code: string
  label: string
  zustand: WeltLandZustand
  /**
   * Gefüllte Landesfläche in Projektionskoordinaten. `null` heisst: dieses
   * Land ist auf Weltmassstab kleiner als ein Strich – nicht, dass es fehlt.
   */
  pfad: string | null
  /** Ersatzmarke für Länder ohne zeichenbare Fläche, sonst `null`. */
  punkt: { x: number; y: number } | null
}

export type WeltLaenderAbleitung = {
  flaechen: readonly WeltLandFlaeche[]
  /** Länder, die nur als Punkt dargestellt werden können. Für ehrliche Copy. */
  ohneFlaeche: readonly string[]
}

/** Was die Kartografie zu einem Land hergibt: eine Fläche oder ein Punkt. */
export type WeltLandGeometrie = {
  pfade: readonly string[] | null
  punkt: readonly [number, number] | null
}

export type WeltGeometrie = Readonly<Record<string, WeltLandGeometrie>>

function normalisierteMenge(codes: readonly (string | null | undefined)[]): Set<string> {
  const menge = new Set<string>()
  for (const code of codes) {
    const normal = countryCodeNormalisieren(code)
    if (normal) menge.add(normal)
  }
  return menge
}

function zustandFuer(besucht: boolean, geplant: boolean): WeltLandZustand | null {
  if (besucht && geplant) return 'beides'
  if (besucht) return 'besucht'
  if (geplant) return 'geplant'
  return null
}

/**
 * Die einzufärbenden Länder, alphabetisch nach Code.
 *
 * Länder ohne Zustand kommen nicht vor: sie bleiben die neutrale Grundkarte.
 * Das ist kein Sparen, sondern die Bedeutung – neutral heisst „hierüber liegt
 * keine Aussage vor“.
 */
export function weltLaenderAbleiten({
  besucht,
  geplant,
  geometrie,
}: {
  besucht: readonly (string | null | undefined)[]
  geplant: readonly (string | null | undefined)[]
  geometrie: WeltGeometrie
}): WeltLaenderAbleitung {
  const besuchteCodes = normalisierteMenge(besucht)
  const geplanteCodes = normalisierteMenge(geplant)

  const flaechen: WeltLandFlaeche[] = []
  const ohneFlaeche: string[] = []

  for (const code of [...new Set([...besuchteCodes, ...geplanteCodes])].sort()) {
    const zustand = zustandFuer(besuchteCodes.has(code), geplanteCodes.has(code))
    if (!zustand) continue

    const eintrag = geometrie[code]
    const label = landAnzeigeText(code)

    if (eintrag?.pfade && eintrag.pfade.length > 0) {
      flaechen.push({ code, label, zustand, pfad: eintrag.pfade.join(' '), punkt: null })
      continue
    }

    if (eintrag?.punkt) {
      flaechen.push({
        code,
        label,
        zustand,
        pfad: null,
        punkt: { x: eintrag.punkt[0], y: eintrag.punkt[1] },
      })
      ohneFlaeche.push(label)
      continue
    }

    // Weder Fläche noch Punkt: etwa ein persistierter Code, den die
    // Kartografie nicht führt. Er zählt weiter in den Kennzahlen und steht in
    // der Länderliste – nur die Karte schweigt über ihn.
    flaechen.push({ code, label, zustand, pfad: null, punkt: null })
    ohneFlaeche.push(label)
  }

  return { flaechen, ohneFlaeche }
}

/**
 * Hinweis für Länder, die die Karte nicht einfärben kann.
 *
 * Ohne diesen Satz widerspräche die Karte der Kennzahl daneben: „Besucht:
 * 1 Land“ über einer Karte, auf der nichts leuchtet.
 */
export function weltOhneFlaecheHinweis(namen: readonly string[]): string | null {
  if (namen.length === 0) return null
  if (namen.length === 1) {
    return `${namen[0]} ist auf dieser Kartengrösse kleiner als ein Strich und wird als Punkt gezeigt.`
  }
  return `${namen.join(', ')} sind auf dieser Kartengrösse kleiner als ein Strich und werden als Punkte gezeigt.`
}
