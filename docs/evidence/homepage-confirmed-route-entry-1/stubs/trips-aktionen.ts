type Fenster = typeof globalThis & {
  __reiseAnlegenCalls?: unknown[]
}

export async function reiseAnlegen(eingabe: unknown) {
  const fenster = globalThis as Fenster
  fenster.__reiseAnlegenCalls ??= []
  fenster.__reiseAnlegenCalls.push(eingabe)
  return { ok: true as const, wert: 'trip-hydrated-1' }
}
