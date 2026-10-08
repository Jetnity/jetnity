import { gastreiseAendern, gastspeicherLaden, aktiveGastreiseVorpruefen } from '@/lib/trips/gastspeicher'
import { manuellerEntwurf, vorschauKennungen } from './entwurf'
import { manuellSpeichern } from './speichern'

export async function gastManuellSpeichern(roh: unknown) {
  return manuellSpeichern(roh, {
    quelle: 'guest',
    lesen: async () => {
      const preflight = aktiveGastreiseVorpruefen()
      if (preflight.art === 'speicher_unlesbar' || preflight.art === 'ungueltig') throw new Error('Guest storage unavailable')
      return gastspeicherLaden().aktiv
    },
    schreiben: async (expected, mutationId, basisRevision) => {
      // Revalidate at the synchronous boundary. No awaited work between this load and write.
      const current = gastspeicherLaden().aktiv
      if (!current || current.id !== expected.id || current.revision !== basisRevision) return { konflikt: true }
      const request = roh as { eingabe: unknown; seed: string }
      const parsed = manuellerEntwurf(current, request.eingabe, vorschauKennungen(request.seed))
      if (!parsed.ok) return { konflikt: true }
      gastreiseAendern({ tripId: current.id, mutationId, basisRevision,
        operationen: parsed.operationen, kennung: vorschauKennungen(request.seed) })
      return { konflikt: false }
    },
  })
}
