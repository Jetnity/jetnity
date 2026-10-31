/**
 * Facts for a later activation review. This module does not open a socket,
 * set a cookie, frame a page, or load a provider.
 *
 * widgets.jetnity.com and jetnity.com would be different origins on the same
 * registrable site. A cookie scoped at the parent registrable domain can be
 * sent to the widget host. Subdomain separation is not credential isolation.
 * Installing a script-capable sandbox on a same-origin frame is prohibited.
 * Provider scripts stay separately gated. Today's frame policy names no parent.
 */
export const SEPARATE_ORIGIN_CONTRACT = {
  intendedHostname: 'widgets.jetnity.com',
  mainSiteHostname: 'jetnity.com',
  differentOrigins: true,
  sameRegistrableSite: true,
  parentCookieDomain: '.jetnity.com',
  subdomainIsolatesCredentials: false,
  dnsActivation: 'no-go-until-cookie-and-consent-contracts-pass',
  sameOriginSandboxScripts: 'prohibited',
  providerScripts: 'separately-gated',
  frameAncestorsToday: 'none',
  deployment: 'inert-fail-closed',
} as const

export function originContractAllowsProviderScripts(): false {
  return false
}
