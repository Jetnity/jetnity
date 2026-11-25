import 'server-only'
import { selectedAustriaProduction } from './at-production-selection'
import { resolveAtApprovedVisitorCopy, type AtApprovedVisitorCopy } from './at-visitor-release'

// Deliberately UNRELEASED. The legal draft in docs is not a runtime source.
// A later, separately reviewed PO release must provide the approved wording.
// Neither the visitor flag alone nor the V3 source-owner receipt supplies it.
const APPROVED_COPY: AtApprovedVisitorCopy | null = null

export function selectedAtVisitorProductionPresentation(): AtApprovedVisitorCopy | null {
  return resolveAtApprovedVisitorCopy(selectedAustriaProduction(), APPROVED_COPY)
}
