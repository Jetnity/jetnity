import type { Plugin } from 'esbuild'

/** Next replaces these actions with remote references. Isolated, unsigned route
 * fixtures have no server. Fail loudly if their navigation invokes a mutation. */
export const atlasServerActions: Plugin = {
  name: 'isolated-itinerary-server-actions',
  setup(build) {
    const files = {
      '@/lib/reiseaenderung/aktionen': [
        'manuelleAenderungVorschau', 'manuelleAenderungUebernehmen', 'aenderungErzeugen',
        'aenderungErzeugenGast', 'aenderungOrteAufloesen', 'aenderungUebernehmen',
      ],
      '@/lib/places/aktionen': ['ortBestaetigen', 'reiseorteBestaetigen'],
      '@/lib/saved-offers/actions': ['savedOffersList', 'saveManualOffer', 'saveRentalOffer', 'removeSavedOffer'],
      '@/lib/saved-offers/plan-actions': ['savedOfferTrips', 'savedOfferDays', 'savedOfferToPlan'],
    } as const
    build.onResolve({ filter: /^@\/lib\/((reiseaenderung|places)\/aktionen|saved-offers\/(actions|plan-actions))$/ }, args => ({
      path: args.path, namespace: 'itinerary-server-action',
    }))
    build.onLoad({ filter: /.*/, namespace: 'itinerary-server-action' }, args => ({
      contents: files[args.path as keyof typeof files]
        .map(name => `export async function ${name}() { throw new Error("Unexpected server action: ${name}") }`)
        .join('\n'),
      loader: 'js',
    }))
  },
}
