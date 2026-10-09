import 'server-only'

/** The existing store is a guarded writer, not a trusted accepted-read capability.
 * No Evidence/Rule DTO, local research result or caller status is authority.
 * No accepted-reader injection is exposed. A future implementation requires a
 * separately reviewed server-held reader and full canonical scope revalidation.
 * Until then the existing engine must receive null and produce unavailable.
 */
export function chDeVisaReadBoundary() {
  return Object.freeze({ status: 'unavailable' as const, reason: 'trusted_accepted_reader_unavailable' as const,
    provider: null, acceptedEvidence: null, acceptedRule: null })
}
