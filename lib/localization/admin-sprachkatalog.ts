import { EINSTELLUNGEN_SCHLUESSEL, EINSTELLUNGEN_TEXTE } from './einstellungen-texte'
import { MARKETING_SCHLUESSEL, MARKETING_TEXTE } from './marketing-texte'
import { CMS_EDITOR_TEXT, type CmsTextKey } from './cms-editor-texte'

/** Only actual shipped text catalogs; no percentage or whole-product claim. */
export const ADMIN_SPRACHKATALOG: readonly Readonly<{ key: string; de: string; en: string }>[] = Object.freeze([
  ...EINSTELLUNGEN_SCHLUESSEL.map((key) => Object.freeze({ key, de: EINSTELLUNGEN_TEXTE.de[key], en: EINSTELLUNGEN_TEXTE.en[key] })),
  ...MARKETING_SCHLUESSEL.map((key) => Object.freeze({ key, de: MARKETING_TEXTE.de[key], en: MARKETING_TEXTE.en[key] })),
  ...(Object.keys(CMS_EDITOR_TEXT.de) as CmsTextKey[]).map((key) => Object.freeze({ key: `cms.${key}`, de: CMS_EDITOR_TEXT.de[key], en: CMS_EDITOR_TEXT.en[key] })),
])
