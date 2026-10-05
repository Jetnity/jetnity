// lib/airports/csv.ts
//
// Kleiner RFC-4180-Parser für den OurAirports-Import.
// Kein Netzwerk, keine Abhängigkeit. Tests nutzen lokale Fixtures.

export function csvZeilen(text: string): string[][] {
  const zeilen: string[][] = []
  let felder: string[] = []
  let feld = ''
  let inAnfuehrung = false
  const quelle = text.replace(/^\uFEFF/, '')

  const zeileAbschliessen = () => {
    felder.push(feld)
    feld = ''
    if (felder.some((eintrag) => eintrag.length > 0)) zeilen.push(felder)
    felder = []
  }

  for (let i = 0; i < quelle.length; i++) {
    const zeichen = quelle[i]!
    if (inAnfuehrung) {
      if (zeichen === '"') {
        if (quelle[i + 1] === '"') {
          feld += '"'
          i += 1
        } else {
          inAnfuehrung = false
        }
      } else {
        feld += zeichen
      }
      continue
    }
    if (zeichen === '"') {
      inAnfuehrung = true
      continue
    }
    if (zeichen === ',') {
      felder.push(feld)
      feld = ''
      continue
    }
    if (zeichen === '\n') {
      if (feld.endsWith('\r')) feld = feld.slice(0, -1)
      zeileAbschliessen()
      continue
    }
    feld += zeichen
  }

  if (feld.length > 0 || felder.length > 0) zeileAbschliessen()
  return zeilen
}

export function csvAlsObjekte(text: string): Record<string, string>[] {
  const [kopf, ...rest] = csvZeilen(text)
  if (!kopf) return []
  return rest.map((zeile) => {
    const satz: Record<string, string> = {}
    for (let i = 0; i < kopf.length; i++) {
      satz[kopf[i]!] = zeile[i] ?? ''
    }
    return satz
  })
}
