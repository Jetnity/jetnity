import 'server-only'

import { HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL, readHumanRelease, type HumanRelease } from './human-contract'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { selectedV3PgTarget } from '../transport/node-postgres-selection'

// Reviewed data and inert fixed selectors; no connection, credentials or source read.
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
// A distinct empty Production ledger is a precondition of the prepared installer.
// This descriptor is not the Dev selection and carries no Dev Owner receipt.
const PRODUCTION_RELEASE: HumanReleaseSelection = Object.freeze({
  selectionId: 'hmr1_6820db8992a74c52947bc59cb085a214', predecessorRevision: null, expectedHead: null,
})

function materialize(selection: HumanReleaseSelection | null, targetUrl: HumanRelease['targetUrl']): HumanRelease | null {
  if (!selection) return null
  return readHumanRelease({ ...HUMAN_METHOD_REVIEWED_DATA, targetUrl,
    selectionId: selection.selectionId, predecessorRevision: selection.predecessorRevision,
    expectedHead: selection.expectedHead })
}

export function getHumanRelease(): HumanRelease | null {
  const target = selectedV3PgTarget()
  if (target?.connectHost === 'db.yfvbxvijcorffwxbxahl.supabase.co') return materialize(SELECTED_RELEASE, HUMAN_METHOD_DEV_URL)
  if (target?.connectHost === 'db.qscbgcdmivbbnzrcyegn.supabase.co') return materialize(PRODUCTION_RELEASE, HUMAN_METHOD_PRODUCTION_URL)
  return null
}
