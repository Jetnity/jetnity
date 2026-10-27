// Nur das Prüf-Bündel. Die Produktionsaktion bleibt unverändert.

export async function ortBestaetigen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'synthetisch' }
}

export async function reiseorteBestaetigen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'synthetisch' }
}
