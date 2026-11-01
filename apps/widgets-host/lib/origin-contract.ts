/**
 * S2 pins. widgets.jetnity.com is not the selected child host.
 * The vercel.app child is a different registrable site from jetnity.com.
 * 12Go general source is selected. DiscoverCars stays unselected.
 * Selection does not deploy the host, set the parent sandbox, or accept a CMP.
 */
export const SEPARATE_ORIGIN_CONTRACT = {
  parentOrigin: 'https://jetnity.com',
  childOrigin: 'https://jetnity-widgets.vercel.app',
  childHostname: 'jetnity-widgets.vercel.app',
  differentRegistrableSites: true,
  brandedSubdomainSelected: false,
  discovercarsSourceSelected: false,
  twelvegoSourceSelected: true,
  sameOriginSandboxScripts: 'prohibited',
  distinctChildSandboxScripts: 'permitted-only-for-pinned-child-origin',
  parentSandboxApplied: false,
  cmpAcceptance: false,
  deployment: 'source-only-not-activated',
} as const

export function originContractAllowsProviderScripts(): false {
  return false
}
