import { EINSTELLUNGEN_SCHLUESSEL, EINSTELLUNGEN_TEXTE } from './einstellungen-texte'
import { MARKETING_SCHLUESSEL, MARKETING_TEXTE } from './marketing-texte'

/** Only actual shipped text catalogs; no percentage or whole-product claim. */
export const ADMIN_SPRACHKATALOG: readonly Readonly<{ key: string; de: string; en: string }>[] = Object.freeze([
  ...EINSTELLUNGEN_SCHLUESSEL.map((key) => Object.freeze({ key, de: EINSTELLUNGEN_TEXTE.de[key], en: EINSTELLUNGEN_TEXTE.en[key] })),
  ...MARKETING_SCHLUESSEL.map((key) => Object.freeze({ key, de: MARKETING_TEXTE.de[key], en: MARKETING_TEXTE.en[key] })),
])
