import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CMS_EDITOR_TEXT, cmsText, type CmsTextKey } from './cms-editor-texte'

test('all CMS controls, uncertainty and publication boundary have complete DE/EN copy', () => {
  assert.deepEqual(Object.keys(CMS_EDITOR_TEXT.en).sort(), Object.keys(CMS_EDITOR_TEXT.de).sort())
  for (const key of Object.keys(CMS_EDITOR_TEXT.de) as CmsTextKey[]) {
    for (const language of ['de', 'en'] as const) assert.ok(cmsText(language, key).trim().length > 0, `${language}:${key}`)
  }
  assert.match(CMS_EDITOR_TEXT.de.published, /öffentliche Anzeige ist noch nicht angeschlossen/)
  assert.match(CMS_EDITOR_TEXT.en.published, /public display is not connected/)
  assert.match(CMS_EDITOR_TEXT.de.pending, /nicht bestätigt/)
  assert.match(CMS_EDITOR_TEXT.en.pending, /not been confirmed/)
})
