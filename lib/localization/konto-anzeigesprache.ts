import 'server-only'

import { cache } from 'react'
import { uiEinstellungenFuerSeite } from '@/lib/account/ui-einstellungen-1/server'
import type { UiSprache } from './ui-sprache'

/**
 * Display preference only. React cache is scoped to this server request and
 * reuses the read for page, loading and metadata; it never stores user authority.
 */
export const kontoAnzeigesprache = cache(async (): Promise<UiSprache> => {
  const einstellungen = await uiEinstellungenFuerSeite()
  return einstellungen.status === 'bereit' ? einstellungen.sprache : 'de'
})
