/** Persisted display preference; never an authority or a travel parameter. */
export type UiSprache = 'de' | 'en'

export const UI_SPRACHE_KEY = 'jetnity_ui_locale_v1'

export function uiSpracheLesen(wert: unknown): UiSprache | null {
  return wert === 'de' || wert === 'en' ? wert : null
}
