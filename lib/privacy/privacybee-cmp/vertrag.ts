// Official CMP surface. The banner URL lives only in this file.
// Legal page widgets keep their own scripts in lib/legal/privacybee-vertrag.ts.

import {
  PRIVACYBEE_KILL_SWITCH_AUS,
  PRIVACYBEE_LIZENZ_HOST,
  PRIVACYBEE_WEBSITE_ID,
} from '@/lib/legal/privacybee-vertrag'

export const CMP_BANNER_SRC = 'https://app.privacybee.io/cookie-banner.js'

export const CMP_WEBSITE_ID = PRIVACYBEE_WEBSITE_ID

export const CMP_LICENSE_HOST = PRIVACYBEE_LIZENZ_HOST

export const CMP_KILL_SWITCH_AUS = PRIVACYBEE_KILL_SWITCH_AUS

export const CMP_PREFERENCES_CLASS = 'privacybee-display-preferences'

/** Dedicated S2 release. False until a later reviewed package changes this source constant. */
export const CMP_RELEASE_AUTHORIZED = false as const

export const CMP_CATEGORIES = [
  'SECURITY_STORAGE',
  'FUNCTIONALITY_STORAGE',
  'ANALYTICS_STORAGE',
  'AD_STORAGE',
  'AD_USER_DATA',
  'AD_PERSONALIZATION',
  'PERSONALIZATION_STORAGE',
] as const

export type CmpCategory = (typeof CMP_CATEGORIES)[number]

export const CMP_NECESSARY_CATEGORIES = ['SECURITY_STORAGE', 'FUNCTIONALITY_STORAGE'] as const

export const CMP_OPTIONAL_CATEGORIES = [
  'ANALYTICS_STORAGE',
  'AD_STORAGE',
  'AD_USER_DATA',
  'AD_PERSONALIZATION',
  'PERSONALIZATION_STORAGE',
] as const

export type CmpOptionalCategory = (typeof CMP_OPTIONAL_CATEGORIES)[number]
