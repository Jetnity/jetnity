type Aufruf = { id: number; eingabe: unknown }
type PlanenFenster = Window & {
  __reiseAufrufe: Aufruf[]
}

function fenster(): PlanenFenster {
  const ziel = window as PlanenFenster
  ziel.__reiseAufrufe = ziel.__reiseAufrufe ?? []
  return ziel
}

export async function reiseAnlegen(eingabe: unknown) {
  const ziel = fenster()
  ziel.__reiseAufrufe.push({ id: ziel.__reiseAufrufe.length + 1, eingabe })
  return { ok: true as const, wert: 'konto-reise-synthetisch' }
}

fenster()
