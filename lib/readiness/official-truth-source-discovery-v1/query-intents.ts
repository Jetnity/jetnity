import type { OfficialTruthRechercheAnfrage } from '../official-truth-research-request'
import type { OfficialTruthRechercheAusfuehrungsplan } from '../official-truth-research-execution-plan'

type ReadyPlan = Extract<OfficialTruthRechercheAusfuehrungsplan, { status: 'ready' }>

export type DiscoveryQueryIntent = Readonly<{
  sourceId: string
  domain: string
  query: string
}>

/** Internal projection of already validated canonical data, never a trust boundary. */
export function discoveryQueryIntents(
  request: OfficialTruthRechercheAnfrage,
  plan: ReadyPlan,
): readonly DiscoveryQueryIntent[] | null {
  if (plan.requestKey !== request.key || plan.ruleScopeKey !== request.ruleScopeKey
    || plan.factKind !== request.factKind) return null
  const { scope } = request
  const terms = [
    'official authority', scope.requirementType, request.factKind,
    `destination:${scope.destinationCountryCode}`,
    ...(scope.transitCountryCode ? [`transit:${scope.transitCountryCode}`] : []),
    ...(scope.citizenship.mode === 'required' ? scope.citizenship.countryCodes.map(code => `citizenship:${code}`) : []),
    ...(scope.credentialOption.mode === 'option'
      ? [`document:${scope.credentialOption.documentType}`, `issuer:${scope.credentialOption.issuingCountryCode}`] : []),
  ].join(' ')
  const intents: DiscoveryQueryIntent[] = []
  // The canonical plan already orders sources/domains; no ranking or truncation.
  for (const source of plan.sources) {
    for (const domain of source.domains) {
      if (intents.length === 6) return null
      intents.push(Object.freeze({ sourceId: source.sourceId, domain, query: `site:${domain} ${terms}` }))
    }
  }
  return Object.freeze(intents)
}
