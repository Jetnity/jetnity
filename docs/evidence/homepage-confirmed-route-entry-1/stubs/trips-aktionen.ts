type Fenster = typeof globalThis & {
  __reiseAnlegenCalls?: unknown[]
}

export async function reiseAnlegen(eingabe: unknown) {
  const fenster = globalThis as Fenster
  fenster.__reiseAnlegenCalls ??= []
  fenster.__reiseAnlegenCalls.push(eingabe)
  return { ok: true as const, wert: 'trip-hydrated-1' }
}

/** Synthetische Quelle des vorhandenen Hydration-Harness, keine echte Auth. */
export async function reiseCreateSitzungsstandLesen(): Promise<'konto' | 'gast'> {
  return new URLSearchParams(window.location.search).get('konto') === '1' ? 'konto' : 'gast'
}
