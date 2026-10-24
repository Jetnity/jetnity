type Grenze = (name: string, eingabe: unknown) => Promise<unknown>

function grenzen(): Grenze {
  const ziel = window as unknown as { fixture?: { grenzen: Grenze } }
  if (!ziel.fixture) throw new Error('Planungsgrenze ist nicht bereit.')
  return ziel.fixture.grenzen
}

export async function reiseAnlegen(eingabe: unknown) {
  return grenzen()('anlegen', eingabe)
}
