type Grenze = (name: string, eingabe: unknown) => Promise<unknown>

function grenzen(): Grenze {
  const ziel = window as unknown as { fixture?: { grenzen: Grenze } }
  if (!ziel.fixture) throw new Error('Planungsgrenze ist nicht bereit.')
  return ziel.fixture.grenzen
}

export async function vorschlagErzeugen(freitext: unknown) {
  return grenzen()('erzeugen', freitext)
}

export async function vorschlagUebernehmen(eingabe: unknown) {
  return grenzen()('uebernehmen', eingabe)
}

export async function vorschlagOrteAufloesen(eingabe: unknown) {
  return grenzen()('aufloesen', eingabe)
}
