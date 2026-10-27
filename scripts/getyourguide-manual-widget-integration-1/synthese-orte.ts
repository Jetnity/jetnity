// Nur das synthetische Bündel. Die Produktionsaktion bleibt unverändert.

import { bruecke } from './synthese-bruecke'

export async function ortBestaetigen(id: string, _rolle: string) {
  const ort = await bruecke().ortOeffnen(id, null, 'aktion')
  if (!ort || ort.id !== id) return { ok: false as const, meldung: 'synthetisch' }
  return { ok: true as const, wert: ort }
}

export async function reiseorteBestaetigen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'synthetisch' }
}
