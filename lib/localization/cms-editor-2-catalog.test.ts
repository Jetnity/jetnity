import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ADMIN_SPRACHKATALOG } from './admin-sprachkatalog'
import { CMS_EDITOR_TEXT, type CmsTextKey } from './cms-editor-texte'

test('catalog exposes every CMS message with explicit German editorial content and unavailable runtime', () => {
  for (const key of Object.keys(CMS_EDITOR_TEXT.de) as CmsTextKey[]) {
    assert.deepEqual(ADMIN_SPRACHKATALOG.filter((row) => row.key === `cms.${key}`), [
      { key: `cms.${key}`, de: CMS_EDITOR_TEXT.de[key], en: CMS_EDITOR_TEXT.en[key] },
    ])
  }
  assert.match(CMS_EDITOR_TEXT.en.language, /content remains in German/)
  assert.match(CMS_EDITOR_TEXT.en.unavailableDetail, /cannot currently be saved or published/)
  assert.equal(new Set(ADMIN_SPRACHKATALOG.map(({ key }) => key)).size, ADMIN_SPRACHKATALOG.length)
})
