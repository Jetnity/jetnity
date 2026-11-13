import 'server-only'

import { HUMAN_METHOD_DEV_URL, readHumanRelease, type HumanRelease } from './human-contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { selectedV3PgTarget } from '../transport/node-postgres-selection'

// Reviewed data and the inert Dev selector; no connection, credentials or source read.
// Method/package digests come from the actual Root program's canonical package.
const binding = AA_BERN_CH_DE_REVIEWED_PROGRAM.binding
export const HUMAN_METHOD_REVIEWED_DATA: Omit<HumanRelease,
  'selectionId' | 'predecessorRevision' | 'expectedHead'> = Object.freeze({
  schema: 1, targetUrl: HUMAN_METHOD_DEV_URL,
  methodId: binding.methodId, revision: binding.revision,
  methodDigest: binding.methodDigest, packageDigest: binding.packageDigest,
  // Root's explicit #1169 choice: one approval, then automatic operation until
  // revocation within the separate operating window. This is not a receipt.
  approval: Object.freeze({ mode: 'until_revoked', until: null }),
  packageVersion: 'AA und Deutsche Botschaft Bern · CH→DE Visum · Revision 1',
  packageHref: 'https://github.com/Jetnity/jetnity/blob/6435c4e691b9cbc8d1c25b3167506b16914bcfae/lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program.ts',
  scope: Object.freeze({ citizenship: 'CH', destination: 'DE', requirement: 'visa',
    document: 'swiss_passport', route: 'direct_entry', conditions: 'unconditional',
    activeFrom: binding.activeFrom, activeUntilExclusive: binding.activeUntilExclusive,
    reviewedScope: 'Geprüft wird die Visumpflicht für Schweizer Reisepässe bei direkter Einreise nach Deutschland. '
      + 'Der geprüfte Visumfakt enthält keine Bedingung zu Reisezweck oder Aufenthaltsdauer. '
      + 'Aufenthaltsrecht, Erwerbstätigkeit und die vollständige Einreiseberechtigung werden damit nicht bestätigt.',
  }),
})

type HumanReleaseSelection = Pick<HumanRelease, 'selectionId' | 'predecessorRevision' | 'expectedHead'>
// Root's fresh Dev readback found no revisions, head or operations. This fixed
// descriptor only enables review; the real Owner/AAL2 actions remain separate.
// Environment metadata may refuse it, never replace its selection or binding.
const SELECTED_RELEASE: HumanReleaseSelection = Object.freeze({
  selectionId: 'hmr1_fad09ef526aeea7eeeb3fb1f22c894f1', predecessorRevision: null, expectedHead: null,
})

function materialize(selection: HumanReleaseSelection | null): HumanRelease | null {
  if (!selection) return null
  return readHumanRelease({ ...HUMAN_METHOD_REVIEWED_DATA,
    selectionId: selection.selectionId, predecessorRevision: selection.predecessorRevision,
    expectedHead: selection.expectedHead })
}

export function getHumanRelease(): HumanRelease | null {
  if (selectedV3PgTarget() === null) return null
  return materialize(SELECTED_RELEASE)
}
