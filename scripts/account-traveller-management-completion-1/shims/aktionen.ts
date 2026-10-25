type Eintrag = { id: number; name: string; argument: unknown }

type Warten = { resolve: (wert: unknown) => void; reject: (fehler: unknown) => void }

type RegistryFenster = Window & {
  __registryAufrufe: Eintrag[]
  __registryWarten: Map<number, Warten>
  __registrySeq: number
  __registryErledigen: (id: number, wert: unknown) => void
  __registryAblehnen: (id: number) => void
}

function fenster(): RegistryFenster {
  return window as RegistryFenster
}

function basis(): RegistryFenster {
  const ziel = fenster()
  ziel.__registryAufrufe = ziel.__registryAufrufe ?? []
  ziel.__registryWarten = ziel.__registryWarten ?? new Map()
  ziel.__registrySeq = ziel.__registrySeq ?? 0
  ziel.__registryErledigen =
    ziel.__registryErledigen ??
    ((id, wert) => {
      const job = ziel.__registryWarten.get(id)
      if (!job) throw new Error(`kein Aufruf ${id}`)
      job.resolve(wert)
    })
  ziel.__registryAblehnen =
    ziel.__registryAblehnen ??
    ((id) => {
      const job = ziel.__registryWarten.get(id)
      if (!job) throw new Error(`kein Aufruf ${id}`)
      job.reject(new Error('aktion'))
    })
  return ziel
}

function merk(name: string, argument: unknown): Promise<unknown> {
  const ziel = basis()
  const id = ++ziel.__registrySeq
  ziel.__registryAufrufe.push({ id, name, argument })
  return new Promise((resolve, reject) => {
    ziel.__registryWarten.set(id, { resolve, reject })
  })
}

export function registryTravellerAnlegen(eingabe: unknown): Promise<unknown> {
  return merk('traveller-anlegen', eingabe)
}

export function registryTravellerAendern(eingabe: unknown): Promise<unknown> {
  return merk('traveller-aendern', eingabe)
}

export function registryTravellerLoeschen(eingabe: unknown): Promise<unknown> {
  return merk('traveller-loeschen', eingabe)
}

export function registryCitizenshipAnlegen(eingabe: unknown): Promise<unknown> {
  return merk('citizenship-anlegen', eingabe)
}

export function registryCitizenshipLoeschen(eingabe: unknown): Promise<unknown> {
  return merk('citizenship-loeschen', eingabe)
}

export function registryDocumentAnlegen(eingabe: unknown): Promise<unknown> {
  return merk('document-anlegen', eingabe)
}

export function registryDocumentAendern(eingabe: unknown): Promise<unknown> {
  return merk('document-aendern', eingabe)
}

export function registryDocumentLoeschen(eingabe: unknown): Promise<unknown> {
  return merk('document-loeschen', eingabe)
}

basis()
