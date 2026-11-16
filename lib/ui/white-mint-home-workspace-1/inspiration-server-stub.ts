import type { PublicInspiration } from '@/lib/inspiration/cms-public'
import { ENTDECKEN_ZIELE } from '@/lib/inspiration/explorer-1/katalog'

/** This browser fixture replaces only the server data boundary. The actual
 * async homepage and all of its rendered UI remain under the existing audit. */
export async function publicInspiration(): Promise<PublicInspiration> {
  return { status: 'static', ziele: ENTDECKEN_ZIELE }
}
