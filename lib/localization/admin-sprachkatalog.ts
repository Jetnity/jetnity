import { ANALYTICS_SCHLUESSEL, ANALYTICS_TEXTE } from './analytics-texte'
import { BUCHUNGEN_SCHLUESSEL, BUCHUNGEN_TEXTE } from './buchungen-texte'
import { ADMIN_LESE_SCHLUESSEL, ADMIN_LESE_TEXTE } from './admin-lese-texte'
import { EINSTELLUNGEN_SCHLUESSEL, EINSTELLUNGEN_TEXTE } from './einstellungen-texte'
import { MARKETING_SCHLUESSEL, MARKETING_TEXTE } from './marketing-texte'
import { CMS_EDITOR_TEXT, type CmsTextKey } from './cms-editor-texte'

/** Only actual shipped text catalogs; no percentage or whole-product claim. */
export const ADMIN_SPRACHKATALOG: readonly Readonly<{ key: string; de: string; en: string }>[] = Object.freeze([
  ...ANALYTICS_SCHLUESSEL.map((key) => Object.freeze({ key, de: ANALYTICS_TEXTE.de[key], en: ANALYTICS_TEXTE.en[key] })),
  ...BUCHUNGEN_SCHLUESSEL.map((key) => Object.freeze({ key: `bookings.${key}`, de: BUCHUNGEN_TEXTE.de[key], en: BUCHUNGEN_TEXTE.en[key] })),
  ...ADMIN_LESE_SCHLUESSEL.map((key) => Object.freeze({ key, de: ADMIN_LESE_TEXTE.de[key], en: ADMIN_LESE_TEXTE.en[key] })),
  ...EINSTELLUNGEN_SCHLUESSEL.map((key) => Object.freeze({ key, de: EINSTELLUNGEN_TEXTE.de[key], en: EINSTELLUNGEN_TEXTE.en[key] })),
  ...MARKETING_SCHLUESSEL.map((key) => Object.freeze({ key, de: MARKETING_TEXTE.de[key], en: MARKETING_TEXTE.en[key] })),
  ...(Object.keys(CMS_EDITOR_TEXT.de) as CmsTextKey[]).map((key) => Object.freeze({ key: `cms.${key}`, de: CMS_EDITOR_TEXT.de[key], en: CMS_EDITOR_TEXT.en[key] })),
])
