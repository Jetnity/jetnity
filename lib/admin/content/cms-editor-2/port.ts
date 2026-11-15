import type { CmsCommand } from '../cms/contract'
import type { CmsReadQuery } from './responses'

export type CmsFailure = 'conflict' | 'request_conflict' | 'invalid' | 'state' | 'missing'
  | 'forbidden' | 'unauthenticated' | 'rate_limit' | 'timeout' | 'unavailable'
export type CmsPortResult = Readonly<{ ok: true; value: unknown }> | Readonly<{ ok: false; code: CmsFailure }>

/** Transport only. A future server adapter must independently enforce current
 * identity, capability, AAL2 and the existing write gate before invoking RPCs. */
export type CmsPort = Readonly<{
  read(query: CmsReadQuery): Promise<CmsPortResult>
  command(command: CmsCommand): Promise<CmsPortResult>
  confirm(requestId: string): Promise<CmsPortResult>
}>

// No substitute storage, endpoint, RPC spelling trick or authority from props.
export const CMS_UNAVAILABLE_PORT: CmsPort = {
  async read() { return { ok: false, code: 'unavailable' } },
  async command() { return { ok: false, code: 'unavailable' } },
  async confirm() { return { ok: false, code: 'unavailable' } },
}
