type Eintrag = { id: number; name: string; argument: unknown }
type Warten = { resolve: (wert: unknown) => void; reject: (fehler: unknown) => void }

type VisitFenster = Window & {
  __visitAufrufe: Eintrag[]
  __visitWarten: Map<number, Warten>
  __visitSeq: number
  __visitErledigen: (id: number, wert: unknown) => void
  __visitAblehnen: (id: number) => void
  __visitWirf: boolean
  __visitSofort: unknown
}

function fenster(): VisitFenster {
  return window as VisitFenster
}

function basis(): VisitFenster {
  const ziel = fenster()
  ziel.__visitAufrufe = ziel.__visitAufrufe ?? []
  ziel.__visitWarten = ziel.__visitWarten ?? new Map()
  ziel.__visitSeq = ziel.__visitSeq ?? 0
  ziel.__visitWirf = ziel.__visitWirf ?? false
  ziel.__visitErledigen =
    ziel.__visitErledigen ??
    ((id, wert) => {
      const job = ziel.__visitWarten.get(id)
      if (!job) throw new Error(`kein Aufruf ${id}`)
      job.resolve(wert)
    })
  ziel.__visitAblehnen =
    ziel.__visitAblehnen ??
    ((id) => {
      const job = ziel.__visitWarten.get(id)
      if (!job) throw new Error(`kein Aufruf ${id}`)
      job.reject(new Error('aktion'))
    })
  return ziel
}

function merk(name: string, argument: unknown): Promise<unknown> {
  const ziel = basis()
  if (ziel.__visitWirf) {
    ziel.__visitWirf = false
    ziel.__visitAufrufe.push({ id: ++ziel.__visitSeq, name, argument })
    throw new Error('synchron')
  }
  const id = ++ziel.__visitSeq
  ziel.__visitAufrufe.push({ id, name, argument })
  if (ziel.__visitSofort !== undefined) {
    const wert = ziel.__visitSofort
    ziel.__visitSofort = undefined
    return Promise.resolve(wert)
  }
  return new Promise((resolve, reject) => {
    ziel.__visitWarten.set(id, { resolve, reject })
  })
}

export function besuchBestaetigen(eingabe: unknown): Promise<unknown> {
  return merk('bestaetigen', eingabe)
}

export function besuchAendern(eingabe: unknown): Promise<unknown> {
  return merk('aendern', eingabe)
}

export function besuchWiderrufen(eingabe: unknown): Promise<unknown> {
  return merk('widerrufen', eingabe)
}

basis()
