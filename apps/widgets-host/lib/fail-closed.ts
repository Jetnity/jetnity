import contract from '../inert-contract.json'

/** Forged inputs exist so tests can prove the response does not branch on them. */
export type ForgedContext = {
  method?: string
  path?: string
  search?: string
  host?: string
  origin?: string
  referer?: string
  cookie?: string
  authorization?: string
}

export const INERT_STATUS = contract.status
export const INERT_BODY = contract.body
export const INERT_HEADERS = contract.headers

/**
 * Always the same inert 404. Callers must not pass raw Cookie or
 * Authorization from a live request. The argument is ignored on purpose.
 */
export function failClosed(_forged: ForgedContext = {}): Response {
  void _forged
  return new Response(INERT_BODY, {
    status: INERT_STATUS,
    headers: INERT_HEADERS,
  })
}
