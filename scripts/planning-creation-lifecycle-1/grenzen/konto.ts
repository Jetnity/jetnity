type Grenze = (name: string, eingabe: unknown) => Promise<unknown>

function grenzen(): Grenze {
  const ziel = window as unknown as { fixture?: { grenzen: Grenze } }
  if (!ziel.fixture) throw new Error('Planungsgrenze ist nicht bereit.')
  return ziel.fixture.grenzen
}

export async function reiseAnlegen(eingabe: unknown) {
  return grenzen()('anlegen', eingabe)
}

/** Browser-Mount: simulierte frische Serverwahrheit, nie echte Credentials. */
export async function reiseCreateSitzungsstandLesen(): Promise<'konto' | 'gast' | 'unbekannt'> {
  const fenster = window as unknown as { fixture?: { sitzung?: 'konto' | 'gast' | 'unbekannt' } }
  return fenster.fixture?.sitzung ?? 'unbekannt'
}
