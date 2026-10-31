/**
 * S2 pins. widgets.jetnity.com is not the selected child host.
 * The vercel.app child is a different registrable site from jetnity.com.
 * Production provider entries stay unselected. Historical S1 documents remain.
 */
export const SEPARATE_ORIGIN_CONTRACT = {
  parentOrigin: 'https://jetnity.com',
  childOrigin: 'https://jetnity-widgets.vercel.app',
  childHostname: 'jetnity-widgets.vercel.app',
  differentRegistrableSites: true,
  brandedSubdomainSelected: false,
  productionProvidersSelected: false,
  sameOriginSandboxScripts: 'prohibited',
  distinctChildSandboxScripts: 'permitted-only-for-pinned-child-origin',
  deployment: 'source-only-not-activated',
} as const

export function originContractAllowsProviderScripts(): false {
  return false
}
