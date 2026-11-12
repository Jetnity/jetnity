import 'server-only'

import { readHumanRelease, type HumanRelease } from './human-contract'

// UNSELECTED. Only a separately reviewed Root source amendment may replace
// this null with the genuine method/package/window and expected prior head.
// No environment, browser, request or old draft supplies release authority.
const SELECTED_RELEASE: unknown = null

export function getHumanRelease(): HumanRelease | null {
  return readHumanRelease(SELECTED_RELEASE)
}
