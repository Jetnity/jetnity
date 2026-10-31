// Production banner gate. The release constant is false, so production never requests.

import { browserHostIstLizenziert } from '@/lib/legal/privacybee-vertrag'

import {
  CMP_BANNER_SRC,
  CMP_KILL_SWITCH_AUS,
  CMP_RELEASE_AUTHORIZED,
} from '@/lib/privacy/privacybee-cmp/vertrag'

export type BannerPlan =
  | { readonly request: false }
  | { readonly request: true; readonly src: typeof CMP_BANNER_SRC }

export function killSwitchDeniesCmp(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() === CMP_KILL_SWITCH_AUS
}

/**
 * Pure host/release matrix for tests and the bootstrap builder.
 * Production code must pass CMP_RELEASE_AUTHORIZED, which is false.
 */
export function planBannerInsert(input: {
  release: boolean
  hostname: string | null | undefined
  killSwitch?: string | null
}): BannerPlan {
  if (input.release !== true) return { request: false }
  if (killSwitchDeniesCmp(input.killSwitch)) return { request: false }
  if (!browserHostIstLizenziert(input.hostname)) return { request: false }
  return { request: true, src: CMP_BANNER_SRC }
}

export function cmpProductionBannerAllowed(input: {
  hostname: string | null | undefined
  killSwitch?: string | null
}): false {
  const plan = planBannerInsert({
    release: CMP_RELEASE_AUTHORIZED,
    hostname: input.hostname,
    killSwitch: input.killSwitch,
  })
  void plan
  return CMP_RELEASE_AUTHORIZED
}
