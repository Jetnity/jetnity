// Fixed fictional CH-passport/GB cell. No DB/producer value selects its identity.
import 'server-only'
import { historicalPinFor, immutable } from '../../../lib/readiness/official-truth-autonomous-provenance-artifact'
import { PILOT_CORPUS, type PilotMode } from '../../official-truth-integrated-pilot-1/corpus'

export function persistedCanonicalReadContract(mode: unknown) {
  if (arguments.length !== 1 || (mode !== 'primary' && mode !== 'composed')) throw Error('persisted_read_context_invalid')
  const definition = { id: `pilot-${mode}-global-cell`, version: 1, scope: PILOT_CORPUS.scope }
  const pin = historicalPinFor(definition.id, 1, definition)
  if (!pin) throw Error('persisted_read_context_invalid')
  return immutable({
    mode: mode as PilotMode, definition,
    request: { definition: pin, scope: PILOT_CORPUS.scope, factKind: 'requirement_effect' as const, requirementType: 'visa' as const },
    quality: mode === 'primary' ? 'explicit_primary_statement' as const : 'composed_from_multiple_primary_sources' as const,
    items: mode === 'primary' ? ['primary_rule'] : ['composed_effect', 'composed_mode'],
  })
}
