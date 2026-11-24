import { gastreiseAendern, gastspeicherLaden, aktiveGastreiseVorpruefen } from '@/lib/trips/gastspeicher'
import { vorschauKennungen } from './entwurf'
import type { OrtBestaetigung } from '@/lib/places/aktionen'
import { manuellSpeichern } from './speichern'
import { rueckgaengigSpeichern } from './rueckgaengig'

export async function gastManuellSpeichern(roh: unknown, ortLesen?: (id: string, rolle: 'ziel') => Promise<OrtBestaetigung>) {
  return manuellSpeichern(roh, {
    quelle: 'guest',
    ortLesen,
    lesen: async () => {
      const preflight = aktiveGastreiseVorpruefen()
      if (preflight.art === 'speicher_unlesbar' || preflight.art === 'ungueltig') throw new Error('Guest storage unavailable')
      return gastspeicherLaden().aktiv
    },
    schreiben: async (expected, mutationId, basisRevision, operationen) => {
      // Revalidate at the synchronous boundary. No awaited work between this load and write.
      const current = gastspeicherLaden().aktiv
      if (!current || current.id !== expected.id || current.revision !== basisRevision) return { konflikt: true }
      const request = roh as { seed: string }
      gastreiseAendern({ tripId: current.id, mutationId, basisRevision,
        operationen, kennung: vorschauKennungen(request.seed) })
      return { konflikt: false }
    },
  })
}


/** Same explicit, revision-checked guest writer; no extra browser storage. */
export async function gastManuellRueckgaengig(roh: unknown) {
  return rueckgaengigSpeichern(roh, {
    quelle: 'guest',
    lesen: async () => {
      const preflight = aktiveGastreiseVorpruefen()
      if (preflight.art === 'speicher_unlesbar' || preflight.art === 'ungueltig')
        throw new Error('Guest storage unavailable')
      return gastspeicherLaden().aktiv
    },
    schreiben: async (graph, mutationId, basisRevision, operationen) => {
      const frisch = gastspeicherLaden().aktiv
      if (!frisch || frisch.id !== graph.id || frisch.revision !== basisRevision) return { konflikt: true }
      gastreiseAendern({
        tripId: graph.id, mutationId, basisRevision, operationen,
        kennung: vorschauKennungen((roh as { seed: string }).seed),
      })
      return { konflikt: false }
    },
  })
}
