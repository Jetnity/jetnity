import { z } from 'zod'
import { manuellSchema, manuellerEntwurf, vorschauKennungen } from './entwurf'
import { bedeutung, bestaetigteReise, fingerprint, mutationskennung, KONFLIKT, UNGEWISS, type SpeicherErgebnis } from './bestaetigung'
import type { Trip } from '@/types/trips'

const manuellAnfrageSchema = z.object({
  tripId: z.string().min(1).max(80), basisRevision: z.number().int().min(1),
  seed: z.string().uuid(), eingabe: manuellSchema,
  hash: z.string().regex(/^[a-f0-9]{64}$/), nurPruefen: z.boolean().optional(),
}).strict()
export type ManuelleAnfrage = z.infer<typeof manuellAnfrageSchema>
export type ManuelleVorschau = { vorher: Trip; nachher: Trip; anfrage: ManuelleAnfrage }
export async function manuellVorschau(vorher: Trip, eingabe: unknown, seed: string, quelle: 'guest' | 'account' = 'guest'): Promise<
  { ok: true; vorschau: ManuelleVorschau } | { ok: false; meldung: string; feld: string }
> {
  if (!z.string().uuid().safeParse(seed).success) return { ok: false, meldung: 'Ungültige Änderungssitzung.', feld: 'form' }
  const result = manuellerEntwurf(vorher, eingabe, vorschauKennungen(seed), quelle)
  if (!result.ok) return result
  return { ok: true, vorschau: { vorher, nachher: result.nachher, anfrage: {
    tripId: vorher.id, basisRevision: vorher.revision, seed, eingabe: result.eingabe,
    hash: await fingerprint(bedeutung(result.nachher)),
  } } }
}

/** Actual authoritative reader and unchanged transactional RPC are supplied by the action. */
export async function manuellSpeichern(roh: unknown, ports: {
  quelle?: 'guest' | 'account'
  lesen: (id: string) => Promise<Trip | null>
  schreiben: (trip: Trip, mutation: string, revision: number) => Promise<{ konflikt: boolean }>
}): Promise<SpeicherErgebnis> {
  const parsed = manuellAnfrageSchema.safeParse(roh)
  if (!parsed.success) return { ok: false, art: 'eingabe', meldung: 'Die Änderung enthält ungültige oder nicht unterstützte Felder.' }
  const request = parsed.data
  const mutationId = await mutationskennung(request.seed, request.tripId, request.basisRevision, { eingabe: request.eingabe, hash: request.hash })
  const expected = { ...request, mutationId }
  let current: Trip | null
  try { current = await ports.lesen(request.tripId) }
  catch { return { ok: false, art: 'unverfuegbar', meldung: 'Die Reise kann gerade nicht gelesen werden. Deine Vorschau bleibt erhalten.' } }
  if (!current || current.id !== request.tripId) return { ok: false, art: 'sitzung', meldung: ports.quelle === 'account' ? 'Die Reise ist mit dieser Anmeldung nicht verfügbar. Deine Vorschau bleibt erhalten.' : 'Die ursprüngliche Reise ist nicht mehr die aktive Reise auf diesem Gerät. Deine Vorschau bleibt erhalten.' }
  if (current.lastMutationId === mutationId) {
    return await bestaetigteReise(current, expected) ? { ok: true, reise: current } : { ok: false, art: 'konflikt', meldung: KONFLIKT }
  }
  if (current.revision !== request.basisRevision) return { ok: false, art: 'konflikt', meldung: KONFLIKT }
  if (request.nurPruefen) return { ok: false, art: 'unverfuegbar', meldung: 'Diese Änderung ist im aktuellen Stand noch nicht gespeichert. Du kannst dieselbe Vorschau erneut übernehmen.' }
  const applied = manuellerEntwurf(current, request.eingabe, vorschauKennungen(request.seed), ports.quelle)
  if (!applied.ok) return { ok: false, art: 'eingabe', meldung: applied.meldung }
  if (await fingerprint(bedeutung(applied.nachher)) !== request.hash) return { ok: false, art: 'konflikt', meldung: KONFLIKT }
  let konflikt = false
  // A thrown/empty/lost acknowledgement never proves rollback. Always use an independent read.
  try { konflikt = (await ports.schreiben(applied.nachher, mutationId, request.basisRevision)).konflikt } catch { /* readback decides */ }
  try {
    const fresh = await ports.lesen(request.tripId)
    if (fresh && await bestaetigteReise(fresh, expected)) return { ok: true, reise: fresh }
    if (fresh && fresh.revision !== request.basisRevision && fresh.lastMutationId !== mutationId)
      return { ok: false, art: 'konflikt', meldung: KONFLIKT }
  } catch { /* explicitly uncertain */ }
  return konflikt ? { ok: false, art: 'konflikt', meldung: KONFLIKT } : { ok: false, art: 'ungewiss', meldung: UNGEWISS }
}
