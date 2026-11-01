export async function ortBestaetigen(): Promise<{ ok: false; meldung: string }> {
  return { ok: false, meldung: 'Die Prüfnaht liest keinen Ort.' }
}
